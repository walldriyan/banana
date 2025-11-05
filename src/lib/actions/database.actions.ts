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
      
      let customer;
      const phoneToUse = customerDetails.phone || null;
      const isWalkIn = customerDetails.name === 'Walk-in Customer' && !phoneToUse;

      if (isWalkIn) {
        customer = await tx.customer.findFirst({
          where: { name: 'Walk-in Customer', phone: null }
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: { name: 'Walk-in Customer', phone: null, address: null }
          });
        }
      } else {
        customer = await tx.customer.upsert({
          where: { phone: phoneToUse || `__no-phone-${transactionHeader.transactionId}` },
          update: { name: customerDetails.name, address: customerDetails.address },
          create: {
            name: customerDetails.name,
            phone: phoneToUse,
            address: customerDetails.address,
          },
        });
      }

      // Determine initial payment status
      let initialPaymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
      if (paymentDetails.paidAmount >= transactionHeader.finalTotal) {
          initialPaymentStatus = 'paid';
      } else if (paymentDetails.paidAmount > 0) {
          initialPaymentStatus = 'partial';
      }

      // Create the main transaction record
      const createdTransaction = await tx.transaction.create({
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
          paymentStatus: initialPaymentStatus, // Set initial status
          ...(transactionHeader.originalTransactionId && {
            originalTransactionId: transactionHeader.originalTransactionId
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
              productName: line.productName,
              batchNumber: line.batchNumber,
              productBatch: { // Connect to the existing ProductBatch
                connect: { id: line.batchId }
              },
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

      // Record initial payment in the new SalePayment table if it's a credit sale
      if (initialPaymentStatus === 'partial' || initialPaymentStatus === 'pending') {
          if (paymentDetails.paidAmount > 0) {
              await tx.salePayment.create({
                  data: {
                      transactionId: createdTransaction.id,
                      amount: paymentDetails.paidAmount,
                      paymentDate: new Date(),
                      paymentMethod: paymentDetails.paymentMethod,
                      notes: 'Initial payment with transaction.',
                  }
              });
          }
      }


      // STOCK MANAGEMENT LOGIC
      if (transactionHeader.status === 'completed') {
        for (const line of transactionLines) {
            await tx.productBatch.update({ // Changed from Product to ProductBatch
                where: { id: line.batchId }, 
                data: {
                    stock: {
                       decrement: line.quantity
                    }
                }
            });
        }
      } else if (transactionHeader.status === 'refund' && transactionHeader.originalTransactionId) {
         const originalTx = await tx.transaction.findUnique({
             where: { id: transactionHeader.originalTransactionId },
             include: { lines: true }
         });

         if (!originalTx) {
             throw new Error(`Original transaction ${transactionHeader.originalTransactionId} not found for refund stock update.`);
         }

         for (const originalLine of originalTx.lines) {
             const keptLine = transactionLines.find(line => line.batchId === originalLine.productBatchId); // Changed to batchId
             const originalQty = originalLine.quantity;
             const keptQty = keptLine ? keptLine.quantity : 0;
             const returnedQty = originalQty - keptQty;

             if (returnedQty > 0) {
                 await tx.productBatch.update({ // Changed from Product to ProductBatch
                     where: { id: originalLine.productBatchId! }, // Use the correct ID from the original line
                     data: {
                         stock: {
                             increment: returnedQty
                         }
                     }
                 });
             }
         }
      }


      return createdTransaction;
    });

    console.log(`[DB] Transaction ${newTransaction.id} saved successfully to database.`);
    revalidatePath('/history');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/debtors');
    return { success: true, data: newTransaction };

  } catch (error) {
    console.error('[DB_SAVE_ERROR]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if(error.code === 'P2002' && (error.meta?.target as string[])?.includes('originalTransactionId')) {
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
export async function getTransactionsFromDb(options?: {
  limit?: number;
  skip?: number;
  status?: 'completed' | 'refund' | 'pending';
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    // Build where clause
    const where: any = {};
    if (options?.status) where.status = options.status;
    if (options?.dateFrom || options?.dateTo) {
      where.transactionDate = {};
      if (options.dateFrom) where.transactionDate.gte = options.dateFrom;
      if (options.dateTo) where.transactionDate.lte = options.dateTo;
    }

    // Use pagination and selective loading
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, address: true }
          },
          payment: {
            select: { 
              paidAmount: true, 
              paymentMethod: true, 
              outstandingAmount: true, 
              isInstallment: true 
            }
          },
          lines: {
            select: {
              id: true,
              productBatchId: true,
              quantity: true,
              displayUnit: true,
              displayQuantity: true,
              unitPrice: true,
              lineTotalBeforeDiscount: true,
              lineDiscount: true,
              lineTotalAfterDiscount: true,
              customDiscountValue: true,
              customDiscountType: true,
              customApplyFixedOnce: true,
              productBatch: {
                select: {
                  id: true,
                  batchNumber: true,
                  productId: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                      brand: true,
                      units: true
                    }
                  }
                }
              }
            }
          },
          appliedDiscounts: {
            select: {
              discountCampaignName: true,
              sourceRuleName: true,
              totalCalculatedDiscount: true,
              ruleType: true,
              productIdAffected: true,
              batchIdAffected: true,
              appliedOnce: true
            }
          },
          originalTransaction: { 
            select: { id: true }
          },
          refundTransactions: { 
            select: { id: true }
          }
        },
        orderBy: {
          transactionDate: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.skip || 0,
      }),
      prisma.transaction.count({ where })
    ]);

    // Transform data (same as before)
    const formattedTransactions = transactions.map(tx => {
      const paymentDetails = tx.payment
        ? {
            paidAmount: tx.payment.paidAmount,
            paymentMethod: tx.payment.paymentMethod as 'cash' | 'card' | 'online',
            outstandingAmount: tx.payment.outstandingAmount,
            isInstallment: tx.payment.isInstallment,
          }
        : {
            paidAmount: 0,
            paymentMethod: 'cash' as 'cash',
            outstandingAmount: tx.finalTotal,
            isInstallment: false,
          };

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
          originalTransactionId: tx.originalTransactionId ?? undefined,
          isGiftReceipt: tx.isGiftReceipt ?? false,
        },
        transactionLines: tx.lines.map(line => ({
          ...line,
          productName: line.productBatch.product.name,
          batchNumber: line.productBatch.batchNumber,
          productId: line.productBatch.productId,
          batchId: line.productBatchId!,
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
        paymentDetails,
        companyDetails: { companyId: 'comp-001', companyName: 'My Company' },
        userDetails: { userId: 'user-001', userName: 'Default User' },
        isRefunded: !!tx.refundTransactions.length,
      };
    });

    return { 
      success: true, 
      data: formattedTransactions,
      totalCount,
      hasMore: (options?.skip || 0) + formattedTransactions.length < totalCount
    };
  } catch (error) {
    console.error('[DB_GET_TRANSACTIONS_ERROR]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
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
