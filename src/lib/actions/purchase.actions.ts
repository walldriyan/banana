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
export async function addGrnAction(data: GrnFormValues & { totalAmount: number }) {
    console.log('[addGrnAction] Received data on server:', data);
    const validationResult = grnSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    const { items, totalAmount, ...headerData } = validationResult.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const paidAmount = headerData.paidAmount ?? 0;
            
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (paidAmount >= totalAmount) {
                paymentStatus = 'paid';
            } else if (paidAmount > 0) {
                paymentStatus = 'partial';
            }
            
            // Create GRN Header first without items
            const newGrn = await tx.goodsReceivedNote.create({
                 data: {
                    ...headerData,
                    paidAmount: paidAmount,
                    totalAmount: totalAmount,
                    paymentStatus: paymentStatus,
                }
            });

            // Process each item to update stock and create GRN line items
            for (const item of items) {
                // Find if the exact batch exists
                 const existingBatch = await tx.product.findFirst({
                    where: { 
                        productId: {
                            // Find the product based on the general ID, not unique batch ID
                            equals: (await tx.product.findUnique({where: {id: item.productId}}))?.productId
                        },
                        batchNumber: item.batchNumber 
                    }
                });

                let productBatchRecord;
                if (existingBatch) {
                    // Batch exists, update it
                    productBatchRecord = await tx.product.update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: item.quantity },
                            stock: { increment: item.quantity },
                            costPrice: item.costPrice,
                        }
                    });
                } else {
                    // New batch, need to create it
                    const productMaster = await tx.product.findFirst({
                       where: { productId: (await tx.product.findUnique({where: {id: item.productId}}))?.productId },
                    });

                    if (!productMaster) {
                        throw new Error(`Cannot create new batch. No master product found for ID: ${item.productId}. This should not happen.`);
                    }
                    const { id, quantity, stock, batchNumber, ...masterDataToClone } = productMaster;

                    productBatchRecord = await tx.product.create({
                        data: {
                            ...masterDataToClone,
                            batchNumber: item.batchNumber || `B-${Date.now()}`,
                            barcode: `${masterDataToClone.barcode}-${item.batchNumber || Date.now()}`,
                            quantity: item.quantity,
                            stock: item.quantity,
                            costPrice: item.costPrice,
                            addeDate: new Date(),
                            units: masterDataToClone.units as string,
                        }
                    });
                }
                
                // Create the GRN line item linked to the correct product batch record
                await tx.goodsReceivedNoteItem.create({
                    data: {
                        goodsReceivedNoteId: newGrn.id,
                        productId: productBatchRecord.id, // Link to the specific batch record
                        batchNumber: productBatchRecord.batchNumber,
                        quantity: item.quantity,
                        costPrice: item.costPrice,
                        discount: item.discount,
                        tax: item.tax,
                        total: item.total,
                    }
                });
            }
            
            if (paidAmount > 0) {
              await tx.purchasePayment.create({
                data: {
                  goodsReceivedNoteId: newGrn.id,
                  amount: paidAmount,
                  paymentDate: newGrn.grnDate,
                  paymentMethod: newGrn.paymentMethod,
                  notes: 'Initial payment with GRN creation.',
                },
              });
            }

            return newGrn;
        }, {
          maxWait: 10000, // 10 seconds
          timeout: 20000, // 20 seconds
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
export async function updateGrnAction(grnId: string, data: GrnFormValues & { totalAmount: number }) {
    console.log('[updateGrnAction] Received data for GRN ID:', grnId, data);
    const validationResult = grnSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    const { items: newItems, totalAmount, ...headerData } = validationResult.data;

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
            
            const paidAmount = headerData.paidAmount ?? 0;
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
             if (paidAmount >= totalAmount) {
                paymentStatus = 'paid';
            } else if (paidAmount > 0) {
                paymentStatus = 'partial';
            }

            const updatedGrn = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    ...headerData,
                    paidAmount: paidAmount,
                    totalAmount: totalAmount,
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
