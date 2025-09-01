// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';

// **උදාහරණය 1: "Mega Deal Fest" - විවිධ නීති එකට**
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
      productId: 'jeans-01',
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
      productId: 't-shirt-01',
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
      productBatchId: 't-shirt-batch-old',
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
      buyProductId: 't-shirt-01',
      buyQuantity: 2,
      getProductId: 't-shirt-01',
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

// **උදාහරණය 2: "Buy More, Save More" - ප්‍රමාණය මත පදනම් වූ දීමනා**
export const buyMoreSaveMore: DiscountSet = {
  id: 'promo-buy-more',
  name: 'Buy More, Save More',
  description: 'වැඩි ගනන් මිලදී ගන්න, වැඩි වට්ටම් ලබාගන්න',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: true,

  productConfigurations: [],

  batchConfigurations: [
      {
        id: 'buymore-old-tshirt-batch-config',
        productBatchId: 't-shirt-batch-old',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemQuantityRuleJson: {
            isEnabled: true, 
            name: 'Old T-Shirt Batch Deal', 
            type: 'fixed',
            value: 150,
            conditionMin: 2,
            applyFixedOnce: false,
            description: 'Extra Rs.150 off each old batch T-shirt when buying 2+'
        },
        lineItemValueRuleJson: null,
      },
      {
        id: 'buymore-old-jeans-batch-config',
        productBatchId: 'jeans-batch-old',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemValueRuleJson: {
            isEnabled: true, 
            name: 'Old Jeans Batch Flat Discount', 
            type: 'fixed', 
            conditionMin: 14000,
            value: 800, 
            applyFixedOnce: true,
            description: 'Flat Rs.800 off old batch jeans line when value over Rs.14,000'
        },
        lineItemQuantityRuleJson: null,
      },
      // ✅ FIX: Added rules for NEW batches
      {
        id: 'buymore-new-tshirt-batch-config',
        productBatchId: 't-shirt-batch-new',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemQuantityRuleJson: {
            isEnabled: true, 
            name: 'New T-Shirt Offer', 
            type: 'percentage',
            value: 10, // 10% off
            conditionMin: 3, // when buying 3 or more
            applyFixedOnce: false,
            description: '10% off each new T-shirt when buying 3 or more'
        },
        lineItemValueRuleJson: null,
      },
      {
        id: 'buymore-new-jeans-batch-config',
        productBatchId: 'jeans-batch-new',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemQuantityRuleJson: {
            isEnabled: true, 
            name: 'New Jeans Bulk Discount', 
            type: 'fixed', 
            value: 7, 
            conditionMin: 4,
            applyFixedOnce: true, // Rs. 600 off EACH
            description: 'Rs.600 off each new pair of jeans when buying 2 or more'
        },
        lineItemValueRuleJson: null,
      }
  ],

  globalCartQuantityRuleJson: {
      isEnabled: true,
      name: 'Shopping Haul Bonus',
      type: 'fixed',
      value: 400, 
      conditionMin: 5,
      applyFixedOnce: true,
      description: 'Rs.400 bonus discount for buying 5+ items (once per transaction)'
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
  description: 'අවසාන වට්ටම් අලෙවිය - BOGO සහ විශේෂ batch වට්ටම්',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,

  productConfigurations: [],

  batchConfigurations: [
    { 
      id: 'clearance-old-tshirt-batch-config',
      productBatchId: 't-shirt-batch-old',
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
          buyProductId: 't-shirt-01', 
          buyQuantity: 1,
          getProductId: 'jeans-01', 
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

// **උදාහරණය 4: "VIP Customer Exclusive" - One-time per transaction demonstration**
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
      productId: 't-shirt-01',
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
