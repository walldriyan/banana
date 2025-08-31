// src/discount-engine/rules/buy-x-get-y-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { BuyGetRule } from '@/types';

export class BuyXGetYRule implements IDiscountRule {
  private config: BuyGetRule;
  private campaignName: string;

  constructor(config: BuyGetRule, campaignName?: string) {
    this.config = config;
    this.campaignName = campaignName || 'Unknown Campaign';
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    const {
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

    const timesRuleApplies = isRepeatable ? Math.floor(totalBuyQuantity / buyQuantity) : 1;
    let freeItemsToDistribute = timesRuleApplies * getQuantity;

    for (const getItem of getItems) {
      if (freeItemsToDistribute <= 0) break;

      const lineResult = result.getLineItem(getItem.lineId);
      if (!lineResult || lineResult.totalDiscount > 0) continue;

      const itemsInLineToDiscount = Math.min(getItem.quantity, freeItemsToDistribute);
      if (itemsInLineToDiscount <= 0) continue;

      let discountAmountForThisLine = 0;
      if (discountType === 'percentage') {
        discountAmountForThisLine = getItem.price * (discountValue / 100) * itemsInLineToDiscount;
      } else if (discountType === 'free') {
        // 100% discount for free items
        discountAmountForThisLine = getItem.price * itemsInLineToDiscount;
      } else { 
        // Fixed amount discount
        discountAmountForThisLine = discountValue * itemsInLineToDiscount;
      }
      
      const maxApplicableDiscount = (getItem.price * itemsInLineToDiscount);
      const finalDiscount = Math.min(discountAmountForThisLine, maxApplicableDiscount);

      if (finalDiscount > 0) {
        lineResult.addDiscount({
          ruleId: `bogo-${this.config.id}`,
          discountAmount: finalDiscount,
          description: `${this.config.name}: Buy ${buyQuantity} ${buyProductId}, Get ${getQuantity} ${getProductId}`,
          appliedRuleInfo: {
            discountCampaignName: this.campaignName,
            sourceRuleName: this.config.name,
            totalCalculatedDiscount: finalDiscount,
            ruleType: 'buy_get_rule',
            productIdAffected: getItem.productId,
            appliedOnce: !isRepeatable
          },
        });
        freeItemsToDistribute -= itemsInLineToDiscount;
      }
    }
  }
}