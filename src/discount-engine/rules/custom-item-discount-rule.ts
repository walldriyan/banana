// src/discount-engine/rules/custom-item-discount-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import { generateRuleId } from '../utils/helpers';

/**
 * This rule has the highest priority and applies manually set discounts.
 * It checks if a `customDiscountValue` is present on a line item.
 */
export class CustomItemDiscountRule implements IDiscountRule {
  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
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
        const ruleId = generateRuleId('custom', item.lineId, 'manual_discount', item.productId);
        
        lineResult.addDiscount({
          ruleId,
          discountAmount,
          description: `Custom ${item.customDiscountType} discount of ${item.customDiscountValue} applied manually.`,
          isOneTime: false, // Custom discounts are typically not one-time restricted
          appliedRuleInfo: {
            discountCampaignName: "Manual Discount",
            sourceRuleName: `Custom ${item.customDiscountType === 'fixed' ? 'Fixed' : 'Percentage'} Discount`,
            totalCalculatedDiscount: discountAmount,
            ruleType: 'custom_item_discount',
            productIdAffected: item.productId,
            appliedOnce: false
          },
        });
      }
    });
  }
}