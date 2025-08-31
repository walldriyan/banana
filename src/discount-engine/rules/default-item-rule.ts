// src/discount-engine/rules/default-item-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet } from '@/types';
import { evaluateRule } from '../utils/helpers';

/**
 * Applies the campaign's default rules to items that have NO specific
 * product or batch configuration applied to them yet.
 */
export class DefaultItemRule implements IDiscountRule {
  private campaign: DiscountSet;
  public readonly isPotentiallyRepeatable = false;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  public getId(): string {
    return `default-item-rule-${this.campaign.id}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
      // The new engine logic ensures this rule is only checked if no other discount has been applied.
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult) {
        return;
      }

      const lineTotal = item.price * item.quantity;
      
      const rules = [
        { config: this.campaign.defaultLineItemValueRuleJson, valueToTest: lineTotal, type: 'campaign_default_line_item_value' as const },
        { config: this.campaign.defaultLineItemQuantityRuleJson, valueToTest: item.quantity, type: 'campaign_default_line_item_quantity' as const },
        { config: this.campaign.defaultSpecificQtyThresholdRuleJson, valueToTest: item.quantity, type: 'campaign_default_specific_qty_threshold' as const },
        { config: this.campaign.defaultSpecificUnitPriceThresholdRuleJson, valueToTest: item.price, type: 'campaign_default_specific_unit_price' as const },
      ];
      
      for (const rule of rules) {
          if (rule.config?.isEnabled) {
              const discountAmount = evaluateRule(rule.config, item.price, item.quantity, lineTotal, rule.valueToTest);
              if (discountAmount > 0) {
                  lineResult.addDiscount({
                      ruleId: `${this.getId()}-${rule.type}`,
                      discountAmount,
                      description: `Default campaign rule '${rule.config.name}' applied.`,
                      appliedRuleInfo: {
                          discountCampaignName: this.campaign.name,
                          sourceRuleName: rule.config.name,
                          totalCalculatedDiscount: discountAmount,
                          ruleType: rule.type,
                          productIdAffected: item.productId,
                          appliedOnce: !!rule.config.applyFixedOnce,
                          ruleId: this.getId()
                      }
                  });
                  // Stop checking other default rules for this item
                  return;
              }
          }
      }
    });
  }
}
