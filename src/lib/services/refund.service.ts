// src/lib/services/refund.service.ts

/**
 * @file This file contains the core, server-only service for processing refunds.
 * It ensures business logic is centralized and not duplicated.
 */

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import { transformTransactionDataForDb } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';
import type { Company } from '@prisma/client';


interface RefundProcessingInput {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[]; // The items the customer is KEEPING
    refundDiscountResult: any; // The recalculated discount result for kept items, passed as a plain object
    activeCampaign: DiscountSet; // The campaign used for the original transaction
    company: Company | null;
}

/**
 * Processes a refund and creates a new transaction record for it.
 * This is a pure function that only handles data transformation and logic,
 * it does not perform any I/O operations like saving to a DB.
 * @param payload - The data required to process the refund.
 * @returns A new DatabaseReadyTransaction object with status 'refund'.
 */
export function processRefund(payload: RefundProcessingInput): DatabaseReadyTransaction {
  const { originalTransaction, refundCart, refundDiscountResult, activeCampaign, company } = payload;
  
  const originalPaidAmount = originalTransaction.paymentDetails.paidAmount;
  const newTotalForKeptItems = refundDiscountResult.finalTotal;

  // This is the net cash change.
  // Positive: Customer needs to pay more.
  // Negative: Customer gets money back.
  const netCashChange = newTotalForKeptItems - originalPaidAmount;
  
  const refundTransactionId = `refund-${Date.now()}`;

  // When creating the refund transaction, we don't need to consider a "gift receipt" mode.
  // The refund receipt should always show the full financial details.
  const refundTransaction = transformTransactionDataForDb({
    cart: refundCart,
    discountResult: refundDiscountResult,
    transactionId: refundTransactionId,
    customerData: originalTransaction.customerDetails,
    paymentData: {
      // `paidAmount` in the new transaction represents the CASH CHANGE.
      // If customer gets 500 back, paidAmount is -500.
      // If customer has to pay 200 more, paidAmount is 200.
      paidAmount: netCashChange,
      paymentMethod: originalTransaction.paymentDetails.paymentMethod,
      outstandingAmount: 0, // Refunds settle the difference, no new outstanding amount.
      isInstallment: false, // Refunds are final settlements.
      finalTotal: newTotalForKeptItems, // This is the total of what the customer is keeping now
    },
    status: 'refund',
    originalTransactionId: originalTransaction.transactionHeader.transactionId,
    activeCampaign: activeCampaign,
    company: company,
    isGiftReceipt: false, // Refunds are financial documents, never gift receipts.
  });

  return refundTransaction;
}
