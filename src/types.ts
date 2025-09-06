// src/types.ts

// ඔබගේ project එකේ භාණ්ඩයක් නිරූපණය කරන ආකාරය
export interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  category?: string;
  batches?: ProductBatch[];
  stock: number;
  units: UnitDefinition;
  isService: boolean;
  isActive: boolean;
  defaultQuantity: number;
}

// ඔබගේ අලුත් project එකේ "කාණ්ඩයක්" (batch) නිරූපණය කරන ආකාරය
export interface ProductBatch {
  id: string;
  batchNumber: string;
  sellingPrice: number; // Batch එකට විශේෂිත වූ මිල
  costPrice: number;
  quantity: number;
  productId: string;
}

// Cart එකේ ඇති භාණ්ඩයක්
export interface SaleItem extends Product {
  saleItemId: string; // Cart එකේදී වෙන් කර ගැනීමට
  quantity: number;
  selectedBatchId?: string;
  selectedBatch?: ProductBatch | null; // කුමන batch එකෙන්ද ආවේ කියා දැනගැනීමට
  price: number; // The actual price used for the sale (could be from batch or product)
  customDiscountValue?: number;
  customDiscountType?: 'fixed' | 'percentage';
  customApplyFixedOnce?: boolean; // New field to control custom fixed discount behavior
  originalQuantity?: number; // For refund context: the quantity in the original transaction
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
      threshold: number;
  }[];
}

// Enhanced Product Discount Configuration
export interface ProductDiscountConfiguration {
  id: string;
  productId: string;
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

// Enhanced Batch Discount Configuration
export interface BatchDiscountConfiguration {
  id: string;
  productBatchId: string;
  discountSetId: string;
  discountSet?: DiscountSet;
  isActiveForBatchInCampaign: boolean;
  priority?: number; // For ordering multiple configs for same batch
  lineItemValueRuleJson: SpecificDiscountRuleConfig | null;
  lineItemQuantityRuleJson: SpecificDiscountRuleConfig | null;
}

// Enhanced Buy-Get Rule
export interface BuyGetRule {
  id: string;
  name: string;
  buyProductId: string;
  buyQuantity: number;
  getProductId: string;
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
  batchConfigurations?: BatchDiscountConfiguration[];
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
  productIdAffected?: string;
  batchIdAffected?: string;
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

// Enhanced discount engine configuration
export interface DiscountEngineConfig {
  enableLogging?: boolean;
  enableValidation?: boolean;
  maxDiscountPercentage?: number; // Global safety limit
  allowStackingDiscounts?: boolean;
  oneTimeRuleStrategy?: 'per_transaction' | 'per_session' | 'per_customer';
}

// For future audit and reporting
export interface DiscountAuditLog {
  id: string;
  transactionId: string;
  customerId?: string;
  campaignId: string;
  ruleId: string;
  discountAmount: number;
  appliedAt: Date;
  ruleType: string;
  productId?: string;
  batchId?: string;
}
