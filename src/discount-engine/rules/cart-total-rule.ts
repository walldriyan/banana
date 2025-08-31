// src/discount-engine/rules/cart-total-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { DiscountSet } from '@/types';
import { evaluateRule } from '../utils/helpers';

export class CartTotalRule implements IDiscountRule {
  private campaign: DiscountSet;
  public readonly isPotentiallyRepeatable = false;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign;
  }

  public getId(): string {
    return `cart-total-${this.campaign.id}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    const subtotalAfterItemDiscounts = result.lineItems.reduce(
        (sum, li) => sum + li.netPrice, 0
    );
    const totalQuantity = context.items.reduce((sum, item) => sum + item.quantity, 0);

    const rules = [
      { config: this.campaign.globalCartPriceRuleJson, valueToTest: subtotalAfterItemDiscounts, type: 'campaign_global_cart_price' as const },
      { config: this.campaign.globalCartQuantityRuleJson, valueToTest: totalQuantity, type: 'campaign_global_cart_quantity' as const },
    ];
    
    for (const rule of rules) {
        if (rule.config?.isEnabled) {
            const discountAmount = evaluateRule(rule.config, 0, 0, subtotalAfterItemDiscounts, rule.valueToTest);
            if (discountAmount > 0) {
                result.addCartDiscount({
                    ruleId: `${this.getId()}-${rule.type}`,
                    discountAmount,
                    description: `Cart rule '${rule.config.name}' applied.`,
                    appliedRuleInfo: {
                        discountCampaignName: this.campaign.name,
                        sourceRuleName: rule.config.name,
                        totalCalculatedDiscount: discountAmount,
                        ruleType: rule.type,
                        appliedOnce: true,
                        ruleId: this.getId()
                    }
                });
                // Stop after applying the first valid cart rule
                return;
            }
        }
    }
  }
}
