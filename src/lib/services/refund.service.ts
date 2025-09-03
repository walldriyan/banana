// src/lib/services/refund.service.ts

/**
 * @file This file contains the core, server-only service for processing refunds.
 * It ensures business logic is centralized and not duplicated.
 */

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import { transformTransactionDataForDb } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';

interface RefundProcessingInput {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[]; // The items the customer is KEEPING
    refundDiscountResult: any; // The recalculated discount result for kept items, passed as a plain object
    activeCampaign: DiscountSet; // The campaign used for the original transaction
}

/**
 * Processes a refund and creates a new transaction record for it.
 * This is a pure function that only handles data transformation and logic,
 * it does not perform any I/O operations like saving to a DB.
 * @param payload - The data required to process the refund.
 * @returns A new DatabaseReadyTransaction object with status 'refund'.
 */
export function processRefund(payload: RefundProcessingInput): DatabaseReadyTransaction {
  const { originalTransaction, refundCart, refundDiscountResult, activeCampaign } = payload;
  
  // The amount the customer originally paid
  const originalPaidAmount = originalTransaction.paymentDetails.paidAmount;
  // The value of the items the customer is now keeping
  const newTotalToPay = refundDiscountResult.finalTotal;

  // Positive value means we give money back.
  // Negative value means the customer has to pay more (e.g. they returned a discounted item and kept a full price one).
  const cashToReturnOrCollect = originalPaidAmount - newTotalToPay;

  // The new outstanding amount is the new total bill minus what was originally paid.
  // If this is negative, it means the customer overpaid, so the outstanding is 0.
  const newOutstandingAmount = Math.max(0, newTotalToPay - originalPaidAmount);
  
  const refundTransactionId = `refund-${Date.now()}`;

  const refundTransaction = transformTransactionDataForDb({
    cart: refundCart,
    discountResult: refundDiscountResult,
    transactionId: refundTransactionId,
    customerData: originalTransaction.customerDetails,
    paymentData: {
      // "paidAmount" for a refund transaction is the NET cash change.
      // A positive value means we received cash (customer paid us), a negative value means we gave cash back.
      paidAmount: -cashToReturnOrCollect, 
      paymentMethod: originalTransaction.paymentDetails.paymentMethod,
      outstandingAmount: newOutstandingAmount,
      isInstallment: newOutstandingAmount > 0, // It's an installment if there's an outstanding balance
    },
    status: 'refund',
    originalTransactionId: originalTransaction.transactionHeader.transactionId,
    activeCampaign: activeCampaign,
  });

  return refundTransaction;
}
