
// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';

// **උදාහරණය 1: "Mega Deal Fest" - විවිධ නීති එකට**
// This campaign now has multiple, potentially conflicting rules for the same product 
// to test the engine's priority logic (first valid rule applies).
export const megaDealFest: DiscountSet = {
  id: 'promo-mega-deal',
  name: 'Mega Deal Fest',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: false,
  
  // Product-specific discounts. Note the multiple entries for 'jeans-01' and 't-shirt-01'
  productConfigurations: [
    { 
      id: 'mega-jeans-config-1', // Rule Set 1 for Jeans
      productId: 'jeans-01',
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: { // Rule 1A: 15% off any jeans line item
        isEnabled: true, name: '15% OFF All Jeans', type: 'percentage', value: 15,
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: { // Rule 1B: Buy 2 or more jeans, get Rs.1000 off total line (once)
        isEnabled: true, name: 'Jeans Duo-Pack Discount', type: 'fixed', value: 1000, conditionMin: 2, applyFixedOnce: true,
      },
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-jeans-config-2', // **NEW** Rule Set 2 for Jeans (Lower priority)
      productId: 'jeans-01',
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: { // Rule 2A: Rs. 500 off if line value is over Rs. 10,000
        isEnabled: true, name: 'High-Value Jeans Discount', type: 'fixed', value: 500, conditionMin: 10000, applyFixedOnce: true,
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-tshirt-config-1', // Rule Set 1 for T-Shirt
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: { // Rule 3: 5% off T-shirts if line value is > Rs. 5000
        isEnabled: true, name: 'T-Shirt Bulk Offer', type: 'percentage', value: 5, conditionMin: 5000
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-tshirt-config-2', // **NEW** Rule Set 2 for T-Shirt
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: { // Rule 4: Buy 4 T-Shirts, get Rs. 150 off per shirt
          isEnabled: true, name: 'T-Shirt 4-Pack Deal', type: 'fixed', value: 150, applyFixedOnce: false, conditionMin: 4
      },
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  
  // Batch-specific discount for old T-Shirts. This has higher priority than product-level rules.
  batchConfigurations: [
    { 
      id: 'mega-old-tshirt-batch-config',
      productBatchId: 't-shirt-batch-old',
      discountSetId: 'promo-mega-deal',
      isActiveForBatchInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'Old T-Shirt Clearance', type: 'fixed', value: 300, applyFixedOnce: false, 
      },
      lineItemQuantityRuleJson: null,
    },
    { 
      id: 'mega-new-tshirt-batch-config',
      productBatchId: 't-shirt-batch-new',
      discountSetId: 'promo-mega-deal',
      isActiveForBatchInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'New Arrival T-Shirts', type: 'percentage', value: 10
      },
      lineItemQuantityRuleJson: null,
    }
  ],
  
  // Global cart total discount
  globalCartPriceRuleJson: { 
    isEnabled: true, name: 'Super Saver Bonus', type: 'fixed', value: 1000, conditionMin: 15000,
  },

  // Default discount for any other items that don't have a specific rule
  defaultLineItemValueRuleJson: {
      isEnabled: true, name: '5% OFF on others', type: 'percentage', value: 5, conditionMin: 5000
  },

  // Nullify other rules not used in this campaign
  buyGetRulesJson: [],
  globalCartQuantityRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};

// **උදාහරණය 2: "Buy More, Save More" - ප්‍රමාණය මත පදනම් වූ දීමනා**
export const buyMoreSaveMore: DiscountSet = {
  id: 'promo-buy-more',
  name: 'Buy More, Save More',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  productConfigurations: [
    {
      id: 'buymore-tshirt-config',
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-buy-more',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: {
          isEnabled: true,
          name: 'T-Shirt Bulk Buy',
          type: 'fixed',
          value: 250, 
          conditionMin: 3, 
          applyFixedOnce: false 
      },
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
        id: 'buymore-jeans-config',
        productId: 'jeans-01',
        productNameAtConfiguration: 'Jeans',
        discountSetId: 'promo-buy-more',
        isActiveForProductInCampaign: true,
        lineItemValueRuleJson: null,
        lineItemQuantityRuleJson: null,
        specificQtyThresholdRuleJson: null,
        specificUnitPriceThresholdRuleJson: {
            isEnabled: true,
            name: 'Premium Jeans Offer',
            type: 'percentage',
            value: 20, 
            conditionMin: 7000, 
        }
    }
  ],

  batchConfigurations: [
      {
        id: 'buymore-old-tshirt-batch-config',
        productBatchId: 't-shirt-batch-old',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        lineItemValueRuleJson: {
            isEnabled: true, name: 'Extra for Old Stock', type: 'fixed', value: 100, applyFixedOnce: false
        },
        lineItemQuantityRuleJson: null,
      }
  ],

  globalCartQuantityRuleJson: {
      isEnabled: true,
      name: 'Shopping Haul Bonus',
      type: 'fixed',
      value: 400, 
      conditionMin: 5, 
  },
  
  buyGetRulesJson: [],
  globalCartPriceRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};

// **උදාහරණය 3: "Clearance Sale" - BOGO and Batch-heavy**
export const clearanceSale: DiscountSet = {
  id: 'promo-clearance',
  name: 'Clearance Sale',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  productConfigurations: [
      { 
        id: 'clearance-jeans-special',
        productId: 'jeans-01',
        productNameAtConfiguration: 'Jeans',
        discountSetId: 'promo-clearance',
        isActiveForProductInCampaign: true,
        lineItemValueRuleJson: {
            isEnabled: true, name: 'Jeans Clearance Price', type: 'percentage', value: 30
        },
        lineItemQuantityRuleJson: null,
        specificQtyThresholdRuleJson: null,
        specificUnitPriceThresholdRuleJson: null,
      }
  ],

  batchConfigurations: [
    { 
      id: 'clearance-old-tshirt-batch-config',
      productBatchId: 't-shirt-batch-old',
      discountSetId: 'promo-clearance',
      isActiveForBatchInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'MUST GO: Old T-Shirts', type: 'percentage', value: 60,
      },
      lineItemQuantityRuleJson: null,
    },
    { 
      id: 'clearance-new-tshirt-batch-config',
      productBatchId: 't-shirt-batch-new',
      discountSetId: 'promo-clearance',
      isActiveForBatchInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'New T-Shirt Consolation', type: 'fixed', value: 50, applyFixedOnce: false,
      },
      lineItemQuantityRuleJson: null,
    }
  ],

  buyGetRulesJson: [
      {
          id: 'clearance-bogo-jeans',
          name: 'Buy T-Shirt Get Jeans',
          buyProductId: 't-shirt-01', 
          buyQuantity: 2,
          getProductId: 'jeans-01', 
          getQuantity: 1,
          discountType: 'percentage', 
          discountValue: 50, 
          isRepeatable: true, 
      }
  ],

  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};
