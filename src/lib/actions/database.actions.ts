// src/lib/actions/database.actions.ts
'use server';

<<<<<<< HEAD
import { DatabaseReadyTransaction } from '../pos-data-transformer';
=======
>>>>>>> 7806ee1dcaf88f1b5832ae28178c0dbd456f2d75
import { prisma } from '../prisma';

import { Prisma } from '@prisma/client';

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
            originalTransactionId: transactionHeader.originalTransactionId,
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
    return { success: true, data: newTransaction };

  } catch (error) {
    console.error('[DB_SAVE_ERROR]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Provide more specific Prisma error feedback
      return { success: false, error: `Prisma Error (${error.code}): ${error.message}` };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown database error occurred.',
    };
  }
}
