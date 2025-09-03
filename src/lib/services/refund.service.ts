// src/lib/services/refund.service.ts

/**
 * @file This file contains the core, server-only service for processing refunds.
 * It ensures business logic is centralized and not duplicated.
 */

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import { transformTransactionDataForDb } from '../pos-data-transformer';
import type { DiscountResult } from '@/discount-engine/core/result';
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
  
  const originalTotal = originalTransaction.transactionHeader.finalTotal;
  const newTotal = refundDiscountResult.finalTotal;
  const refundAmount = originalTotal - newTotal;

  // Create a new transaction ID for the refund record
  const refundTransactionId = `refund-${Date.now()}`;

  // The refund transaction represents the state of the *kept* items,
  // but the payment details reflect the *refunded* amount.
  const refundTransaction = transformTransactionDataForDb({
    cart: refundCart,
    discountResult: refundDiscountResult,
    transactionId: refundTransactionId,
    customerData: originalTransaction.customerDetails,
    paymentData: {
      // The "paidAmount" for a refund transaction is the negative value of what's returned
      paidAmount: -refundAmount,
      paymentMethod: 'cash', // Or original method
      outstandingAmount: 0,
      isInstallment: false,
    },
    status: 'refund',
    originalTransactionId: originalTransaction.transactionHeader.transactionId,
    activeCampaign: activeCampaign, // Pass the original campaign
  });

  return refundTransaction;
}
