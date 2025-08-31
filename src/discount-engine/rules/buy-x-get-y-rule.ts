// src/discount-engine/rules/buy-x-get-y-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';
import type { BuyGetRule, Product } from '@/types';

export class BuyXGetYRule implements IDiscountRule {
  private config: BuyGetRule;
  private campaignName: string;
  private allProducts: Product[];
  public readonly isPotentiallyRepeatable = true; 

  constructor(config: BuyGetRule, campaignName: string, allProducts: Product[]) {
    this.config = config;
    this.campaignName = campaignName;
    this.allProducts = allProducts;
  }
  
  public getId(): string {
    return this.config.id;
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
    
    const timesRuleCanApply = isRepeatable ? Math.floor(totalBuyQuantity / buyQuantity) : 1;
    let freeItemsToDistribute = timesRuleCanApply * getQuantity;

    for (const getItem of getItems) {
      if (freeItemsToDistribute <= 0) break;

      const lineResult = result.getLineItem(getItem.lineId);
      // The new engine logic ensures we only process an item once.
      // So, if the "get" item already has a discount, this rule won't even be checked for it.
      if (!lineResult) continue;

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
          ruleId: id,
          discountAmount: finalDiscount,
          description: `Offer: ${name}`,
          appliedRuleInfo: {
            ruleId: id,
            discountCampaignName: this.campaignName,
            sourceRuleName: name,
            totalCalculatedDiscount: finalDiscount,
            ruleType: 'buy_get_free',
            productIdAffected: getItem.productId,
            isRepeatable: isRepeatable, 
          },
        });
        freeItemsToDistribute -= itemsInLineToDiscount;
      }
    }
  }
}
