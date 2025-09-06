// ===== FILE 5: src/discount-engine/rules/custom-item-discount-rule.ts =====
import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';
import { generateRuleId, evaluateRule } from '../utils/helpers';

export class CustomItemDiscountRule implements IDiscountRule {
  readonly isPotentiallyRepeatable: boolean = false; // Custom discounts are unique

  getId(item?: LineItemData): string {
    return `custom${item ? `-${item.lineId}` : '-unknown'}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult || !item.customDiscountValue || item.customDiscountValue <= 0) {
        return;
      }

      console.log(`Processing custom discount for item ${item.lineId}: type=${item.customDiscountType}, value=${item.customDiscountValue}`);

      let discountAmount = 0;
      const lineTotal = item.price * item.quantity;
      const applyOnce = item.customApplyFixedOnce ?? false; 

      if (item.customDiscountType === 'fixed' && applyOnce) {
        // *** THE DEFINITIVE FIX ***
        // If it's a fixed discount meant to be applied only once,
        // we directly use the value and DO NOT multiply by quantity.
        // This bypasses the evaluateRule helper which was causing the issue.
        discountAmount = item.customDiscountValue;
      } else {
        // For percentage discounts OR per-unit fixed discounts, use the helper
        const tempRuleConfig = {
          isEnabled: true,
          name: 'Custom Rule',
          type: item.customDiscountType!,
          value: item.customDiscountValue,
          applyFixedOnce: applyOnce
        };
         discountAmount = evaluateRule(
            tempRuleConfig,
            item.price,
            item.quantity,
            lineTotal,
            lineTotal // For custom rules, condition is always met, so test against lineTotal
        );
      }


      // Ensure discount doesn't exceed the line total
      discountAmount = Math.min(discountAmount, lineTotal);
      
      console.log(`Custom discount calculation: lineTotal=${lineTotal}, discountAmount=${discountAmount}, applyOnce=${applyOnce}`);
      
      if (discountAmount > 0) {
        const ruleId = generateRuleId('custom', item.lineId, 'manual_discount', item.productId);
        
        console.log(`Applying custom discount: ruleId=${ruleId}, amount=${discountAmount}`);
        
        lineResult.addDiscount({
          ruleId,
          discountAmount,
          description: `Custom ${item.customDiscountType} discount of ${item.customDiscountValue} applied manually.`,
          isOneTime: applyOnce, // Pass the one-time flag to the result
          appliedRuleInfo: {
            discountCampaignName: "Manual Discount",
            sourceRuleName: `Custom ${item.customDiscountType === 'fixed' ? 'Fixed' : 'Percentage'} Discount`,
            totalCalculatedDiscount: discountAmount,
            ruleType: 'custom_item_discount',
            productIdAffected: item.productId,
            appliedOnce: applyOnce,
          },
        });
      }
    });
  }
}
