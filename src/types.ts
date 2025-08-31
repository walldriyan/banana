
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
}

// වට්ටම් නීතියක්
export interface SpecificDiscountRuleConfig {
  isEnabled: boolean;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditionMin?: number | null;
  conditionMax?: number | null;
  applyFixedOnce?: boolean;
}

export interface UnitDefinition {
  baseUnit: string;
  derivedUnits?: {
      name: string;
      conversionFactor: number;
      threshold: number;
  }[];
}


// **මෙම කොටස නිවැරදි කර ඇත**
export interface ProductDiscountConfiguration {
  id: string;
  productId: string;
  productNameAtConfiguration: string;
  discountSetId: string;
  discountSet?: DiscountSet;
  isActiveForProductInCampaign: boolean;
  lineItemValueRuleJson: SpecificDiscountRuleConfig | null;
  lineItemQuantityRuleJson: SpecificDiscountRuleConfig | null;
  specificQtyThresholdRuleJson: SpecificDiscountRuleConfig | null;
  specificUnitPriceThresholdRuleJson: SpecificDiscountRuleConfig | null;
}

// **මෙම කොටස නිවැරදි කර ඇත**
export interface BatchDiscountConfiguration {
  id: string;
  productBatchId: string;
  discountSetId: string;
  discountSet?: DiscountSet;
  isActiveForBatchInCampaign: boolean;
  lineItemValueRuleJson: SpecificDiscountRuleConfig | null;
  lineItemQuantityRuleJson: SpecificDiscountRuleConfig | null;
}

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
}

export interface DiscountSet {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  isOneTimePerTransaction: boolean;
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

export interface AppliedRuleInfo {
  ruleId: string; // A unique ID for the rule configuration that was applied
  discountCampaignName: string;
  sourceRuleName: string;
  totalCalculatedDiscount: number;
  ruleType: string; // e.g. 'product_config_line_item_value', 'cart_total_rule'
  productIdAffected?: string;
  appliedOnce?: boolean;
  isRepeatable?: boolean; // Lets the engine know if this rule *could* repeat
}
