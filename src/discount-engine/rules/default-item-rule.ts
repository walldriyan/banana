// src/discount-engine/rules/default-item-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet } from '@/types';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';

/**
 * Applies the campaign's default rules to items that have NO specific
 * product or batch configuration applied to them yet.
 */
export class DefaultItemRule implements IDiscountRule {
  private campaign: DiscountSet;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
      const lineResult = result.getLineItem(item.lineId);
      // If a discount (e.g., custom, batch, product-specific) has already been applied, skip default rules for this item.
      if (!lineResult || lineResult.totalDiscount > 0) {
        return;
      }

      const lineTotal = item.price * item.quantity;
      
      // Define default rules in priority order
      const rules = [
        { 
          config: this.campaign.defaultLineItemValueRuleJson, 
          valueToTest: lineTotal, 
          type: 'campaign_default_line_item_value' as const,
          description: 'Default line value rule'
        },
        { 
          config: this.campaign.defaultLineItemQuantityRuleJson, 
          valueToTest: item.quantity, 
          type: 'campaign_default_line_item_quantity' as const,
          description: 'Default quantity rule'
        },
        { 
          config: this.campaign.defaultSpecificQtyThresholdRuleJson, 
          valueToTest: item.quantity, 
          type: 'campaign_default_specific_qty_threshold' as const,
          description: 'Default quantity threshold rule'
        },
        { 
          config: this.campaign.defaultSpecificUnitPriceThresholdRuleJson, 
          valueToTest: item.price, 
          type: 'campaign_default_specific_unit_price' as const,
          description: 'Default unit price threshold rule'
        },
      ];
      
      // Apply first valid default rule only
      for (const rule of rules) {
        if (!rule.config?.isEnabled) continue;

        // Validate rule configuration
        const validation = validateRuleConfig(rule.config);
        if (!validation.isValid) {
          console.warn(`Invalid default rule configuration for ${rule.type}:`, validation.errors);
          continue;
        }

        const discountAmount = evaluateRule(
          rule.config, 
          item.price, 
          item.quantity, 
          lineTotal, 
          rule.valueToTest
        );
        
        if (discountAmount > 0) {
          const ruleId = generateRuleId('default', this.campaign.id, rule.type, item.productId);
          const isOneTime = isOneTimeRule(rule.config, this.campaign.isOneTimePerTransaction);

          lineResult.addDiscount({
              ruleId,
              discountAmount,
              description: `${rule.description}: '${rule.config.name}' applied.`,
              isOneTime,
              appliedRuleInfo: {
                  discountCampaignName: this.campaign.name,
                  sourceRuleName: rule.config.name,
                  totalCalculatedDiscount: discountAmount,
                  ruleType: rule.type,
                  productIdAffected: item.productId,
                  appliedOnce: isOneTime
              }
          });
          
          // Stop after first successful default rule application
          break;
        }
      }
    });
  }
}