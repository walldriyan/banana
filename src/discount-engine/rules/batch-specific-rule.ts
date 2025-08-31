// src/discount-engine/rules/batch-specific-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import { evaluateRule } from '../utils/helpers';
import type { BatchDiscountConfiguration } from '@/types';

export class BatchSpecificRule implements IDiscountRule {
  private config: BatchDiscountConfiguration;
  public readonly isPotentiallyRepeatable = false;

  constructor(config: BatchDiscountConfiguration) {
    this.config = config;
  }

  public getId(): string {
    return `batch-${this.config.id}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    if (!this.config.isActiveForBatchInCampaign) {
      return;
    }

    for (const item of context.items) {
      // Rule only applies to the specific batch ID
      if (item.batchId !== this.config.productBatchId) {
        continue;
      }

      // The new engine logic ensures we only process an item once.
      // No need to check for existing discounts here.
      const lineResult = result.getLineItem(item.lineId);
      if (!lineResult) continue;

      const lineTotal = item.price * item.quantity;
      const rulesToConsider = [
        { config: this.config.lineItemValueRuleJson, type: 'batch_config_line_item_value' as const },
        { config: this.config.lineItemQuantityRuleJson, type: 'batch_config_line_item_quantity' as const },
      ];
      
      for (const ruleEntry of rulesToConsider) {
        if(ruleEntry.config?.isEnabled) {
            const discountAmount = evaluateRule(
                ruleEntry.config,
                item.price,
                item.quantity,
                lineTotal
            );

            if (discountAmount > 0) {
                 lineResult.addDiscount({
                    ruleId: `${this.getId()}-${ruleEntry.type}`,
                    discountAmount,
                    description: `Batch-specific rule '${ruleEntry.config.name}' applied.`,
                    appliedRuleInfo: {
                        discountCampaignName: this.config.discountSet?.name || 'N/A',
                        sourceRuleName: ruleEntry.config.name,
                        totalCalculatedDiscount: discountAmount,
                        ruleType: ruleEntry.type,
                        productIdAffected: item.productId,
                        appliedOnce: !!ruleEntry.config.applyFixedOnce,
                        ruleId: this.getId()
                    }
                });
                // Since a batch rule was found and applied, stop checking other batch rules for this item
                return; 
            }
        }
      }
    }
  }
}
