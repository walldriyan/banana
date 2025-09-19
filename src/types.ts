// src/types.ts
import { Prisma } from '@prisma/client';

// The "master" product, containing general, non-inventory information.
export type Product = Prisma.ProductGetPayload<{}>;

// Represents a specific batch of a product, with its own stock, price, etc.
export type ProductBatch = Prisma.ProductBatchGetPayload<{
  include: {
    product: true;
  }
}>;

// Represents what is in the shopping cart. It's a ProductBatch with sale-specific info.
export interface SaleItem extends ProductBatch {
  saleItemId: string; // A unique identifier for this line item in this specific sale
  quantity: number; // The TOTAL converted base unit quantity for the sale (e.g., 600 tablets)
  price: number; // The actual price used for the sale (from the product batch's sellingPrice)
  customDiscountValue?: number;
  customDiscountType?: 'fixed' | 'percentage';
  customApplyFixedOnce?: boolean;
  originalQuantity?: number; // For refund context
  displayUnit: string;
  displayQuantity: number;
}


// වට්ටම් නීතියක් - Enhanced with better validation and metadata
export interface SpecificDiscountRuleConfig {
  isEnabled: boolean;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditionMin?: number | null;
  conditionMax?: number | null;
  applyFixedOnce?: boolean; // Rule-level one-time setting
  description?: string; // Optional description for better UX
  priority?: number; // For future rule ordering
  validFrom?: Date; // For time-based rules
  validTo?: Date; // For time-based rules
  maxApplications?: number; // For limiting rule applications
}

export interface UnitDefinition {
  baseUnit: string;
  derivedUnits?: {
      name: string;
      conversionFactor: number;
  }[];
}

// Enhanced Product Discount Configuration
export interface ProductDiscountConfiguration {
  id: string;
  productId: string; // This now refers to the general productId, not the unique id
  productNameAtConfiguration: string;
  discountSetId: string;
  discountSet?: DiscountSet;
  isActiveForProductInCampaign: boolean;
  priority?: number; // For ordering multiple configs for same product
  lineItemValueRuleJson: SpecificDiscountRuleConfig | null;
  lineItemQuantityRuleJson: SpecificDiscountRuleConfig | null;
  specificQtyThresholdRuleJson: SpecificDiscountRuleConfig | null;
  specificUnitPriceThresholdRuleJson: SpecificDiscountRuleConfig | null;
}

// Batch configurations are now deprecated with the new model
export interface BatchDiscountConfiguration {
  id: string;
  productBatchId: string; // This would now match the unique Product 'id'
  discountSetId: string;
  discountSet?: DiscountSet;
  isActiveForBatchInCampaign: boolean;
  priority?: number;
  lineItemValueRuleJson: SpecificDiscountRuleConfig | null;
  lineItemQuantityRuleJson: SpecificDiscountRuleConfig | null;
}

// Enhanced Buy-Get Rule
export interface BuyGetRule {
  id: string;
  name: string;
  buyProductId: string; // General productId
  buyQuantity: number;
  getProductId: string; // General productId
  getQuantity: number;
  discountType: 'percentage' | 'fixed' | 'free';
  discountValue: number;
  isRepeatable: boolean;
  maxApplications?: number; // Limit how many times this can apply
  priority?: number; // For ordering multiple buy-get rules
  description?: string;
}

// Enhanced Discount Set
export interface DiscountSet {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isOneTimePerTransaction: boolean; // Campaign-level one-time setting
  validFrom?: Date;
  validTo?: Date;
  maxUsagePerCustomer?: number;
  productConfigurations?: ProductDiscountConfiguration[];
  batchConfigurations?: BatchDiscountConfiguration[]; // Kept for type safety, but will be empty
  buyGetRulesJson?: BuyGetRule[];
  globalCartPriceRuleJson?: SpecificDiscountRuleConfig | null;
  globalCartQuantityRuleJson?: SpecificDiscountRuleConfig | null;
  defaultLineItemValueRuleJson?: SpecificDiscountRuleConfig | null;
  defaultLineItemQuantityRuleJson?: SpecificDiscountRuleConfig | null;
  defaultSpecificQtyThresholdRuleJson?: SpecificDiscountRuleConfig | null;
  defaultSpecificUnitPriceThresholdRuleJson?: SpecificDiscountRuleConfig | null;
}

// Enhanced Applied Rule Info
export interface AppliedRuleInfo {
  discountCampaignName: string;
  sourceRuleName: string;
  totalCalculatedDiscount: number;
  ruleType: string;
  productIdAffected?: string; // General productId
  batchIdAffected?: string; // unique Product 'id'
  appliedOnce?: boolean;
  applicationCount?: number; // Track how many times applied
  timestamp?: Date; // When the rule was applied
}

// User interface for future customer-specific discounts
// This User interface is for general app logic, not the NextAuth user session.
// The NextAuth User type is extended in src/lib/auth/types.ts
export interface User {
  id: string;
  name: string;
  email?: string;
  membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPurchases?: number;
  loyaltyPoints?: number;
  isActive: boolean;
}

export interface DatabaseReadyTransaction {
  transactionHeader: {
    transactionId: string;
    transactionDate: string;
    subtotal: number;
    totalDiscountAmount: number;
    finalTotal: number;
    totalItems: number;
    totalQuantity: number;
    status: 'completed' | 'refund' | 'pending';
    campaignId: string;
    originalTransactionId?: string;
    isGiftReceipt?: boolean;
  };
  transactionLines: Array<{
    saleItemId: string;
    productBatchId: string; // The ID of the ProductBatch record
    productName: string;
    batchNumber?: string;
    quantity: number;
    displayUnit: string;
    displayQuantity: number;
    unitPrice: number;
    lineTotalBeforeDiscount: number;
    lineDiscount: number;
    lineTotalAfterDiscount: number;
    customDiscountValue?: number;
    customDiscountType?: 'fixed' | 'percentage';
    customApplyFixedOnce?: boolean;
  }>;
  appliedDiscountsLog: AppliedRuleInfo[];
  customerDetails: {
    id?: string;
    name: string;
    phone: string;
    address: string;
  };
  paymentDetails: {
    paidAmount: number;
    paymentMethod: 'cash' | 'card' | 'online';
    outstandingAmount: number;
    isInstallment: boolean;
  };
  companyDetails: {
    companyId: string;
    companyName: string;
  };
  userDetails: {
    userId: string;
    userName: string;
  };
  isRefunded?: boolean;
}
