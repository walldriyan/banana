// src/discount-engine/rules/buy-x-get-y-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { BuyGetRule } from '@/types';

export class BuyXGetYRule implements IDiscountRule {
  private config: BuyGetRule;
  // **THE FIX IS HERE**
  // This flag tells the engine that THIS TYPE of rule could be repeatable.
  // The engine then decides IF it should repeat based on the global 'isOneTimePerTransaction' flag.
  public readonly isPotentiallyRepeatable = true; 

  constructor(config: BuyGetRule) {
    this.config = config;
  }
  
  public getId(): string {
    // A unique, stable ID for this specific BOGO rule instance.
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
      isRepeatable, // The rule's own setting for WHEN it can repeat
    } = this.config;

    const buyItems = context.items.filter((item) => item.productId === buyProductId);
    if (buyItems.length === 0) return;
    
    const totalBuyQuantity = buyItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalBuyQuantity < buyQuantity) return;

    const getItems = context.items.filter((item) => item.productId === getProductId);
    if (getItems.length === 0) return;

    // The engine's global 'isOneTimePerTransaction' flag is handled by the engine itself.
    // This rule only needs to check its own local isRepeatable flag.
    const timesRuleCanApply = isRepeatable ? Math.floor(totalBuyQuantity / buyQuantity) : 1;
    let freeItemsToDistribute = timesRuleCanApply * getQuantity;

    for (const getItem of getItems) {
      if (freeItemsToDistribute <= 0) break;

      const lineResult = result.getLineItem(getItem.lineId);
      // We only check for existing discounts on the target item.
      if (!lineResult || lineResult.totalDiscount > 0) continue;

      const itemsInLineToDiscount = Math.min(getItem.quantity, freeItemsToDistribute);
      if (itemsInLineToDiscount <= 0) continue;

      let discountAmountForThisLine = 0;
      if (discountType === 'percentage') {
        discountAmountForThisLine = getItem.price * (discountValue / 100) * itemsInLineToDiscount;
      } else { 
        // Handles 'fixed' and 'free' (where value is often price)
        discountAmountForThisLine = discountValue * itemsInLineToDiscount;
      }
      
      const maxApplicableDiscount = (getItem.price * itemsInLineToDiscount);
      const finalDiscount = Math.min(discountAmountForThisLine, maxApplicableDiscount);

      if (finalDiscount > 0) {
        lineResult.addDiscount({
          ruleId: id, // Use the specific rule config's ID
          discountAmount: finalDiscount,
          description: `Offer: ${name}`,
          appliedRuleInfo: {
            ruleId: id, // Pass the unique rule ID
            discountCampaignName: "N/A", // This should be filled by a higher authority if needed
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
