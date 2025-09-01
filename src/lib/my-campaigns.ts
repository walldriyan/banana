// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';

// **උදාහරණය 1: "Mega Deal Fest" - විවිධ නීති එකට**
// Enhanced with proper one-time configurations and better rule priority
export const megaDealFest: DiscountSet = {
  id: 'promo-mega-deal',
  name: 'Mega Deal Fest',
  description: 'විශේෂ මහ-වට්ටම් උත්සවය - විවිධ නීති සමග',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: false, // Campaign-level: rules can be applied multiple times
  
  // Product-specific discounts with priority handling
  productConfigurations: [
    { 
      id: 'mega-jeans-config-1', // Priority 1 for Jeans
      productId: 'jeans-01',
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 1, // Highest priority
      lineItemValueRuleJson: { 
        isEnabled: true, 
        name: '15% OFF All Jeans', 
        type: 'fixed', 
        value: 15,
        description: 'General 15% discount on any jeans purchase',
        applyFixedOnce: false // Can apply to multiple units
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: { 
        isEnabled: true, 
        name: 'Jeans Duo-Pack Discount', 
        type: 'fixed', 
        value: 1000, 
        conditionMin: 2, 
        applyFixedOnce: true, // Apply once per line item
        description: 'Rs.1000 off when buying 2 or more jeans'
      },
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-jeans-config-2', // Priority 2 for Jeans (fallback)
      productId: 'jeans-01',
      productNameAtConfiguration: 'Jeans',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 2, // Lower priority
      lineItemValueRuleJson: { 
        isEnabled: true, 
        name: 'High-Value Jeans Discount', 
        type: 'fixed', 
        value: 500, 
        conditionMin: 10000, 
        applyFixedOnce: true,
        description: 'Rs.500 off for jeans purchases over Rs.10,000'
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-tshirt-config-1', // Priority 1 for T-Shirt
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: { 
        isEnabled: true, 
        name: 'T-Shirt Bulk Offer', 
        type: 'percentage', 
        value: 5, 
        conditionMin: 5000,
        description: '5% off T-shirts when line value exceeds Rs.5000',
        applyFixedOnce: false
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
      id: 'mega-tshirt-config-2', // Priority 2 for T-Shirt
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-mega-deal',
      isActiveForProductInCampaign: true,
      priority: 2,
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: { 
          isEnabled: true, 
          name: 'T-Shirt 4-Pack Deal', 
          type: 'fixed', 
          value: 150, 
          applyFixedOnce: false, // Rs.150 off per shirt
          conditionMin: 4,
          description: 'Rs.150 off per T-shirt when buying 4 or more'
      },
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  
  // Batch-specific discount for old T-Shirts (higher priority than product rules)
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
        type: 'fixed', 
        value: 300, 
        applyFixedOnce: false, // Rs.300 off per shirt
        description: 'Rs.300 off each old batch T-shirt'
      },
      lineItemQuantityRuleJson: null,
    },
    { 
      id: 'mega-new-tshirt-batch-config',
      productBatchId: 't-shirt-batch-new',
      discountSetId: 'promo-mega-deal',
      isActiveForBatchInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: {
        isEnabled: true, 
        name: 'New Arrival T-Shirts', 
        type: 'percentage', 
        value: 10,
        description: '10% off new arrival T-shirts',
        applyFixedOnce: false
      },
      lineItemQuantityRuleJson: null,
    }
  ],
  
  // Buy-Get rules with proper configuration
  buyGetRulesJson: [
    {
      id: 'mega-bogo-tshirt',
      name: 'Buy 2 T-Shirts Get 1 Free',
      buyProductId: 't-shirt-01',
      buyQuantity: 2,
      getProductId: 't-shirt-01',
      getQuantity: 1,
      discountType: 'free',
      discountValue: 100, // 100% off for free items
      isRepeatable: true,
      description: 'Buy 2 T-shirts, get 1 completely free'
    }
  ],
  
  // Global cart total discount - one-time per transaction
  globalCartPriceRuleJson: { 
    isEnabled: true, 
    name: 'Super Saver Bonus', 
    type: 'fixed', 
    value: 1000, 
    conditionMin: 15000,
    applyFixedOnce: true, // One-time per transaction
    description: 'Rs.1000 off when cart total exceeds Rs.15,000'
  },

  // Default discount for any other items
  defaultLineItemValueRuleJson: {
      isEnabled: true, 
      name: '5% OFF on Others', 
      type: 'percentage', 
      value: 5, 
      conditionMin: 5000,
      description: '5% off other items when line value exceeds Rs.5000',
      applyFixedOnce: false
  },

  // Nullify other rules not used in this campaign
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
  isOneTimePerTransaction: true, // One-time per transaction campaign

  productConfigurations: [
    {
      id: 'buymore-tshirt-config',
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-buy-more',
      isActiveForProductInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: null,
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: {
          isEnabled: true,
          name: 'T-Shirt Bulk Buy',
          type: 'fixed',
          value: 250, 
          conditionMin: 4, 
          applyFixedOnce: true, // 🔑 මේකයි fix කරන්න ඕනේ තැන! true කළම එක line එකට එක වරක් විතරක්
          description: 'Rs.250 off per line when buying 3 or more T-shirts (applied once per line item)'
      },
      specificUnitPriceThresholdRuleJson: null,
    },
    { 
        id: 'buymore-jeans-config',
        productId: 'jeans-batch-old',
        productNameAtConfiguration: 'jeans-01',
        discountSetId: 'promo-buy-more',
        isActiveForProductInCampaign: true,
        priority: 1,
        lineItemValueRuleJson: null,
        lineItemQuantityRuleJson: null,
        specificQtyThresholdRuleJson: {
          isEnabled: true,
          name: 'T-Shirt Bulk Buy',
          type: 'fixed',
          value: 250, 
          conditionMin: 4, 
          conditionMax: 7, 
          applyFixedOnce: true, // 🔑 මේකයි fix කරන්න ඕනේ තැන! true කළම එක line එකට එක වරක් විතරක්
          description: 'Rs.250 off per line when buying 3 or more T-shirts (applied once per line item)'
      },
      specificUnitPriceThresholdRuleJson: null,
    }
  ],

  batchConfigurations: [
      {
        id: 'buymore-old-tshirt-batch-config',
        productBatchId: 't-shirt-batch-old',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemValueRuleJson: {
            isEnabled: true, 
            name: 'Extra for Old Stock', 
            type: 'fixed', 
            value: 100, 
            conditionMin:2,
            conditionMax:4,
            applyFixedOnce: false,
            description: 'Extra Rs.100 off each old batch T-shirt'
        },
        lineItemQuantityRuleJson: null,
      },
      {
        id: 'buymore-old-jeans-batch-config',
        productBatchId: 'jeans-batch-old',
        discountSetId: 'promo-buy-more',
        isActiveForBatchInCampaign: true,
        priority: 1,
        lineItemValueRuleJson: {
            isEnabled: true, 
            name: 'Extra for Old Stock jns', 
            type: 'fixed', 
            conditionMin:2,
            conditionMax:4,
            value: 77, 
            applyFixedOnce: true,
            description: 'Extra Rs.10099 off each old batch T-shirt'
        },
        lineItemQuantityRuleJson: null,
      }
  ],

  // One-time cart quantity bonus
  globalCartQuantityRuleJson: {
      isEnabled: true,
      name: 'Shopping Haul Bonus',
      type: 'fixed',
      value: 400, 
      conditionMin: 5,
      applyFixedOnce: true, // One-time cart bonus
      description: 'Rs.400 bonus discount for buying 5+ items'
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
  isOneTimePerTransaction: false, // Repeatable rules for clearance

  productConfigurations: [
      { 
        id: 'clearance-jeans-special',
        productId: 'jeans-01',
        productNameAtConfiguration: 'Jeans',
        discountSetId: 'promo-clearance',
        isActiveForProductInCampaign: true,
        priority: 1,
        lineItemValueRuleJson: {
            isEnabled: true, 
            name: 'Jeans Clearance Price', 
            type: 'percentage', 
            value: 30,
            description: '30% off all jeans during clearance',
            applyFixedOnce: false
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
    },
    { 
      id: 'clearance-new-tshirt-batch-config',
      productBatchId: 't-shirt-batch-new',
      discountSetId: 'promo-clearance',
      isActiveForBatchInCampaign: true,
      priority: 1,
      lineItemValueRuleJson: {
        isEnabled: true, 
        name: 'New T-Shirt Consolation', 
        type: 'fixed', 
        value: 50, 
        applyFixedOnce: false,
        description: 'Rs.50 off each new batch T-shirt'
      },
      lineItemQuantityRuleJson: null,
    }
  ],

  // Enhanced Buy-Get rules
  buyGetRulesJson: [
      {
          id: 'clearance-bogo-jeans',
          name: 'Buy 2 T-Shirts Get 50% Off Jeans',
          buyProductId: 't-shirt-01', 
          buyQuantity: 2,
          getProductId: 'jeans-01', 
          getQuantity: 1,
          discountType: 'percentage', 
          discountValue: 50, 
          isRepeatable: true,
          description: 'Buy 2 T-shirts and get 50% off 1 pair of jeans'
      },
      {
          id: 'clearance-mega-bogo',
          name: 'Buy 3 Get 1 Free Special',
          buyProductId: 't-shirt-01', 
          buyQuantity: 3,
          getProductId: 't-shirt-01', 
          getQuantity: 1,
          discountType: 'free', 
          discountValue: 100, 
          isRepeatable: false, // One-time per transaction
          maxApplications: 1,
          description: 'Buy 3 T-shirts, get 1 completely free (once per transaction)'
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
  isOneTimePerTransaction: true, // Global one-time per transaction

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
        applyFixedOnce: true, // One-time application
        description: 'VIP exclusive: 25% off T-shirts (once per transaction)'
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],

  batchConfigurations: [],
  buyGetRulesJson: [],

  // VIP cart bonus - one-time only
  globalCartPriceRuleJson: {
    isEnabled: true,
    name: 'VIP Cart Bonus',
    type: 'fixed',
    value: 2000,
    conditionMin: 20000,
    applyFixedOnce: true, // One-time per transaction
    description: 'VIP exclusive: Rs.2000 off when cart exceeds Rs.20,000 (once per transaction)'
  },

  globalCartQuantityRuleJson: null,
  defaultLineItemValueRuleJson: null,
  defaultLineItemQuantityRuleJson: null,
  defaultSpecificQtyThresholdRuleJson: null,
  defaultSpecificUnitPriceThresholdRuleJson: null,
};