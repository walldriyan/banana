// src/lib/pos-data-transformer.ts
import type { SaleItem, AppliedRuleInfo, Product, DiscountSet } from '@/types';

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

export interface CompanyDetails {
    companyId: string;
    companyName: string;
}

export interface UserDetails {
    userId: string;
    userName: string;
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
    isGiftReceipt?: boolean;
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
    // Add fields to store the manual override state
    customDiscountValue?: number;
    customDiscountType?: 'fixed' | 'percentage';
}


// This is the final, structured object ready for a database
export interface DatabaseReadyTransaction {
  transactionHeader: TransactionHeader,
  transactionLines: TransactionLine[];
  appliedDiscountsLog: AppliedRuleInfo[];
  customerDetails: CustomerData & { id?: string }; // id can be added later
  paymentDetails: PaymentData;
  companyDetails: CompanyDetails;
  userDetails: UserDetails;
}

interface TransformerInput {
  cart: SaleItem[];
  discountResult: any; // Received as a plain object, not a class instance
  transactionId: string;
  customerData: CustomerData;
  paymentData: PaymentData;
  activeCampaign: DiscountSet;
  isGiftReceipt?: boolean;
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
    isGiftReceipt,
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
    campaignId: activeCampaign.id,
    isGiftReceipt: isGiftReceipt ?? false,
    ...(originalTransactionId && { originalTransactionId }),
  };

  const transactionLines: TransactionLine[] = cart.map(item => {
    const lineItemResult = discountResult.lineItems.find((li: any) => li.lineId === item.saleItemId);

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
      // Save the custom override information
      customDiscountValue: item.customDiscountValue,
      customDiscountType: item.customDiscountType,
    };
  });

  const appliedDiscountsLog = discountResult.appliedRulesSummary || [];

  const companyDetails: CompanyDetails = {
    companyId: 'comp-001',
    companyName: 'Default Company'
  };

  const userDetails: UserDetails = {
    userId: 'user-001',
    userName: 'Default User'
  };

  const databaseReadyObject: DatabaseReadyTransaction = {
    transactionHeader,
    transactionLines,
    appliedDiscountsLog,
    customerDetails: customerData,
    paymentDetails: paymentData,
    companyDetails,
    userDetails,
  };

  return databaseReadyObject;
}

// Helper to convert DB transaction lines back to SaleItems for the refund cart
export function transactionLinesToSaleItems(lines: TransactionLine[], products: Product[]): SaleItem[] {
    return lines.map(line => {
        const product = products.find(p => p.id === line.productId);
        const batch = product?.batches?.find(b => b.id === line.batchId);
        
        if (!product) {
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
                // Restore custom discount info
                customDiscountValue: line.customDiscountValue,
                customDiscountType: line.customDiscountType,
            }
        }
        
        return {
            ...product,
            saleItemId: `refund-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quantity: line.quantity,
            selectedBatchId: batch?.id,
            selectedBatch: batch,
            price: line.unitPrice,
            // Restore custom discount info
            customDiscountValue: line.customDiscountValue,
            customDiscountType: line.customDiscountType,
        };
    });
}
