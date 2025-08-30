// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';

// **උදාහරණය 1: "Mega Deal Fest" - විවිධ නීති එකට**
export const megaDealFest: DiscountSet = {
  id: 'promo-mega-deal',
  name: 'Mega Deal Fest',
  isActive: true,
  isDefault: true, // This will be the default selected campaign
  isOneTimePerTransaction: false,
  
  // Product-specific discount for Jeans
  productConfigurations: [
    { 
      id: 'mega-jeans-config',
      productId: 'jeans-01',
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: '15% OFF All Jeans', type: 'percentage', value: 15,
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  
  // Batch-specific discount for old T-Shirts
  batchConfigurations: [
    { 
      id: 'mega-old-tshirt-batch-config',
      productBatchId: 't-shirt-batch-old',
      discountSetId: 'promo-mega-deal',
      isActiveForBatchInCampaign: true,
      // Fixed Rs. 300 discount for EACH T-shirt from the old batch
      lineItemValueRuleJson: {
        isEnabled: true, name: 'Old T-Shirt Clearance', type: 'fixed', value: 300, applyFixedOnce: false, 
      },
      lineItemQuantityRuleJson: null,
    }
  ],
  
  // Global cart total discount
  globalCartPriceRuleJson: { 
    isEnabled: true, name: 'Super Saver Bonus', type: 'fixed', value: 1000, conditionMin: 15000,
  },

  // Default discount for any other items
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
    { // Buy 3 or more T-shirts (from new batch) and get a discount
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
          value: 250, // Rs. 250 OFF per T-shirt
          conditionMin: 3, // Activates if you buy 3 or more
          applyFixedOnce: false // Discount applies to each item
      },
      specificUnitPriceThresholdRuleJson: null,
    },
    { // Discount on Jeans if they are expensive (e.g. premium version)
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
            value: 20, // 20% OFF
            conditionMin: 7000, // Activates if price is 7000 or more
        }
    }
  ],

  // Global cart QUANTITY discount
  globalCartQuantityRuleJson: {
      isEnabled: true,
      name: 'Shopping Haul Bonus',
      type: 'fixed',
      value: 400, // Rs. 400 off entire bill
      conditionMin: 5, // If cart has 5 or more items in total
  },
  
  // Nullify other rules
  batchConfigurations: [],
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

  // Massive discount on old batch T-shirts
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
    }
  ],

  // A "Buy-Get" rule
  buyGetRulesJson: [
      {
          id: 'clearance-bogo-jeans',
          name: 'Buy T-Shirt Get Jeans',
          buyProductId: 't-shirt-01',
          buyQuantity: 2,
          getProductId: 'jeans-01',
          getQuantity: 1,
          discountType: 'percentage', // 50% off on the 'get' product
          discountValue: 50, 
          isRepeatable: true,
      }
  ],

  // No other discounts in this specific campaign
  productConfigurations: [],
  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};
