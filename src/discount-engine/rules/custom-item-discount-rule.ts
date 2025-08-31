import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';

/**
 * This rule has the highest priority and applies manually set discounts.
 * It checks if a `customDiscountValue` is present on a line item.
 */
export class CustomItemDiscountRule implements IDiscountRule {
  public readonly isPotentiallyRepeatable = false;

  public getId(item: LineItemData): string {
    // This ID is stable for a given line item
    return `custom-for-${item.lineId}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
      // The new engine logic ensures this rule is only checked if no other discount has been applied.
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult || !item.customDiscountValue || item.customDiscountValue <= 0) {
        return;
      }

      let discountAmount = 0;
      const lineTotal = item.price * item.quantity;

      if (item.customDiscountType === 'fixed') {
        // Fixed amount OFF PER UNIT
        discountAmount = item.customDiscountValue * item.quantity;
      } else {
        // Percentage off the total line value
        discountAmount = lineTotal * (item.customDiscountValue / 100);
      }

      // Ensure discount doesn't exceed the line total
      discountAmount = Math.min(discountAmount, lineTotal);
      
      if (discountAmount > 0) {
        lineResult.addDiscount({
          ruleId: this.getId(item),
          discountAmount,
          description: `Custom ${item.customDiscountType} discount of ${item.customDiscountValue} applied.`,
          appliedRuleInfo: {
            ruleId: this.getId(item),
            discountCampaignName: "Custom",
            sourceRuleName: `Custom Discount`,
            totalCalculatedDiscount: discountAmount,
            ruleType: 'custom_item_discount',
            productIdAffected: item.productId,
          },
        });
      }
    });
  }
}
