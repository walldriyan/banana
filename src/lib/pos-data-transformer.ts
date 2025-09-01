// src/lib/pos-data-transformer.ts
import type { SaleItem, AppliedRuleInfo } from '@/types';
import type { DiscountResult, LineItemResult } from '@/discount-engine/core/result';

// Define types for the data we'll collect from the UI
export interface CustomerData {
  name: string;
  phone: string;
  address: string;
}

export interface PaymentData {
  paidAmount: number;
  paymentMethod: 'cash' | 'card' | 'online';
  outstandingAmount: number;
  isInstallment: boolean;
}

// This is the final, structured object ready for a database
export interface DatabaseReadyTransaction {
  transactionHeader: {
    transactionId: string;
    transactionDate: string; // ISO 8601 format
    subtotal: number;
    totalDiscountAmount: number;
    finalTotal: number;
    totalItems: number;
    totalQuantity: number;
  };
  transactionLines: {
    saleItemId: string; // Added to link with discount results
    productId: string;
    productName: string;
    batchId?: string;
    batchNumber?: string;
    quantity: number;
    unitPrice: number;
    lineTotalBeforeDiscount: number;
    lineDiscount: number; // Total discount for this line
    lineTotalAfterDiscount: number; // Final total for this line
  }[];
  appliedDiscountsLog: AppliedRuleInfo[];
  customerDetails: CustomerData & { id?: string }; // id can be added later
  paymentDetails: PaymentData;
}

interface TransformerInput {
  cart: SaleItem[];
  discountResult: DiscountResult;
  transactionId: string;
  customerData: CustomerData;
  paymentData: PaymentData;
}

/**
 * Transforms raw POS data into a structured object ready for database insertion.
 * @param input - The raw data from the POS transaction dialog.
 * @returns A structured object representing the entire transaction.
 */
export function transformTransactionDataForDb(
  input: TransformerInput
): DatabaseReadyTransaction {
  const { cart, discountResult, transactionId, customerData, paymentData } = input;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = cart.length;

  const transactionHeader = {
    transactionId,
    transactionDate: new Date().toISOString(),
    subtotal: discountResult.originalSubtotal,
    totalDiscountAmount: discountResult.totalDiscount,
    finalTotal: discountResult.finalTotal,
    totalItems,
    totalQuantity,
  };

  const transactionLines = cart.map(item => {
    const lineItemResult: LineItemResult | undefined = discountResult.getLineItem(item.saleItemId);
    const lineDiscount = lineItemResult ? lineItemResult.totalDiscount : 0;
    const lineTotalBeforeDiscount = item.price * item.quantity;
    
    return {
      saleItemId: item.saleItemId,
      productId: item.id,
      productName: item.name,
      batchId: item.selectedBatchId,
      batchNumber: item.selectedBatch?.batchNumber,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotalBeforeDiscount: lineTotalBeforeDiscount,
      lineDiscount: lineDiscount,
      lineTotalAfterDiscount: lineTotalBeforeDiscount - lineDiscount,
    };
  });

  const appliedDiscountsLog = discountResult.getAppliedRulesSummary();

  const databaseReadyObject: DatabaseReadyTransaction = {
    transactionHeader,
    transactionLines,
    appliedDiscountsLog,
    customerDetails: customerData,
    paymentDetails: paymentData,
  };

  return databaseReadyObject;
}
