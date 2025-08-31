// src/discount-engine/rules/buy-x-get-y-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { BuyGetRule, DiscountSet } from '@/types';

export class BuyXGetYRule implements IDiscountRule {
  private config: BuyGetRule;

  constructor(config: BuyGetRule) {
    this.config = config;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    const {
      id,
      name,
      buyProductId,
      buyQuantity,
      getProductId,
      getQuantity,
      discountType,
      discountValue,
      isRepeatable,
    } = this.config;

    const buyItems = context.items.filter((item) => item.productId === buyProductId);
    if (buyItems.length === 0) return;
    
    const totalBuyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalBuyQuantity < buyQuantity) return;

    const getItems = context.items.filter((item) => item.productId === getProductId);
    if (getItems.length === 0) return;

    // This rule is repeatable by its nature. The DiscountEngine will control if it *actually* repeats.
    const timesRuleCanApply = isRepeatable ? Math.floor(totalBuyQuantity / buyQuantity) : 1;
    let freeItemsToDistribute = timesRuleCanApply * getQuantity;

    for (const getItem of getItems) {
      if (freeItemsToDistribute <= 0) break;

      const lineResult = result.getLineItem(getItem.lineId);
      if (!lineResult || lineResult.totalDiscount > 0) continue;

      const itemsInLineToDiscount = Math.min(getItem.quantity, freeItemsToDistribute);
      if (itemsInLineToDiscount <= 0) continue;

      let discountAmountForThisLine = 0;
      if (discountType === 'percentage') {
        discountAmountForThisLine = getItem.price * (discountValue / 100) * itemsInLineToDiscount;
      } else { 
        discountAmountForThisLine = discountValue * itemsInLineToDiscount;
      }
      
      const maxApplicableDiscount = (getItem.price * itemsInLineToDiscount);
      const finalDiscount = Math.min(discountAmountForThisLine, maxApplicableDiscount);

      if (finalDiscount > 0) {
        lineResult.addDiscount({
          // Using the rule's own ID as the unique identifier.
          ruleId: id, 
          discountAmount: finalDiscount,
          description: `Offer: ${name}`,
          appliedRuleInfo: {
            ruleId: id, // Pass the unique rule ID
            discountCampaignName: "N/A", // This should be filled by a higher authority if needed
            sourceRuleName: name,
            totalCalculatedDiscount: finalDiscount,
            ruleType: 'buy_get_free',
            productIdAffected: getItem.productId,
            isRepeatable: isRepeatable, // Let the engine know this rule's nature
          },
        });
        freeItemsToDistribute -= itemsInLineToDiscount;
      }
    }
  }
}
