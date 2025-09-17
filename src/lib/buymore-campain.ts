import { DiscountSet } from "@/types";

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
          productBatchId: 't-shirt-old-batch', // Matches the unique product ID
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
          productBatchId: 'jeans-old-batch', // Matches the unique product ID
          discountSetId: 'promo-buy-more',
          isActiveForBatchInCampaign: true,
          priority: 1,
          lineItemValueRuleJson: {
            isEnabled: true,
            name: 'Old Jeans Batch Flat Discount',
            type: 'fixed',
            value: 800,
            conditionMin: 14000,
            applyFixedOnce: true,
            description: 'Flat Rs.800 off old batch jeans line when value over Rs.14,000'
          },
          lineItemQuantityRuleJson: null,
        },
        {
          id: 'buymore-new-tshirt-batch-config',
          productBatchId: 't-shirt-new-batch', // Matches the unique product ID
          discountSetId: 'promo-buy-more',
          isActiveForBatchInCampaign: true,
          priority: 1,
          lineItemQuantityRuleJson: {
              isEnabled: true, 
              name: 'New T-Shirt Offer', 
              type: 'percentage',
              value: 10,
              conditionMin: 3,
              conditionMax: 5,
              applyFixedOnce: false,
              description: '10% off each new T-shirt when buying 3 to 5 units'
          },
          lineItemValueRuleJson: null,
        },
        {
          id: 'buymore-new-jeans-batch-config',
          productBatchId: 'jeans-new-batch', // Matches the unique product ID
          discountSetId: 'promo-buy-more',
          isActiveForBatchInCampaign: true,
          priority: 1,
          lineItemQuantityRuleJson: {
              isEnabled: true, 
              name: 'New Jeans Bulk Discount', 
              type: 'fixed', 
              value: 600, 
              conditionMin: 2,
              applyFixedOnce: false,
              description: 'Rs.600 off each new pair of jeans when buying 2 or more'
          },
          lineItemValueRuleJson: null,
        }
    ],
  
    globalCartQuantityRuleJson: {
        isEnabled: false,
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
