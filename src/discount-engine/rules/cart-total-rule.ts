// src/discount-engine/rules/cart-total-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet } from '@/types';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';

export class CartTotalRule implements IDiscountRule {
  private campaign: DiscountSet;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    const subtotalAfterItemDiscounts = result.lineItems.reduce(
        (sum, li) => sum + li.netPrice, 0
    );
    const totalQuantity = context.items.reduce((sum, item) => sum + item.quantity, 0);

    const rules = [
      { 
        config: this.campaign.globalCartPriceRuleJson, 
        valueToTest: subtotalAfterItemDiscounts, 
        type: 'campaign_global_cart_price' as const,
        description: 'Cart price threshold rule'
      },
      { 
        config: this.campaign.globalCartQuantityRuleJson, 
        valueToTest: totalQuantity, 
        type: 'campaign_global_cart_quantity' as const,
        description: 'Cart quantity threshold rule'
      },
    ];
    
    // Apply first valid cart rule only
    for (const rule of rules) {
      if (!rule.config?.isEnabled) continue;

      // Validate rule configuration
      const validation = validateRuleConfig(rule.config);
      if (!validation.isValid) {
        console.warn(`Invalid cart rule configuration for ${rule.type}:`, validation.errors);
        continue;
      }

      const discountAmount = evaluateRule(
        rule.config, 
        0, 
        0, 
        subtotalAfterItemDiscounts, 
        rule.valueToTest
      );
      
      if (discountAmount > 0) {
        const ruleId = generateRuleId('cart', this.campaign.id, rule.type);
        const isOneTime = isOneTimeRule(rule.config, this.campaign.isOneTimePerTransaction);

        result.addCartDiscount({
            ruleId,
            discountAmount,
            description: `${rule.description}: '${rule.config.name}' applied.`,
            isOneTime,
            appliedRuleInfo: {
                discountCampaignName: this.campaign.name,
                sourceRuleName: rule.config.name,
                totalCalculatedDiscount: discountAmount,
                ruleType: rule.type,
                appliedOnce: isOneTime
            }
        });
        
        // Stop after first successful cart rule application
        break;
      }
    }
  }
}