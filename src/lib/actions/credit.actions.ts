// src/lib/actions/credit.actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { paymentSchema, type PaymentFormValues } from '@/lib/validation/credit.schema';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Fetches all GRNs that have a 'pending' or 'partial' payment status.
 */
export async function getCreditorGrnsAction() {
  try {
    const creditorGrns = await prisma.goodsReceivedNote.findMany({
      where: {
        paymentStatus: {
          in: ['pending', 'partial'],
        },
      },
      include: {
        supplier: true,
        _count: {
          select: { payments: true },
        },
      },
      orderBy: {
        grnDate: 'asc',
      },
    });

    // Calculate total paid for each GRN
    const grnsWithPaidAmount = await Promise.all(
      creditorGrns.map(async (grn) => {
        const paymentAggr = await prisma.purchasePayment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            goodsReceivedNoteId: grn.id,
          },
        });
        return {
          ...grn,
          totalPaid: paymentAggr._sum.amount || 0,
        };
      })
    );

    return { success: true, data: grnsWithPaidAmount };
  } catch (error) {
    console.error('[getCreditorGrnsAction] Error:', error);
    return { success: false, error: 'Failed to fetch creditor GRNs.' };
  }
}


/**
 * Fetches all payments for a specific GRN.
 */
export async function getPaymentsForGrnAction(grnId: string) {
    try {
        const payments = await prisma.purchasePayment.findMany({
            where: { goodsReceivedNoteId: grnId },
            orderBy: { paymentDate: 'desc' },
        });
        return { success: true, data: payments };
    } catch (error) {
        console.error(`[getPaymentsForGrnAction] Error fetching payments for GRN ${grnId}:`, error);
        return { success: false, error: 'Failed to fetch payments.' };
    }
}


/**
 * Adds a new payment to a GRN and updates the GRN's payment status.
 */
export async function addPaymentAction(data: PaymentFormValues) {
    const validation = paymentSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    const { grnId, ...paymentData } = validation.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch the GRN to ensure it exists and get its total amount
            const grn = await tx.goodsReceivedNote.findUnique({
                where: { id: grnId },
            });
            if (!grn) throw new Error('GRN not found.');

            // 2. Create the new payment record
            const newPayment = await tx.purchasePayment.create({
                data: {
                    ...paymentData,
                    goodsReceivedNoteId: grnId,
                }
            });

            // 3. Get the new total paid amount
            const totalPaidAggr = await tx.purchasePayment.aggregate({
                _sum: { amount: true },
                where: { goodsReceivedNoteId: grnId },
            });
            const newTotalPaid = totalPaidAggr._sum.amount || 0;

            // 4. Determine the new payment status
            let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
            if (newTotalPaid >= grn.totalAmount) {
                newStatus = 'paid';
            } else if (newTotalPaid === 0) {
                newStatus = 'pending';
            }

            // 5. Update the GRN's paid amount and status
            await tx.goodsReceivedNote.update({
                where: { id: grnId },
                data: {
                    paidAmount: newTotalPaid,
                    paymentStatus: newStatus,
                },
            });

            return newPayment;
        });

        revalidatePath('/dashboard/credit');
        revalidatePath('/dashboard/purchases');

        return { success: true, data: result };

    } catch (error) {
        console.error('[addPaymentAction] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add payment.' };
    }
}


/**
 * Deletes a payment and updates the GRN's payment status.
 */
export async function deletePaymentAction(paymentId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find the payment to get its amount and associated GRN ID
            const paymentToDelete = await tx.purchasePayment.findUnique({
                where: { id: paymentId },
            });
            if (!paymentToDelete) throw new Error('Payment not found.');

            const { goodsReceivedNoteId } = paymentToDelete;

            // 2. Delete the payment
            await tx.purchasePayment.delete({ where: { id: paymentId } });

            // 3. Recalculate the total paid amount for the GRN
             const totalPaidAggr = await tx.purchasePayment.aggregate({
                _sum: { amount: true },
                where: { goodsReceivedNoteId },
            });
            const newTotalPaid = totalPaidAggr._sum.amount || 0;

            // 4. Get the GRN's total amount
            const grn = await tx.goodsReceivedNote.findUnique({ where: { id: goodsReceivedNoteId } });
            if (!grn) throw new Error('Associated GRN not found.');

            // 5. Determine the new payment status
             let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
            if (newTotalPaid >= grn.totalAmount) {
                newStatus = 'paid';
            } else if (newTotalPaid === 0) {
                newStatus = 'pending';
            }

            // 6. Update the GRN's paid amount and status
            await tx.goodsReceivedNote.update({
                where: { id: goodsReceivedNoteId },
                data: {
                    paidAmount: newTotalPaid,
                    paymentStatus: newStatus,
                },
            });

            return { deletedPaymentId: paymentId };
        });

        revalidatePath('/dashboard/credit');
        revalidatePath('/dashboard/purchases');

        return { success: true, data: result };
    } catch (error) {
        console.error('[deletePaymentAction] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete payment.' };
    }
}
