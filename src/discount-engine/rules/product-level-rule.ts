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
      
      const lineResult = result.getLineItem(item.lineId);
      // If a higher-priority discount (e.g., custom, batch) is already applied, skip.
      // A product-level rule does not override a batch-level one.
      if (!lineResult || lineResult.totalDiscount > 0) {
        return;
      }

      const lineTotal = item.price * item.quantity;
      const rulesToConsider = [
          { config: this.config.lineItemValueRuleJson, type: 'product_config_line_item_value' as const, context: 'item_value' as const },
          { config: this.config.lineItemQuantityRuleJson, type: 'product_config_line_item_quantity' as const, context: 'item_quantity' as const },
          { config: this.config.specificQtyThresholdRuleJson, type: 'product_config_specific_qty_threshold' as const, context: 'specific_qty' as const },
          { config: this.config.specificUnitPriceThresholdRuleJson, type: 'product_config_specific_unit_price' as const, context: 'specific_unit_price' as const }
      ];

      for (const ruleEntry of rulesToConsider) {
        // If a discount has already been applied to this line item in a previous iteration of this loop, stop.
        if (lineResult.totalDiscount > 0) {
          break; 
        }

        if(ruleEntry.config?.isEnabled) {
            const discountAmount = evaluateRule(
                ruleEntry.config,
                item.price,
                item.quantity,
                lineTotal
            );

            if (discountAmount > 0) {
                 lineResult.addDiscount({
                    ruleId: `${this.getId()}-${ruleEntry.type}`, // More specific ID
                    discountAmount,
                    description: `Product-specific rule '${ruleEntry.config.name}' applied.`,
                    appliedRuleInfo: {
                        discountCampaignName: this.config.discountSet?.name || 'N/A',
                        sourceRuleName: ruleEntry.config.name,
                        totalCalculatedDiscount: discountAmount,
                        ruleType: ruleEntry.type,
                        ruleId: `${this.getId()}-${ruleEntry.type}`,
                        productIdAffected: item.productId,
                        appliedOnce: !!ruleEntry.config.applyFixedOnce,
                        isRepeatable: false // Product rules are generally not repeatable in a BOGO sense
                    }
                });
            }
        }
      }
    });
  }
}
