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
  
  const originalPaidAmount = originalTransaction.paymentDetails.paidAmount;
  const newTotalToPay = refundDiscountResult.finalTotal;
  const cashToReturnOrCollect = originalPaidAmount - newTotalToPay;
  const newOutstandingAmount = Math.max(0, newTotalToPay - originalPaidAmount);
  
  const refundTransactionId = `refund-${Date.now()}`;

  // When creating the refund transaction, we don't need to consider a "gift receipt" mode.
  // The refund receipt should always show the full financial details.
  const refundTransaction = transformTransactionDataForDb({
    cart: refundCart,
    discountResult: refundDiscountResult,
    transactionId: refundTransactionId,
    customerData: originalTransaction.customerDetails,
    paymentData: {
      paidAmount: -cashToReturnOrCollect, 
      paymentMethod: originalTransaction.paymentDetails.paymentMethod,
      outstandingAmount: newOutstandingAmount,
      isInstallment: newOutstandingAmount > 0,
    },
    status: 'refund',
    originalTransactionId: originalTransaction.transactionHeader.transactionId,
    activeCampaign: activeCampaign,
    isGiftReceipt: false, // Refunds are financial documents, never gift receipts.
  });

  return refundTransaction;
}
