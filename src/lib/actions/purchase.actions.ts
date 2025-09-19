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
            // 1. Create the GRN Header
            const newGrn = await tx.goodsReceivedNote.create({
                data: {
                    ...headerData,
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
                include: {
                    items: true,
                }
            });

            // 2. Update stock for each product in the GRN
            for (const item of newGrn.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            increment: item.quantity,
                        },
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }
            
            // 3. If an initial payment was made, record it
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
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return { success: false, error: `Database error: ${error.message}` };
        }
        return { success: false, error: "Failed to create GRN and update stock." };
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
            // 1. Get the current state of the GRN from the DB
            const oldGrn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
                include: { items: true },
            });

            if (!oldGrn) {
                throw new Error(`GRN with ID ${grnId} not found.`);
            }

            // 2. Calculate stock adjustments
            const stockAdjustments = new Map<string, number>();

            // Decrement stock based on old items
            for (const oldItem of oldGrn.items) {
                const currentAdjustment = stockAdjustments.get(oldItem.productId) || 0;
                stockAdjustments.set(oldItem.productId, currentAdjustment - oldItem.quantity);
            }

            // Increment stock based on new items
            for (const newItem of newItems) {
                const currentAdjustment = stockAdjustments.get(newItem.productId) || 0;
                stockAdjustments.set(newItem.productId, currentAdjustment + newItem.quantity);
            }

            // 3. Apply stock adjustments to products
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
            
            // 4. Update the GRN itself
            // For simplicity, we are assuming that initial payments are not editable via this form.
            // Payment management will be handled separately.
            const updatedGrn = await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    ...headerData,
                    items: {
                        // Delete old items and create new ones
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
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return { success: false, error: `Database error: ${error.message}` };
        }
        return { success: false, error: "Failed to update GRN and adjust stock." };
    }
}
