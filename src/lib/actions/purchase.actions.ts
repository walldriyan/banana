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
        items: {
          include: {
            productBatch: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
    return { success: true, data: grns };
  } catch (error) {
    console.error('[getGrnsAction] Error:', error);
    return { success: false, error: "Failed to fetch purchase records." };
  }
}

/**
 * Server action to add a new GRN.
 * This is a transactional operation. It creates new product batches for each line item.
 */
export async function addGrnAction(data: GrnFormValues) {
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
            const paidAmount = headerData.paidAmount ?? 0;
            
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (headerData.totalAmount > 0 && paidAmount >= headerData.totalAmount) {
                paymentStatus = 'paid';
            } else if (paidAmount > 0) {
                paymentStatus = 'partial';
            }
            
            const grnItemsData = await Promise.all(items.map(async (item) => {
                const newBatch = await tx.productBatch.create({
                    data: {
                        productId: item.productId,
                        batchNumber: item.batchNumber,
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        quantity: item.quantity,
                        stock: item.quantity, // Initial stock is the quantity
                        supplierId: headerData.supplierId,
                        addedDate: new Date(),
                        // Add the missing discount and tax fields
                        discount: item.discount,
                        discountType: item.discountType,
                        tax: item.tax,
                        taxtype: item.taxType,
                    }
                });
                return {
                    productBatchId: newBatch.id,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    discount: item.discount,
                    tax: item.tax,
                    total: item.total,
                    discountType: item.discountType,
                    taxType: item.taxType,
                };
            }));

            const newGrn = await tx.goodsReceivedNote.create({
                 data: {
                    ...headerData,
                    paymentStatus: paymentStatus,
                    items: {
                        create: grnItemsData,
                    }
                }
            });

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
          maxWait: 15000,
          timeout: 30000,
        });

        revalidatePath('/dashboard/purchases');
        revalidatePath('/dashboard/products');
        revalidatePath('/dashboard/credit');
        
        return { success: true, data: result };

    } catch (error) {
        console.error('[addGrnAction] Error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2002') {
                 return { success: false, error: `Unique constraint failed. A batch with the same Product and Batch Number might already exist.` };
            }
             return { success: false, error: `Prisma Error (${error.code}): ${error.message}` };
        }
        return { success: false, error: `Failed to create GRN: ${errorMessage}` };
    }
}


/**
 * Server action to update an existing GRN.
 * NOTE: Updating a GRN is a complex operation that should be handled with care,
 * as it affects stock levels. This implementation is simplified and might need
 * more robust logic for production use (e.g., handling stock adjustments).
 */
export async function updateGrnAction(grnId: string, data: GrnFormValues) {
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
            // Updating stock on GRN update is complex.
            // A simple approach is to revert old stock and apply new stock.
            // This is a placeholder for that complex logic.
            // For now, we'll just update the GRN details.
            
            const paidAmount = headerData.paidAmount ?? 0;
            const totalAmount = headerData.totalAmount;
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
             if (totalAmount > 0 && paidAmount >= totalAmount) {
                paymentStatus = 'paid';
            } else if (paidAmount > 0) {
                paymentStatus = 'partial';
            }

            const updatedGrn = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    ...headerData,
                    paymentStatus: paymentStatus,
                    // This simple update doesn't handle stock changes correctly.
                    // A real-world scenario would require more logic.
                    // We are just updating the financial details for now.
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


/**
 * Deletes a GRN and its associated items and batches, but only if it's safe to do so.
 */
export async function deleteGrnAction(grnId: string) {
    try {
        // --- Validation Step 1: Check for payments ---
        const paymentCount = await prisma.purchasePayment.count({
            where: { goodsReceivedNoteId: grnId },
        });
        if (paymentCount > 0) {
            return {
                success: false,
                error: `Cannot delete. This GRN has ${paymentCount} payment(s) recorded. Please delete the payments first from the Credit Management page.`,
            };
        }

        // --- Validation Step 2: Check if products from this GRN have been sold ---
        // Find all batch IDs created by this GRN
        const grnItems = await prisma.goodsReceivedNoteItem.findMany({
            where: { grnId: grnId },
            select: { productBatchId: true },
        });
        const batchIds = grnItems.map(item => item.productBatchId);

        if (batchIds.length > 0) {
            const transactionLineCount = await prisma.transactionLine.count({
                where: {
                    productBatchId: { in: batchIds },
                },
            });
            if (transactionLineCount > 0) {
                return {
                    success: false,
                    error: `Cannot delete. Products from this GRN have been sold in ${transactionLineCount} transaction line(s).`,
                };
            }
        }
        
        // --- Deletion Step ---
        const result = await prisma.$transaction(async (tx) => {
            // Delete GRN items first (cascading deletes are not relied upon here for clarity)
            await tx.goodsReceivedNoteItem.deleteMany({
                where: { grnId: grnId },
            });

            // Delete the product batches that were created by this GRN
            if (batchIds.length > 0) {
                await tx.productBatch.deleteMany({
                    where: { id: { in: batchIds } },
                });
            }

            // Finally, delete the GRN header
            const deletedGrn = await tx.goodsReceivedNote.delete({
                where: { id: grnId },
            });
            
            return deletedGrn;
        });

        revalidatePath('/dashboard/purchases');
        revalidatePath('/dashboard/products');

        return { success: true, data: result };

    } catch (error) {
        console.error(`[deleteGrnAction] Error deleting GRN ${grnId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2025') { // Foreign key constraint failed
                return { success: false, error: `Prisma Error (P2025): Record to delete does not exist or a related record could not be deleted.` };
            }
             return { success: false, error: `Prisma Error (${error.code}): ${error.message}` };
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to delete GRN: ${errorMessage}` };
    }
}
