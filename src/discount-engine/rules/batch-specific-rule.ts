// src/discount-engine/rules/batch-specific-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext } from '../core/context';
import { DiscountResult } from '../core/result';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';
import type { BatchDiscountConfiguration } from '@/types';

export class BatchSpecificRule implements IDiscountRule {
  private config: BatchDiscountConfiguration;

  constructor(config: BatchDiscountConfiguration) {
    this.config = config;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    if (!this.config.isActiveForBatchInCampaign) {
      return;
    }

    // Find the line item that corresponds to this specific batch
    const targetLineItem = context.items.find(
      (item) => item.batchId === this.config.productBatchId
    );

    if (!targetLineItem) {
      return;
    }
    
    const lineResult = result.getLineItem(targetLineItem.lineId);
    if (!lineResult || lineResult.totalDiscount > 0) return; // Skip if a higher-priority discount exists
    
    const lineTotal = targetLineItem.price * targetLineItem.quantity;
    
    // Define rules in priority order
    const rulesToConsider = [
      { 
        config: this.config.lineItemValueRuleJson, 
        type: 'batch_config_line_item_value' as const, 
        valueToTest: lineTotal,
        description: 'Batch line value rule'
      },
      { 
        config: this.config.lineItemQuantityRuleJson, 
        type: 'batch_config_line_item_quantity' as const, 
        valueToTest: targetLineItem.quantity,
        description: 'Batch quantity rule'
      },
    ];
    
    // Apply first valid rule only
    for (const ruleEntry of rulesToConsider) {
      if (!ruleEntry.config?.isEnabled) continue;

      // Validate rule configuration
      const validation = validateRuleConfig(ruleEntry.config);
      if (!validation.isValid) {
        console.warn(`Invalid batch rule configuration for ${ruleEntry.type}:`, validation.errors);
        continue;
      }

      const discountAmount = evaluateRule(
          ruleEntry.config,
          targetLineItem.price,
          targetLineItem.quantity,
          lineTotal,
          ruleEntry.valueToTest
      );

      if (discountAmount > 0) {
        const ruleId = generateRuleId('batch', this.config.id, ruleEntry.type, targetLineItem.productId, targetLineItem.batchId);
        const isOneTime = isOneTimeRule(ruleEntry.config, this.config.discountSet?.isOneTimePerTransaction);

        lineResult.addDiscount({
            ruleId,
            discountAmount,
            description: `${ruleEntry.description}: '${ruleEntry.config.name}' applied.`,
            isOneTime,
            appliedRuleInfo: {
                discountCampaignName: this.config.discountSet?.name || 'N/A',
                sourceRuleName: ruleEntry.config.name,
                totalCalculatedDiscount: discountAmount,
                ruleType: ruleEntry.type,
                productIdAffected: targetLineItem.productId,
                appliedOnce: isOneTime
            }
        });
        
        // Stop after first successful rule application
        break;
      }
    }
  }
}