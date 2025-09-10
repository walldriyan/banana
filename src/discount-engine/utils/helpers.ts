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
  // DEBUG: Log all inputs to this core function
  console.log('[evaluateRule] Inputs:', { ruleConfig, itemPrice, itemQuantity, lineTotalValue, valueToTestCondition });

  if (!ruleConfig || !ruleConfig.isEnabled) return 0;
  
  // For quantity-based conditions, the value to test is the current item quantity.
  // For value-based conditions, it's the total line value.
  const valueToTest = valueToTestCondition ?? lineTotalValue;

  const conditionMet =
    valueToTest >= (ruleConfig.conditionMin ?? 0) &&
    valueToTest <= (ruleConfig.conditionMax ?? Infinity);

  // If the fundamental condition for the discount is not met with the current state,
  // no discount should be applied, regardless of any other logic.
  if (!conditionMet) {
    console.log(`[evaluateRule] Condition not met: ${valueToTest} is not between ${ruleConfig.conditionMin ?? 0} and ${ruleConfig.conditionMax ?? 'Infinity'}. No discount.`);
    return 0;
  }

  let discountAmount = 0;
  if (ruleConfig.type === 'fixed') {
    // If it's a one-time fixed discount, apply it once.
    if (ruleConfig.applyFixedOnce) {
      discountAmount = ruleConfig.value;
      console.log(`[evaluateRule] Fixed (One-Time) discount calculated: ${discountAmount}`);
    } else {
      // Otherwise, apply it per unit.
      discountAmount = ruleConfig.value * itemQuantity;
       console.log(`[evaluateRule] Fixed (Per-Unit) discount calculated: ${ruleConfig.value} * ${itemQuantity} = ${discountAmount}`);
    }
  } else { // percentage
    // Percentage is always calculated on the total value of the line
    discountAmount = lineTotalValue * (ruleConfig.value / 100);
    console.log(`[evaluateRule] Percentage discount calculated: ${lineTotalValue} * ${ruleConfig.value / 100} = ${discountAmount}`);
  }
  
  // Ensure discount is not more than the line's total value and not negative.
  const finalDiscount = Math.max(0, Math.min(discountAmount, lineTotalValue));
  console.log(`[evaluateRule] Final discount after validation: ${finalDiscount}`);
  return finalDiscount;
}

/**
 * Generate a unique rule ID for tracking one-time applications
 */
export function generateRuleId(
  prefix: string, 
  configId: string, 
  ruleType: string, 
  productId?: string,
  batchId?: string
): string {
  const parts = [prefix, configId, ruleType];
  if (productId) parts.push(productId);
  if (batchId) parts.push(batchId);
  return parts.join('-');
}

/**
 * Check if a rule should be treated as one-time based on its configuration
 */
export function isOneTimeRule(
  ruleConfig: SpecificDiscountRuleConfig | null,
  campaignIsOneTime: boolean = false
): boolean {
  if (!ruleConfig) return false;
  
  // Rule-level one-time setting takes precedence
  if (ruleConfig.applyFixedOnce !== undefined) {
    return ruleConfig.applyFixedOnce;
  }
  
  // Fall back to campaign-level setting
  return campaignIsOneTime;
}

/**
 * Validate rule configuration for common issues
 */
export function validateRuleConfig(ruleConfig: SpecificDiscountRuleConfig | null): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!ruleConfig) {
    return { isValid: false, errors: ['Rule configuration is null'] };
  }
  
  if (!ruleConfig.name || ruleConfig.name.trim() === '') {
    errors.push('Rule name is required');
  }
  
  if (ruleConfig.value < 0) {
    errors.push('Discount value cannot be negative');
  }
  
  if (ruleConfig.type === 'percentage' && ruleConfig.value > 100) {
    errors.push('Percentage discount cannot exceed 100%');
  }
  
  if (ruleConfig.conditionMin !== undefined && ruleConfig.conditionMin !== null && ruleConfig.conditionMin < 0) {
    errors.push('Minimum condition cannot be negative');
  }
  
  if (ruleConfig.conditionMax !== undefined && ruleConfig.conditionMax !== null && 
      ruleConfig.conditionMin !== undefined && ruleConfig.conditionMin !== null &&
      ruleConfig.conditionMax < ruleConfig.conditionMin) {
    errors.push('Maximum condition cannot be less than minimum condition');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate the effective discount rate for a line item
 */
export function calculateEffectiveDiscountRate(
  originalAmount: number,
  discountAmount: number
): number {
  if (originalAmount <= 0) return 0;
  return (discountAmount / originalAmount) * 100;
}

/**
 * Format discount amount for display
 */
export function formatDiscountAmount(amount: number, currency: string = 'LKR'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Format discount percentage for display
 */
export function formatDiscountPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}
