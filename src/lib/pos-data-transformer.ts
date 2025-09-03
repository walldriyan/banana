// src/lib/pos-data-transformer.ts
import type { SaleItem, AppliedRuleInfo, Product, DiscountSet } from '@/types';
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

export interface TransactionHeader {
    transactionId: string;
    transactionDate: string; // ISO 8601 format
    subtotal: number;
    totalDiscountAmount: number;
    finalTotal: number;
    totalItems: number;
    totalQuantity: number;
    status: 'completed' | 'refund' | 'pending';
    campaignId: string; // Crucial for refunds
    originalTransactionId?: string; // For refunds
}

export interface TransactionLine {
    saleItemId: string; 
    productId: string;
    productName: string;
    batchId?: string;
    batchNumber?: string;
    quantity: number;
    unitPrice: number;
    lineTotalBeforeDiscount: number;
    lineDiscount: number; 
    lineTotalAfterDiscount: number;
}


// This is the final, structured object ready for a database
export interface DatabaseReadyTransaction {
  transactionHeader: TransactionHeader,
  transactionLines: TransactionLine[];
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
  activeCampaign: DiscountSet; // Now required
  status?: 'completed' | 'refund' | 'pending';
  originalTransactionId?: string;
}

/**
 * Transforms raw POS data into a structured object ready for database insertion.
 * @param input - The raw data from the POS transaction dialog.
 * @returns A structured object representing the entire transaction.
 */
export function transformTransactionDataForDb(
  input: TransformerInput
): DatabaseReadyTransaction {
  const { 
    cart, 
    discountResult, 
    transactionId, 
    customerData, 
    paymentData,
    activeCampaign,
    status = 'completed',
    originalTransactionId
  } = input;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = cart.length;

  const transactionHeader: TransactionHeader = {
    transactionId,
    transactionDate: new Date().toISOString(),
    subtotal: discountResult.originalSubtotal,
    totalDiscountAmount: discountResult.totalDiscount,
    finalTotal: discountResult.finalTotal,
    totalItems,
    totalQuantity,
    status,
    campaignId: activeCampaign.id, // Store the campaign ID
    ...(originalTransactionId && { originalTransactionId }),
  };

  const transactionLines: TransactionLine[] = cart.map(item => {
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

// Helper to convert DB transaction lines back to SaleItems for the refund cart
export function transactionLinesToSaleItems(lines: TransactionLine[], products: Product[]): SaleItem[] {
    return lines.map(line => {
        const product = products.find(p => p.id === line.productId);
        const batch = product?.batches?.find(b => b.id === line.batchId);
        
        if (!product) {
            // This is a fallback in case the product was deleted.
            // A more robust solution might handle this differently.
            return {
                id: line.productId,
                name: line.productName,
                sellingPrice: line.unitPrice,
                stock: 0,
                units: { baseUnit: 'pcs' },
                isService: false,
                isActive: false,
                defaultQuantity: 1,
                saleItemId: `refund-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                quantity: line.quantity,
                price: line.unitPrice,
            }
        }
        
        return {
            ...product,
            saleItemId: `refund-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quantity: line.quantity,
            selectedBatchId: batch?.id,
            selectedBatch: batch,
            price: line.unitPrice, // Use the price from the original transaction
        };
    });
}
