// src/lib/default-campaign.ts
import type { DiscountSet } from '@/types';

/**
 * This campaign provides a default, baseline discount for all items.
 * It is intended to be the active campaign by default.
 * Specific rules in other campaigns or custom discounts in the cart
 * will override the rules defined here.
 */
export const defaultDiscounts: DiscountSet = {
  id: 'promo-default',
  name: 'Default Discounts',
  description: 'A baseline 2% discount on all items. Can be overridden by other campaigns or manual discounts.',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: true,

  // No product-specific configurations needed for a simple default
  productConfigurations: [],

  // No batch-specific configurations
  batchConfigurations: [],

  // No BOGO rules
  buyGetRulesJson: [],

  // No cart-level rules
  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  
  // This is the main rule for this campaign
  defaultLineItemValueRuleJson: {
      isEnabled: true,
      name: 'Default 2% Item Discount',
      type: 'percentage',
      value: 2,
      // No minimum condition, applies to everything
      conditionMin: 0,
      
      description: 'A standard 2% discount on all line items.',
      applyFixedOnce: true
  },

  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};


/**
 * A special campaign set that applies no discounts.
 * This can be selected by the user to explicitly disable all automatic discounts.
 */
export const noDiscounts: DiscountSet = {
  id: 'promo-none',
  name: 'No Discount',
  description: 'Disables all automatic discounts. Only manual discounts will apply.',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  // All rule configurations are empty or null
  productConfigurations: [],
  batchConfigurations: [],
  buyGetRulesJson: [],
  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};

/**
 * A special campaign that instructs the engine to use the default
 * discount and tax values stored on the product itself.
 */
export const productDefaults: DiscountSet = {
  id: 'promo-product-defaults',
  name: 'Product Defaults',
  description: 'Applies the default tax and discount saved on each product batch.',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  // All rule configurations are empty or null for this special campaign
  productConfigurations: [],
  batchConfigurations: [],
  buyGetRulesJson: [],
  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};
