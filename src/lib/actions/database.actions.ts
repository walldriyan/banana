// src/lib/actions/database.actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

/**
 * Saves a complete transaction object to the SQLite database via Prisma.
 * @param transactionData - The complete transaction object.
 */
export async function saveTransactionToDb(transactionData: DatabaseReadyTransaction) {
  const {
    transactionHeader,
    transactionLines,
    appliedDiscountsLog,
    customerDetails,
    paymentDetails,
  } = transactionData;

  // Use a transaction to ensure all or nothing is written
  return prisma.$transaction(async (tx) => {
    // Find or create the customer
    let customer = await tx.customer.findFirst({
      where: { name: customerDetails.name }, // Simple find by name for this example
    });

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: customerDetails.name,
          phone: customerDetails.phone,
          address: customerDetails.address,
        },
      });
    }

    // Create the main transaction record
    const newTransaction = await tx.transaction.create({
      data: {
        id: transactionHeader.transactionId,
        transactionDate: transactionHeader.transactionDate,
        subtotal: transactionHeader.subtotal,
        totalDiscountAmount: transactionHeader.totalDiscountAmount,
        finalTotal: transactionHeader.finalTotal,
        totalItems: transactionHeader.totalItems,
        totalQuantity: transactionHeader.totalQuantity,
        status: transactionHeader.status,
        campaignId: transactionHeader.campaignId,
        isGiftReceipt: transactionHeader.isGiftReceipt,
        originalTransactionId: transactionHeader.originalTransactionId,
        customerId: customer.id,
        payment: {
          create: {
            ...paymentDetails,
          },
        },
        lines: {
          create: transactionLines.map((line) => ({ ...line })),
        },
        appliedDiscounts: {
          create: appliedDiscountsLog.map((log) => ({ ...log })),
        },
      },
    });

    return newTransaction;
  });
}


/**
 * Retrieves transactions from the database.
 * This function will replace getPendingTransactions from local-db.
 */
export async function getTransactionsFromDb(): Promise<DatabaseReadyTransaction[]> {
    const transactions = await prisma.transaction.findMany({
        include: {
            lines: true,
            appliedDiscounts: true,
            customer: true,
            payment: true,
        },
        orderBy: {
            transactionDate: 'desc'
        }
    });

    // Re-map the Prisma-returned objects to the DatabaseReadyTransaction structure
    // This ensures the data shape remains consistent for the rest of the application.
    return transactions.map(tx => {
        if (!tx.payment) {
            throw new Error(`Transaction ${tx.id} is missing payment details.`);
        }
        
        return {
            transactionHeader: {
                transactionId: tx.id,
                transactionDate: tx.transactionDate.toISOString(),
                subtotal: tx.subtotal,
                totalDiscountAmount: tx.totalDiscountAmount,
                finalTotal: tx.finalTotal,
                totalItems: tx.totalItems,
                totalQuantity: tx.totalQuantity,
                status: tx.status as 'completed' | 'refund' | 'pending',
                campaignId: tx.campaignId,
                isGiftReceipt: tx.isGiftReceipt,
                originalTransactionId: tx.originalTransactionId ?? undefined
            },
            transactionLines: tx.lines.map(line => ({
                ...line
            })),
            appliedDiscountsLog: tx.appliedDiscounts.map(log => ({
                ...log
            })),
            customerDetails: {
                id: tx.customer.id,
                name: tx.customer.name,
                phone: tx.customer.phone ?? '',
                address: tx.customer.address ?? ''
            },
            paymentDetails: {
                paidAmount: tx.payment.paidAmount,
                paymentMethod: tx.payment.paymentMethod as 'cash' | 'card' | 'online',
                outstandingAmount: tx.payment.outstandingAmount,
                isInstallment: tx.payment.isInstallment
            },
            // These details are not stored in this DB schema, so we add defaults
            companyDetails: { companyId: 'comp-001', companyName: 'Default Company' },
            userDetails: { userId: 'user-001', userName: 'Default User' }
        };
    });
}


/**
 * Deletes a transaction from the database by its ID.
 * @param transactionId - The ID of the transaction to delete.
 */
export async function deleteTransactionFromDb(transactionId: string): Promise<void> {
  // Prisma requires cascading deletes to be set up in the schema or handled manually.
  // For simplicity, we'll delete related records manually in a transaction.
  await prisma.$transaction(async (tx) => {
    await tx.appliedDiscountLog.deleteMany({ where: { transactionId } });
    await tx.transactionLine.deleteMany({ where: { transactionId } });
    await tx.payment.deleteMany({ where: { transactionId } });
    await tx.transaction.delete({ where: { id: transactionId } });
  });
}
