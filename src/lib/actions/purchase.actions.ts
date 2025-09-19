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
 * This is a transactional operation: it saves the GRN and creates NEW product batches for each line item.
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
            const paidAmount = headerData.paidAmount ?? 0;
            const totalAmount = headerData.totalAmount;
            
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (totalAmount > 0 && paidAmount >= totalAmount) {
                paymentStatus = 'paid';
            } else if (paidAmount > 0) {
                paymentStatus = 'partial';
            }
            
            const newGrn = await tx.goodsReceivedNote.create({
                 data: {
                    ...headerData,
                    paymentStatus: paymentStatus,
                }
            });

            // For each item in the GRN, create a new product batch record.
            for (const item of items) {
                // Find an existing product with the same productId to use as a template for common data.
                // The `item.productId` here comes from the search input, which is a unique `id` of an existing batch.
                const productTemplate = await tx.product.findUnique({ where: { id: item.productId } });
                
                if (!productTemplate) {
                     throw new Error(`Product template with ID '${item.productId}' not found. Cannot create new batch.`);
                }
                
                // Clone the master data, but leave out fields that are specific to a batch.
                const { id, quantity, stock, batchNumber, barcode, costPrice, addeDate, ...masterDataToClone } = productTemplate;

                // Create the new product batch in the Product table.
                const newBatch = await tx.product.create({
                    data: {
                        ...masterDataToClone, // Clones name, category, brand, units etc.
                        productId: productTemplate.productId, // Use the master productId
                        batchNumber: item.batchNumber, // Use the new batch number from the form
                        barcode: `${productTemplate.productId}-${item.batchNumber}`, // Create a new unique barcode
                        quantity: item.quantity,
                        stock: item.quantity,
                        costPrice: item.costPrice,
                        addeDate: new Date(),
                        // Ensure units are carried over as a string
                        units: typeof masterDataToClone.units === 'string' ? masterDataToClone.units : JSON.stringify(masterDataToClone.units),
                        supplierId: headerData.supplierId,
                    }
                });
                
                // Create the line item for the GRN, linking to the newly created batch.
                await tx.goodsReceivedNoteItem.create({
                    data: {
                        goodsReceivedNoteId: newGrn.id,
                        productId: newBatch.id, // Link to the new batch's unique ID
                        batchNumber: newBatch.batchNumber,
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
          maxWait: 15000, // Increased wait time
          timeout: 30000, // Increased timeout
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

            // This logic is complex and prone to errors. For now, we assume updates don't change stock
            // until a proper stock reconciliation system is built.
            // We will just update the GRN details.
            
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
                    items: {
                        deleteMany: {},
                        create: newItems.map(item => ({
                            productId: item.productId, // This should be the unique ID of the product batch
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

            // Note: Stock adjustment on update is disabled to prevent data corruption.
            // A dedicated stock adjustment feature would be required to handle this safely.

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
