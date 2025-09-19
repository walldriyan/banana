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
                // Find if a product with the same general productId and new batch number exists.
                const existingBatch = await tx.product.findFirst({
                    where: { 
                        productId: item.productId,
                        batchNumber: item.batchNumber
                    }
                });

                if (existingBatch) {
                     // Case 1: The exact batch was found. We just update its stock.
                     await tx.product.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: item.quantity },
                            stock: { increment: item.quantity },
                            costPrice: item.costPrice,
                        }
                    });
                } else {
                    // Case 2: The batch was not found. Create a NEW product entry for this new batch.
                    // First, get the master data from an existing batch of the same product.
                    const productMaster = await tx.product.findFirst({
                        where: { productId: item.productId }, 
                    });

                     if (!productMaster) {
                       throw new Error(`Cannot create new batch. No master product found for general productId: ${item.productId}. Add the product manually first.`);
                    }
                    
                    // Clone master data, but exclude unique fields that need to be regenerated.
                    const { id, quantity, stock, batchNumber, barcode, ...masterDataToClone } = productMaster;

                    await tx.product.create({
                       data: {
                           ...masterDataToClone, // Clones name, category, brand, units, productId etc.
                           batchNumber: item.batchNumber || `B-${Date.now()}`,
                           barcode: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate a new unique barcode
                           quantity: item.quantity,
                           stock: item.quantity,
                           costPrice: item.costPrice,
                           addeDate: new Date(),
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
