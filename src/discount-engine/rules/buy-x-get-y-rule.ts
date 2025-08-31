// src/discount-engine/rules/buy-x-get-y-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { BuyGetRule, DiscountSet } from '@/types';

export class BuyXGetYRule implements IDiscountRule {
  private config: BuyGetRule;
  private campaign: DiscountSet; // Changed to hold the whole campaign

  constructor(config: BuyGetRule, campaign: DiscountSet) { // Changed to accept the whole campaign
    this.config = config;
    this.campaign = campaign;
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

    // The 'One-Time Deal' switch globally overrides the individual rule's 'isRepeatable' setting.
    const ruleCanRepeat = this.campaign.isOneTimePerTransaction ? false : isRepeatable;

    const timesRuleApplies = ruleCanRepeat ? Math.floor(totalBuyQuantity / buyQuantity) : 1;
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
      } else { 
        discountAmountForThisLine = discountValue * itemsInLineToDiscount;
      }
      
      const maxApplicableDiscount = (getItem.price * itemsInLineToDiscount);
      const finalDiscount = Math.min(discountAmountForThisLine, maxApplicableDiscount);

      if (finalDiscount > 0) {
        lineResult.addDiscount({
          ruleId: `bogo-${buyProductId}-${getProductId}`,
          discountAmount: finalDiscount,
          description: `Buy ${buyQuantity} of ${buyProductId}, Get ${getQuantity} of ${getProductId} offer.`,
          appliedRuleInfo: {
            discountCampaignName: this.campaign.name,
            sourceRuleName: `Buy ${buyItems[0].name} Get ${getItem.name}`,
            totalCalculatedDiscount: finalDiscount,
            ruleType: 'buy_get_free',
            productIdAffected: getItem.productId,
          },
        });
        freeItemsToDistribute -= itemsInLineToDiscount;
      }
    }
  }
}
