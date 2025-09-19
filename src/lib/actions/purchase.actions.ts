// src/lib/actions/purchase.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { grnSchema, type GrnFormValues } from "@/lib/validation/grn.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all GRNs.
 */
export async function getGrnsAction() {
  try {
    const grns = await prisma.goodsReceivedNote.findMany({
      orderBy: { grnDate: 'desc' },
      include: {
        supplier: true, // Include supplier details
        items: true, // Include the line items
      }
    });
    return { success: true, data: grns };
  } catch (error) {
    console.error('[getGrnsAction] Error:', error);
    return { success: false, error: "Failed to fetch purchase records." };
  }
}

/**
 * Server action to add a new GRN.
 * This is a transactional operation: it saves the GRN and updates product stock.
 */
export async function addGrnAction(data: GrnFormValues) {
    console.log('[addGrnAction] Received data on server:', data);
    const validationResult = grnSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    const { items, ...headerData } = validationResult.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const calculatedTotalAmount = items.reduce((sum, item) => sum + item.total, 0);
            
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (headerData.paidAmount >= calculatedTotalAmount) {
                paymentStatus = 'paid';
            } else if (headerData.paidAmount > 0) {
                paymentStatus = 'partial';
            }

            const newGrn = await tx.goodsReceivedNote.create({
                data: {
                    ...headerData,
                    totalAmount: calculatedTotalAmount,
                    paymentStatus: paymentStatus,
                    items: {
                        create: items.map(item => ({
                            // We use the unique product.id from the form as the reference
                            productId: item.productId, 
                            batchNumber: item.batchNumber,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            discount: item.discount,
                            tax: item.tax,
                            total: item.total,
                        })),
                    },
                },
                include: { items: true }
            });

            for (const item of newGrn.items) {
                const existingBatch = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (existingBatch && existingBatch.batchNumber === item.batchNumber) {
                    await tx.product.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: item.quantity },
                            stock: { increment: item.quantity },
                            costPrice: item.costPrice,
                        }
                    });
                } else {
                    const productInfoFromExistingBatch = await tx.product.findUnique({
                        where: { id: item.productId }
                    });

                    if (!productInfoFromExistingBatch) {
                        throw new Error(`Critical error: Could not find base product with ID ${item.productId} to create a new batch from.`);
                    }
                    
                    const productMaster = await tx.product.findFirst({
                        where: { productId: productInfoFromExistingBatch.productId },
                        orderBy: { addeDate: 'desc' }
                    });

                    if (!productMaster) {
                       throw new Error(`Cannot create new batch. No existing product found for general productId: ${productInfoFromExistingBatch.productId}. Add the product manually first.`);
                    }
                    
                    const { id, ...masterDataToClone } = productMaster;

                    await tx.product.create({
                       data: {
                           ...masterDataToClone,
                           batchNumber: item.batchNumber || `B-${Date.now()}`,
                           quantity: item.quantity,
                           stock: item.quantity,
                           costPrice: item.costPrice,
                           sellingPrice: productMaster.sellingPrice,
                           addeDate: new Date(),
                           units: productMaster.units,
                       }
                    });
                }
            }
            
            if (newGrn.paidAmount > 0) {
              await tx.purchasePayment.create({
                data: {
                  goodsReceivedNoteId: newGrn.id,
                  amount: newGrn.paidAmount,
                  paymentDate: newGrn.grnDate,
                  paymentMethod: newGrn.paymentMethod,
                  notes: 'Initial payment with GRN creation.',
                },
              });
            }

            return newGrn;
        });

        revalidatePath('/dashboard/purchases');
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/credit');
        
        return { success: true, data: result };

    } catch (error) {
        console.error('[addGrnAction] Error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to create GRN: ${errorMessage}` };
    }
}


/**
 * Server action to update an existing GRN.
 * This is a transactional operation: it calculates stock adjustments and updates the GRN.
 */
export async function updateGrnAction(grnId: string, data: GrnFormValues) {
    console.log('[updateGrnAction] Received data for GRN ID:', grnId, data);
    const validationResult = grnSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    const { items: newItems, ...headerData } = validationResult.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const oldGrn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
                include: { items: true },
            });

            if (!oldGrn) {
                throw new Error(`GRN with ID ${grnId} not found.`);
            }

            const stockAdjustments = new Map<string, number>();

            for (const oldItem of oldGrn.items) {
                const currentAdjustment = stockAdjustments.get(oldItem.productId) || 0;
                stockAdjustments.set(oldItem.productId, currentAdjustment - oldItem.quantity);
            }

            for (const newItem of newItems) {
                const currentAdjustment = stockAdjustments.get(newItem.productId) || 0;
                stockAdjustments.set(newItem.productId, currentAdjustment + newItem.quantity);
            }

            for (const [productId, adjustment] of stockAdjustments.entries()) {
                if (adjustment !== 0) {
                     await tx.product.update({
                        where: { id: productId },
                        data: {
                            quantity: { increment: adjustment },
                            stock: { increment: adjustment },
                        },
                    });
                }
            }
            
            const calculatedTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);

            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
             if (headerData.paidAmount >= calculatedTotalAmount) {
                paymentStatus = 'paid';
            } else if (headerData.paidAmount > 0) {
                paymentStatus = 'partial';
            }

            const updatedGrn = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    ...headerData,
                    totalAmount: calculatedTotalAmount,
                    paymentStatus: paymentStatus,
                    items: {
                        deleteMany: {},
                        create: newItems.map(item => ({
                            productId: item.productId,
                            batchNumber: item.batchNumber,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            discount: item.discount,
                            tax: item.tax,
                            total: item.total,
                        })),
                    },
                },
            });

            return updatedGrn;
        });
        
        revalidatePath('/dashboard/purchases');
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/credit');
        
        return { success: true, data: result };

    } catch (error) {
        console.error(`[updateGrnAction] Error updating GRN ${grnId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update GRN: ${errorMessage}` };
    }
}
