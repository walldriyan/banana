// src/lib/pos-data-transformer.ts
import type { SaleItem, AppliedRuleInfo, Product, DiscountSet, ProductBatch } from '@/types';
import type { Company } from '@prisma/client';

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
    productId: string; // The general product ID (e.g., 't-shirt-01')
    productName: string;
    batchId: string; // The unique product ID (e.g., 't-shirt-old-batch')
    batchNumber?: string;
    quantity: number; // Base unit quantity
    displayUnit: string; // The unit shown to the user (e.g., 'box')
    displayQuantity: number; // The quantity of the display unit (e.g., 2)
    unitPrice: number;
    lineTotalBeforeDiscount: number;
    lineDiscount: number; 
    lineTotalAfterDiscount: number;
    // Add fields to store the manual override state
    customDiscountValue?: number;
    customDiscountType?: 'fixed' | 'percentage';
    customApplyFixedOnce?: boolean;
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
  isRefunded?: boolean; // Optional property to indicate status on client
}

interface TransformerInput {
  cart: SaleItem[];
  discountResult: any; // Received as a plain object, not a class instance
  transactionId: string;
  customerData: CustomerData;
  paymentData: PaymentData;
  activeCampaign: DiscountSet;
  company: Company | null; // Add company details to the input
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
    company,
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
      productId: item.productId, // General product ID from nested product
      productName: item.product.name,
      batchId: item.id, // Unique product ID (acting as batch ID)
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      displayUnit: item.displayUnit,
      displayQuantity: item.displayQuantity,
      price: item.price,
      unitPrice: item.price,
      lineTotalBeforeDiscount: lineTotalBeforeDiscount,
      lineDiscount: lineDiscount,
      lineTotalAfterDiscount: lineTotalBeforeDiscount - lineDiscount,
      // Save the custom override information
      customDiscountValue: item.customDiscountValue,
      customDiscountType: item.customDiscountType,
      customApplyFixedOnce: item.customApplyFixedOnce,
    };
  });

  const appliedDiscountsLog = discountResult.appliedRulesSummary || [];

  const companyDetails: CompanyDetails = {
    companyId: company?.id || 'comp-001',
    companyName: company?.name ||'Default Company'
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
export function transactionLinesToSaleItems(lines: (TransactionLine & { price?: number, productBatch?: any })[], products: ProductBatch[]): SaleItem[] {
    return lines.map(line => {
        // Find the matching product-batch combination from the current sample products
        const productBatch = products.find(p => p.id === line.batchId);
        
        const saleItemId = `refund-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const unitPrice = line.unitPrice || line.price || 0;

        if (!productBatch) {
            // Fallback for products that might not exist in the current product list
            console.warn(`ProductBatch with ID ${line.batchId} not found in sampleProducts. Creating fallback SaleItem from transaction line data.`);
            
            // Reconstruct a minimal product object from the line itself
            const fallbackProduct: Product = {
                id: line.productId,
                name: line.productName,
                description: '',
                category: line.productBatch?.product?.category || '',
                brand: line.productBatch?.product?.brand || '',
                units: line.productBatch?.product?.units || { baseUnit: line.displayUnit || 'unit', derivedUnits: [] },
                isService: false,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const fallbackBatch: ProductBatch = {
                id: line.batchId,
                productId: line.productId,
                batchNumber: line.batchNumber || 'N/A',
                sellingPrice: unitPrice,
                costPrice: 0,
                stock: 0, 
                addedDate: new Date(),
                product: fallbackProduct,
                 quantity: 0, // Not available
                 barcode: null,
                 supplierId: null,
            };
            
            return {
                ...fallbackBatch,
                saleItemId,
                price: unitPrice,
                quantity: line.quantity,
                originalQuantity: line.quantity,
                displayUnit: line.displayUnit,
                displayQuantity: line.displayQuantity,
                customDiscountValue: line.customDiscountValue,
                customDiscountType: line.customDiscountType,
                customApplyFixedOnce: line.customApplyFixedOnce,
            };
        }
                
        return {
            ...productBatch,
            saleItemId,
            quantity: line.quantity, // Base unit quantity
            displayUnit: line.displayUnit,
            displayQuantity: line.displayQuantity,
            price: unitPrice,
            originalQuantity: line.quantity, // Set original quantity for refund logic
             // --- Custom Discount Fields ---
            customDiscountValue: line.customDiscountValue,
            customDiscountType: line.customDiscountType,
            customApplyFixedOnce: line.customApplyFixedOnce,
        };
    });
}
