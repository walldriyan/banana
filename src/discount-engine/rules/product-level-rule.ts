// src/discount-engine/rules/product-level-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import type { ProductDiscountConfiguration } from '@/types';
import { evaluateRule } from '../utils/helpers';

export class ProductLevelRule implements IDiscountRule {
  private config: ProductDiscountConfiguration;
  public readonly isPotentiallyRepeatable = false;

  constructor(config: ProductDiscountConfiguration) {
    this.config = config;
  }

  public getId(): string {
    return `product-${this.config.id}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    if (!this.config.isActiveForProductInCampaign) {
      return;
    }

    context.items.forEach((item) => {
      // Rule only applies to matching product ID
      if (item.productId !== this.config.productId) {
        return;
      }
      
      // The new engine logic ensures this rule is only checked if no other discount has been applied.
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult) {
        return;
      }

      const lineTotal = item.price * item.quantity;
      
      const rulesToConsider = [
          { config: this.config.lineItemValueRuleJson, type: 'product_config_line_item_value' as const, contextValue: lineTotal },
          { config: this.config.lineItemQuantityRuleJson, type: 'product_config_line_item_quantity' as const, contextValue: item.quantity },
          { config: this.config.specificQtyThresholdRuleJson, type: 'product_config_specific_qty_threshold' as const, contextValue: item.quantity },
          { config: this.config.specificUnitPriceThresholdRuleJson, type: 'product_config_specific_unit_price' as const, contextValue: item.price }
      ];

      for (const ruleEntry of rulesToConsider) {
        if(ruleEntry.config?.isEnabled) {
            const discountAmount = evaluateRule(
                ruleEntry.config,
                item.price,
                item.quantity,
                lineTotal,
                ruleEntry.contextValue // Pass the correct value to test against conditions
            );

            if (discountAmount > 0) {
                 lineResult.addDiscount({
                    ruleId: `${this.getId()}-${ruleEntry.type}`,
                    discountAmount,
                    description: `Product-specific rule '${ruleEntry.config.name}' applied.`,
                    appliedRuleInfo: {
                        discountCampaignName: this.config.discountSet?.name || 'N/A',
                        sourceRuleName: ruleEntry.config.name,
                        totalCalculatedDiscount: discountAmount,
                        ruleType: ruleEntry.type,
                        ruleId: this.getId(),
                        productIdAffected: item.productId,
                        appliedOnce: !!ruleEntry.config.applyFixedOnce,
                        isRepeatable: false
                    }
                });
                // Since a product rule was found and applied, stop checking other product rules for this item
                return;
            }
        }
      }
    });
  }
}
