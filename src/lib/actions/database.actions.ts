// src/lib/actions/database.actions.ts
'use server';

import { DatabaseReadyTransaction } from '../pos-data-transformer';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Saves a fully formed transaction object to the SQLite database using Prisma.
 * This function is designed to be called from a server action after the client
 * confirms the transaction.
 *
 * It uses a Prisma transaction to ensure all related data (customer, payment, lines, etc.)
 * is saved atomically. If any part of fails, the entire transaction is rolled back.
 *
 * @param data - The complete transaction data object.
 * @returns The newly created transaction object from the database.
 */
export async function saveTransactionToDb(data: DatabaseReadyTransaction) {
  const {
    transactionHeader,
    transactionLines,
    appliedDiscountsLog,
    customerDetails,
    paymentDetails,
  } = data;

  try {
    const newTransaction = await prisma.$transaction(async (tx) => {
      
      const phoneToUse = customerDetails.phone || null;

      // Step 1: Find or create the customer
      const customer = await tx.customer.upsert({
        where: { phone: phoneToUse || `__no-phone-${transactionHeader.transactionId}` },
        update: { name: customerDetails.name, address: customerDetails.address },
        create: {
          name: customerDetails.name,
          phone: phoneToUse,
          address: customerDetails.address,
        },
      });

      // Step 2: Create the main transaction record
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
          // Conditionally add originalTransactionId only if it exists
          ...(transactionHeader.originalTransactionId && {
            originalTransaction: {
                connect: { id: transactionHeader.originalTransactionId }
            }
          }),
          customerId: customer.id,
          payment: {
            create: {
              paidAmount: paymentDetails.paidAmount,
              paymentMethod: paymentDetails.paymentMethod,
              outstandingAmount: paymentDetails.outstandingAmount,
              isInstallment: paymentDetails.isInstallment,
            },
          },
          lines: {
            create: transactionLines.map(line => ({
              productId: line.productId,
              productName: line.productName,
              batchId: line.batchId,
              batchNumber: line.batchNumber,
              quantity: line.quantity,
              displayUnit: line.displayUnit,
              displayQuantity: line.displayQuantity,
              unitPrice: line.unitPrice,
              lineTotalBeforeDiscount: line.lineTotalBeforeDiscount,
              lineDiscount: line.lineDiscount,
              lineTotalAfterDiscount: line.lineTotalAfterDiscount,
              customDiscountValue: line.customDiscountValue,
              customDiscountType: line.customDiscountType,
              customApplyFixedOnce: line.customApplyFixedOnce,
            })),
          },
          appliedDiscounts: {
            create: appliedDiscountsLog.map(log => ({
              discountCampaignName: log.discountCampaignName,
              sourceRuleName: log.sourceRuleName,
              totalCalculatedDiscount: log.totalCalculatedDiscount,
              ruleType: log.ruleType,
              productIdAffected: log.productIdAffected,
              batchIdAffected: log.batchIdAffected,
              appliedOnce: log.appliedOnce,
            })),
          },
        },
      });

      return newTransaction;
    });

    console.log(`[DB] Transaction ${newTransaction.id} saved successfully to database.`);
    revalidatePath('/history');
    return { success: true, data: newTransaction };

  } catch (error) {
    console.error('[DB_SAVE_ERROR]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if(error.code === 'P2002' && error.meta?.target === 'Transaction_originalTransactionId_key') {
           return { success: false, error: `The original transaction has already been refunded.` };
      }
      return { success: false, error: `Prisma Error (${error.code}): ${error.message}` };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown database error occurred.',
    };
  }
}

/**
 * Fetches transactions from the database.
 */
export async function getTransactionsFromDb() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        customer: true,
        payment: true,
        lines: true,
        appliedDiscounts: true,
        originalTransaction: { // To see if it IS a refund
            select: { id: true }
        },
        refundTransactions: { // To see if it HAS a refund
            select: { id: true }
        }
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    // We need to shape this data into the `DatabaseReadyTransaction` format that the client expects.
    const formattedTransactions = transactions.map(tx => {
      const dbReadyTx: DatabaseReadyTransaction = {
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
          originalTransactionId: tx.originalTransactionId ?? undefined,
          isGiftReceipt: tx.isGiftReceipt ?? false,
        },
        transactionLines: tx.lines.map(line => ({
          ...line,
          customDiscountType: line.customDiscountType as 'fixed' | 'percentage' | undefined,
        })),
        appliedDiscountsLog: tx.appliedDiscounts.map(log => ({
            ...log,
            productIdAffected: log.productIdAffected ?? undefined,
            batchIdAffected: log.batchIdAffected ?? undefined,
            appliedOnce: log.appliedOnce ?? undefined,
        })),
        customerDetails: {
          id: tx.customer.id,
          name: tx.customer.name,
          phone: tx.customer.phone ?? '',
          address: tx.customer.address ?? '',
        },
        paymentDetails: {
          paidAmount: tx.payment!.paidAmount,
          paymentMethod: tx.payment!.paymentMethod as 'cash' | 'card' | 'online',
          outstandingAmount: tx.payment!.outstandingAmount,
          isInstallment: tx.payment!.isInstallment,
        },
        // These are placeholders as they are not stored in the DB
        companyDetails: { companyId: 'comp-001', companyName: 'My Company' },
        userDetails: { userId: 'user-001', userName: 'Default User' },
        // Add refund status based on included relations
        isRefunded: !!tx.refundTransactions.length,
      };
      return dbReadyTx;
    });

    return { success: true, data: formattedTransactions };
  } catch (error) {
    console.error('[DB_GET_TRANSACTIONS_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown database error occurred while fetching transactions.',
    };
  }
}

/**
 * Deletes a transaction from the database.
 * @param transactionId The ID of the transaction to delete.
 */
export async function deleteTransactionFromDb(transactionId: string) {
    try {
        await prisma.transaction.delete({
            where: { id: transactionId },
        });
        revalidatePath('/history');
        return { success: true };
    } catch (error) {
        console.error(`[DB_DELETE_TRANSACTION_ERROR] ID: ${transactionId}`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { success: false, error: 'Transaction not found.' };
        }
        return { 
            success: false, 
            error: 'Failed to delete transaction. It might be linked to other records (e.g., a refund).' 
        };
    }
}
