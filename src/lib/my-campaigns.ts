// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';

// **උදාහරණය 1: "Summer Sale" - බහු-වට්ටම් (Multiple Discounts)**
export const summerSale: DiscountSet = {
  id: 'promo-summer',
  name: 'Summer Sale',
  isActive: true,
  isDefault: true,
  isOneTimePerTransaction: false, // එකකට වඩා වට්ටම් ලැබිය හැක
  productConfigurations: [
    { // T-Shirt එකට 10%ක වට්ටමක්
      id: 'summersale-tshirt-config',
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-summer',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'T-Shirt Offer', type: 'percentage', value: 10,
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ],
  globalCartPriceRuleJson: { // මුළු බිල 10,000/= ට වැඩි නම්, තවත් රු. 500ක වට්ටමක්
    isEnabled: true, name: 'Big Spender Bonus', type: 'fixed', value: 500, conditionMin: 10000
  }
};

// **උදාහරණය 2: "Vintage Stock Clearance" - Batch-wise වට්ටම්**
export const vintageSale: DiscountSet = {
  id: 'promo-vintage',
  name: 'Vintage Stock Clearance',
  isActive: true,
  isDefault: false,
  isOneTimePerTransaction: false,
  batchConfigurations: [
    { // "Old Batch" එකේ T-Shirt වලට පමණක් 50%ක විශේෂ වට්ටමක්
      id: 'vintage-old-batch-config',
      productBatchId: 't-shirt-batch-old',
      discountSetId: 'promo-vintage',
      isActiveForBatchInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'Clearance: Old T-Shirt Batch', type: 'percentage', value: 50
      },
      lineItemQuantityRuleJson: null,
    }
  ],
  productConfigurations: [
     { // සාමාන්‍ය T-Shirt (New Batch) වලට 10%ක වට්ටමක්
      id: 'vintage-tshirt-config',
      productId: 't-shirt-01',
      productNameAtConfiguration: 'T-Shirt',
      discountSetId: 'promo-vintage',
      isActiveForProductInCampaign: true,
      lineItemValueRuleJson: {
        isEnabled: true, name: 'T-Shirt Offer', type: 'percentage', value: 10
      },
      lineItemQuantityRuleJson: null,
      specificQtyThresholdRuleJson: null,
      specificUnitPriceThresholdRuleJson: null,
    }
  ]
};
