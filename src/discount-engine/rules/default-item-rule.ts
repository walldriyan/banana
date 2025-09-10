// ===== FILE 2: src/discount-engine/rules/default-item-rule.ts =====
import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet } from '@/types';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';

export class DefaultItemRule implements IDiscountRule {
  private campaign: DiscountSet;
  
  readonly isPotentiallyRepeatable: boolean = true;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  getId(item?: LineItemData): string {
    return `default-${this.campaign.id}${item ? `-${item.lineId}` : ''}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    context.items.forEach((item) => {
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult) {
        console.log(`No line result found for ${item.lineId}`);
        return;
      }
      
      // *** THE FIX ***
      // If a custom discount has been MANUALLY SET (even to 0), 
      // we should NOT apply any default discounts.
      // A custom value being present signifies user intent to override all campaign rules.
      if (item.customDiscountValue !== undefined) {
        console.log(`Custom discount value is set for ${item.lineId}, skipping default rule.`);
        return;
      }
      
      // If a higher-priority discount (e.g., batch, product-specific) has already been applied, skip default rules for this item.
      if (lineResult.totalDiscount > 0) {
        console.log(`Higher priority discount already applied to ${item.lineId}, skipping default rule`);
        return;
      }

      console.log(`Processing default rule for item ${item.lineId}, product ${item.productId}`);

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
        if (!rule.config?.isEnabled) {
          // console.log(`Default rule ${rule.type} is not enabled`);
          continue;
        }

        console.log(`Evaluating default rule ${rule.type}:`, rule.config);

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
        
        console.log(`Default rule evaluation result for ${rule.type}: discount=${discountAmount}`);
        
        if (discountAmount > 0) {
          const ruleId = generateRuleId('default', this.campaign.id, rule.type, item.productId);
          const isOneTime = isOneTimeRule(rule.config, this.campaign.isOneTimePerTransaction);

          console.log(`Applying default discount: ruleId=${ruleId}, amount=${discountAmount}, isOneTime=${isOneTime}`);

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
        } else {
          // console.log(`Default rule ${rule.type} did not qualify for discount`);
        }
      }
    });
  }
}
