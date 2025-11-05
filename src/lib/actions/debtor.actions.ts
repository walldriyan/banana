// src/lib/actions/debtor.actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { debtorPaymentSchema, type DebtorPaymentFormValues } from '@/lib/validation/debtor.schema';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Fetches all transactions that have an outstanding balance (debtors).
 */
export async function getDebtorTransactionsAction() {
  try {
    const debtorTransactions = await prisma.transaction.findMany({
      where: {
        paymentStatus: {
          in: ['pending', 'partial'],
        },
      },
      include: {
        customer: true,
        _count: {
          select: { salePayments: true },
        },
         salePayments: {
          select: { amount: true }
        }
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Calculate total paid for each transaction
    const transactionsWithPaidAmount = debtorTransactions.map(tx => ({
      ...tx,
      totalPaid: tx.salePayments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return { success: true, data: transactionsWithPaidAmount };
  } catch (error) {
    console.error('[getDebtorTransactionsAction] Error:', error);
    return { success: false, error: 'Failed to fetch debtor transactions.' };
  }
}

/**
 * Fetches a single debtor transaction by its ID.
 */
export async function getDebtorTransactionByIdAction(transactionId: string) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                customer: true,
                _count: {
                    select: { salePayments: true },
                },
            },
        });

        if (!transaction) {
            return { success: false, error: 'Transaction not found.' };
        }

        const paymentAggr = await prisma.salePayment.aggregate({
            _sum: { amount: true },
            where: { transactionId: transaction.id },
        });

        const transactionWithPaidAmount = {
            ...transaction,
            totalPaid: paymentAggr._sum.amount || 0,
        };

        return { success: true, data: transactionWithPaidAmount };
    } catch (error) {
        console.error(`[getDebtorTransactionByIdAction] Error fetching transaction ${transactionId}:`, error);
        return { success: false, error: 'Failed to fetch transaction details.' };
    }
}


/**
 * Fetches all payments for a specific sales transaction.
 */
export async function getPaymentsForSaleAction(transactionId: string) {
    try {
        const payments = await prisma.salePayment.findMany({
            where: { transactionId: transactionId },
            orderBy: { paymentDate: 'desc' },
        });
        return { success: true, data: payments };
    } catch (error) {
        console.error(`[getPaymentsForSaleAction] Error fetching payments for transaction ${transactionId}:`, error);
        return { success: false, error: 'Failed to fetch payments.' };
    }
}


/**
 * Adds a new payment to a sales transaction and updates its payment status.
 */
export async function addSalePaymentAction(data: DebtorPaymentFormValues) {
    const validation = debtorPaymentSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    const { transactionId, ...paymentData } = validation.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
            });
            if (!transaction) throw new Error('Transaction not found.');

            const newPayment = await tx.salePayment.create({
                data: {
                    ...paymentData,
                    transactionId: transactionId,
                }
            });

            const totalPaidAggr = await tx.salePayment.aggregate({
                _sum: { amount: true },
                where: { transactionId: transactionId },
            });
            const newTotalPaid = totalPaidAggr._sum.amount || 0;

            let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
            if (newTotalPaid >= transaction.finalTotal) {
                newStatus = 'paid';
            } else if (newTotalPaid === 0) {
                newStatus = 'pending';
            }

            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    paymentStatus: newStatus,
                },
            });

            return newPayment;
        });

        revalidatePath('/dashboard/debtors');
        revalidatePath('/history');

        return { success: true, data: result };

    } catch (error) {
        console.error('[addSalePaymentAction] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to add payment.' };
    }
}


/**
 * Deletes a sales payment and updates the transaction's payment status.
 */
export async function deleteSalePaymentAction(paymentId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const paymentToDelete = await tx.salePayment.findUnique({
                where: { id: paymentId },
            });
            if (!paymentToDelete) throw new Error('Payment not found.');

            const { transactionId } = paymentToDelete;

            await tx.salePayment.delete({ where: { id: paymentId } });

            const totalPaidAggr = await tx.salePayment.aggregate({
                _sum: { amount: true },
                where: { transactionId },
            });
            const newTotalPaid = totalPaidAggr._sum.amount || 0;

            const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
            if (!transaction) throw new Error('Associated transaction not found.');

            let newStatus: 'pending' | 'partial' | 'paid' = 'partial';
            if (newTotalPaid >= transaction.finalTotal) {
                newStatus = 'paid';
            } else if (newTotalPaid === 0) {
                newStatus = 'pending';
            }

            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    paymentStatus: newStatus,
                },
            });

            return { deletedPaymentId: paymentId };
        });

        revalidatePath('/dashboard/debtors');
        revalidatePath('/history');

        return { success: true, data: result };
    } catch (error) {
        console.error('[deleteSalePaymentAction] Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to delete payment.' };
    }
}
