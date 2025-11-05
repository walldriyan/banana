// src/lib/actions/credit.actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { paymentSchema, type PaymentFormValues } from '@/lib/validation/credit.schema';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Fetches all GRNs that have an outstanding balance.
 * This now includes GRNs where paidAmount < totalAmount OR status is pending/partial,
 * ensuring old records without a status are also fetched.
 */
export async function getCreditorGrnsAction() {
  try {
    const creditorGrns = await prisma.goodsReceivedNote.findMany({
      where: {
        OR: [
          {
            paymentStatus: {
              in: ['pending', 'partial'],
            },
          },
          {
            paidAmount: {
              lt: prisma.goodsReceivedNote.fields.totalAmount
            }
          }
        ]
      },
      include: {
        supplier: true,
        _count: {
          select: { payments: true },
        },
         payments: {
          select: { amount: true }
        }
      },
      orderBy: {
        grnDate: 'asc',
      },
    });

    // Calculate total paid for each GRN on the server
    const grnsWithPaidAmount = creditorGrns.map(grn => ({
      ...grn,
      totalPaid: grn.payments.reduce((sum, p) => sum + p.amount, 0),
    }));


    return { success: true, data: grnsWithPaidAmount };
  } catch (error) {
    console.error('[getCreditorGrnsAction] Error:', error);
    return { success: false, error: 'Failed to fetch creditor GRNs.' };
  }
}

/**
 * Fetches a single creditor GRN by its ID.
 */
export async function getCreditGrnByIdAction(grnId: string) {
    try {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id: grnId },
            include: {
                supplier: true,
                _count: {
                    select: { payments: true },
                },
            },
        });

        if (!grn) {
            return { success: false, error: 'GRN not found.' };
        }

        const paymentAggr = await prisma.purchasePayment.aggregate({
            _sum: { amount: true },
            where: { goodsReceivedNoteId: grn.id },
        });

        const grnWithPaidAmount = {
            ...grn,
            totalPaid: paymentAggr._sum.amount || 0,
        };

        return { success: true, data: grnWithPaidAmount };
    } catch (error) {
        console.error(`[getCreditGrnByIdAction] Error fetching GRN ${grnId}:`, error);
        return { success: false, error: 'Failed to fetch GRN details.' };
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
