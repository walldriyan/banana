// src/discount-engine/utils/helpers.ts
import type { SpecificDiscountRuleConfig } from '@/types';

/**
 * A generic function to evaluate a standard discount rule configuration.
 * @param ruleConfig The configuration object for the rule.
 * @param itemPrice The price of a single unit of the item.
 * @param itemQuantity The quantity of the item in the line.
 * @param lineTotalValue The total value of the line (price * quantity).
 * @param valueToTestCondition The value to test against the rule's min/max conditions.
 * @returns The calculated discount amount, or 0 if the rule doesn't apply.
 */
export function evaluateRule(
  ruleConfig: SpecificDiscountRuleConfig | null,
  itemPrice: number,
  itemQuantity: number,
  lineTotalValue: number,
  valueToTestCondition?: number
): number {
  if (!ruleConfig || !ruleConfig.isEnabled) return 0;
  
  const value = valueToTestCondition ?? lineTotalValue;

  const conditionMet =
    value >= (ruleConfig.conditionMin ?? 0) &&
    value <= (ruleConfig.conditionMax ?? Infinity);

  if (!conditionMet) return 0;

  let discountAmount = 0;
  if (ruleConfig.type === 'fixed') {
    if (ruleConfig.applyFixedOnce) {
      // Apply the fixed discount only once for the entire line item.
      discountAmount = ruleConfig.value;
    } else {
      // Apply the fixed discount for each unit in the line item.
      discountAmount = ruleConfig.value * itemQuantity;
    }
  } else { // percentage
    // Percentage is always calculated on the total value of the line.
    // The concept of "apply once" is implicit for percentage discounts on a line item total.
    // If you needed percentage per unit, the calculation would be different, but typically it's on the total.
    discountAmount = lineTotalValue * (ruleConfig.value / 100);
  }
  
  // Ensure discount is not more than the line's total value.
  return Math.max(0, Math.min(discountAmount, lineTotalValue));
}
