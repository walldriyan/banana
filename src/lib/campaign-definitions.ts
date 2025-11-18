// src/lib/campaign-definitions.ts
import type { DiscountSet } from '@/types';

// This file contains the actual definitions of the campaigns.
// It helps to keep the campaign data separate from the logic that uses it.

export const megaDealFest: DiscountSet = {
  id: 'promo-mega-deal',
  name: 'Mega Deal Fest',
  description: 'විශේෂ මහ-වට්ටම් උත්සවය - විවිධ නීති සමග',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: false, 
  
  productConfigurations: [
    { 
      id: 'mega-jeans-config-1',
      productId: 'jeans-01', // General Product ID
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 1, 
      specificQtyThresholdRuleJson: { 
        isEnabled: true, 
        name: 'Jeans Duo-Pack Discount', 
        type: 'fixed', 
        value: 1000, 
        conditionMin: 2, 
        applyFixedOnce: true, 
        description: 'Rs.1000 off when buying 2 or more jeans'
      },
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-tshirt-config-1',
      productId: 't-shirt-01', // General Product ID
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 1,
      specificQtyThresholdRuleJson: { 
          isEnabled: true, 
          name: 'T-Shirt 4-Pack Deal', 
          type: 'fixed', 
          value: 150, 
          applyFixedOnce: false, 
          conditionMin: 4,
          description: 'Rs.150 off per T-shirt when buying 4 or more'
      },
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  
  batchConfigurations: [
    { 
      id: 'mega-old-tshirt-batch-config',
      productBatchId: 't-shirt-old-batch', // Unique Product ID
      discountSetId: 'promo-mega-deal',
      isActiveForBatchInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: {
        isEnabled: true, 
        name: 'Old T-Shirt Clearance', 
        type: 'percentage', 
        value: 50,
        applyFixedOnce: false,
        description: '50% off each old batch T-shirt'
      },
      lineItemQuantityRuleJson: null,
    },
  ],
  
  buyGetRulesJson: [
    {
      id: 'mega-bogo-tshirt',
      name: 'Buy 2 T-Shirts Get 1 Free',
      buyProductId: 't-shirt-01', // General Product ID
      buyQuantity: 2,
      getProductId: 't-shirt-01', // General Product ID
      getQuantity: 1,
      discountType: 'free',
      discountValue: 100, 
      isRepeatable: true,
      description: 'Buy 2 T-shirts, get 1 completely free'
    }
  ],
  
  globalCartPriceRuleJson: { 
    isEnabled: true, 
    name: 'Super Saver Bonus', 
    type: 'fixed', 
    value: 1000, 
    conditionMin: 25000,
    applyFixedOnce: true,
    description: 'Rs.1000 off when cart total exceeds Rs.25,000'
  },

  defaultLineItemValueRuleJson: {
      isEnabled: true, 
      name: '5% OFF on Others', 
      type: 'percentage', 
      value: 5, 
      conditionMin: 5000,
      description: '5% off other items when line value exceeds Rs.5000',
      applyFixedOnce: false
  },

  globalCartQuantityRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};


export const clearanceSale: DiscountSet = {
  id: 'promo-clearance',
  name: 'Clearance Sale',
  description: 'අවසාන වට්ටම් අලෙවිය - BOGO සහ විශේෂ batch වට්ටම්',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  productConfigurations: [],

  batchConfigurations: [
    { 
      id: 'clearance-old-tshirt-batch-config',
      productBatchId: 't-shirt-old-batch', // Unique Product ID
      discountSetId: 'promo-clearance',
      isActiveForBatchInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: {
        isEnabled: true, 
        name: 'MUST GO: Old T-Shirts', 
        type: 'percentage', 
        value: 60,
        description: 'Massive 60% off old batch T-shirts',
        applyFixedOnce: false
      },
      lineItemQuantityRuleJson: null,
    }
  ],

  buyGetRulesJson: [
      {
          id: 'clearance-bogo-jeans',
          name: 'Buy T-Shirt Get 50% Off Jeans',
          buyProductId: 't-shirt-01', // General Product ID
          buyQuantity: 1,
          getProductId: 'jeans-01', // General Product ID
          getQuantity: 1,
          discountType: 'percentage', 
          discountValue: 50, 
          isRepeatable: true,
          description: 'Buy a T-shirt and get 50% off a pair of jeans'
      }
  ],

  globalCartPriceRuleJson: null,
  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};

export const vipExclusive: DiscountSet = {
  id: 'promo-vip-exclusive',
  name: 'VIP Customer Exclusive',
  description: 'VIP පාරිභෝගිකයන්ට විශේෂ එක් වරක් පමණක් ලබාගත හැකි වට්ටම්',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: true,

  productConfigurations: [
    {
      id: 'vip-tshirt-special',
      productId: 't-shirt-01', // General Product ID
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-vip-exclusive',
      isActiveForProductInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: {
        isEnabled: true,
        name: 'VIP T-Shirt Special',
        type: 'percentage',
        value: 25,
        conditionMin: 2000,
        applyFixedOnce: true,
        description: 'VIP exclusive: 25% off T-shirts (once per transaction)'
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],

  batchConfigurations: [],
  buyGetRulesJson: [],

  globalCartPriceRuleJson: {
    isEnabled: true,
    name: 'VIP Cart Bonus',
    type: 'fixed',
    value: 2000,
    conditionMin: 20000,
    applyFixedOnce: true,
    description: 'VIP exclusive: Rs.2000 off when cart exceeds Rs.20,000 (once per transaction)'
  },

  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};
