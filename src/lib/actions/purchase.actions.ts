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
 * This is a transactional operation. It now uses a "No Template" model.
 * It assumes the frontend provides all necessary information for each line item
 * to create a new product batch from scratch. It does not rely on finding an
 * existing product to clone data.
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

            for (const item of items) {
                // ALWAYS create a new product batch record for each GRN line item.
                const newProductBatch = await tx.product.create({
                    data: {
                        name: item.name, // From frontend
                        productId: item.productId, // From frontend
                        batchNumber: item.batchNumber, // From frontend
                        sellingPrice: item.sellingPrice, // From frontend
                        category: item.category, // From frontend
                        brand: item.brand, // From frontend
                        units: JSON.stringify(item.units), // From frontend
                        
                        costPrice: item.costPrice,
                        quantity: item.quantity,
                        stock: item.quantity, // Initial stock is the GRN quantity
                        
                        supplierId: headerData.supplierId,
                        addeDate: new Date(),
                        isActive: true,
                        isService: false,
                        
                        // Defaulting other nullable fields
                        barcode: `${item.productId}-${item.batchNumber}`,
                        tax: 0,
                        defaultDiscount: 0,
                    }
                });
                
                await tx.goodsReceivedNoteItem.create({
                    data: {
                        goodsReceivedNoteId: newGrn.id,
                        // productId: newProductBatch.id, // This is incorrect
                        product: {
                            connect: { id: newProductBatch.id },
                        },
                        batchNumber: newProductBatch.batchNumber,
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
             return { success: false, error: `Prisma Error (${error.code}): ${error.message}` };
        }
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

            // Note: Stock adjustment on update is a complex operation.
            // For now, this action will primarily update GRN details and items,
            // assuming stock changes are handled separately or that GRNs are immutable once created.
            
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
                        deleteMany: {}, // Delete old items
                        create: newItems.map(item => ({ // Create new items
                            product: {
                                connect: { id: item.productId }
                            },
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
