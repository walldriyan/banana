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
      type: 'fixed',
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
