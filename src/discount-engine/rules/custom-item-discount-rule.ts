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
      
      // DEBUG: Log the received custom discount data from the SaleItem
      console.log(`[CustomItemDiscountRule] Processing item ${item.lineId}:`, {
          type: item.customDiscountType,
          value: item.customDiscountValue,
          applyOnce: item.customApplyFixedOnce
      });

      let discountAmount = 0;
      const lineTotal = item.price * item.quantity;
      
      const isOneTimeFixed = item.customDiscountType === 'fixed' && item.customApplyFixedOnce;
      // This is the special case for one-time fixed discount.
      const applyOnce = item.customApplyFixedOnce ?? false; 

      if (isOneTimeFixed) {
        // This is the special case for one-time fixed discount.
        console.log(`[CustomItemDiscountRule] Applying a single, one-time fixed discount.`);

        // Check if this is a partial refund scenario
        if (item.originalQuantity && item.originalQuantity > item.quantity) {
            // Pro-rate the discount
            const originalDiscount = item.customDiscountValue;
            const originalQty = item.originalQuantity;
            const currentQty = item.quantity;
            discountAmount = (originalDiscount / originalQty) * currentQty;
            console.log(`[CustomItemDiscountRule] Pro-rated refund discount: (${originalDiscount} / ${originalQty}) * ${currentQty} = ${discountAmount}`);
        } else {
             // Normal sale or full refund, apply the discount as is
            discountAmount = item.customDiscountValue;
        }

      } else {
        // For percentage discounts OR per-unit fixed discounts, use the helper
        console.log(`[CustomItemDiscountRule] Using evaluateRule for percentage or per-unit fixed discount.`);
        const tempRuleConfig = {
          isEnabled: true,
          name: 'Custom Rule',
          type: item.customDiscountType!,
          value: item.customDiscountValue,
          // IMPORTANT: Pass the "applyOnce" flag to the evaluation helper
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
      
      // DEBUG: Log the final calculated discount amount
      console.log(`[CustomItemDiscountRule] Final calculated discount for ${item.lineId}: ${discountAmount}, applyOnce flag: ${applyOnce}`);
      
      if (discountAmount > 0) {
        const ruleId = generateRuleId('custom', item.lineId, 'manual_discount', item.productId);
        
        lineResult.addDiscount({
          ruleId,
          discountAmount,
          description: `Custom ${item.customDiscountType} discount of ${item.customDiscountValue} applied manually.`,
          // IMPORTANT: Pass the correct "isOneTime" flag to the result
          isOneTime: applyOnce, 
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
