// src/discount-engine/rules/batch-specific-rule.ts
import { IDiscountRule } from './interface';
import { DiscountContext, LineItemData } from '../core/context';
import { DiscountResult } from '../core/result';
import { evaluateRule, generateRuleId, isOneTimeRule, validateRuleConfig } from '../utils/helpers';
import type { BatchDiscountConfiguration } from '@/types';

export class BatchSpecificRule implements IDiscountRule {
  private config: BatchDiscountConfiguration;
  
  // Required by interface
  readonly isPotentiallyRepeatable: boolean = true;

  constructor(config: BatchDiscountConfiguration) {
    this.config = config;
  }

  // Required by interface
  getId(item?: LineItemData): string {
    return `batch-${this.config.id}-${this.config.productBatchId}${item ? `-${item.lineId}` : ''}`;
  }

  apply(context: DiscountContext, result: DiscountResult): void {
    if (!this.config.isActiveForBatchInCampaign) {
      console.log(`Batch configuration ${this.config.id} is not active`);
      return;
    }

    // Find the line item that corresponds to this specific batch
    const targetLineItem = context.items.find(
      (item) => {
        const matches = item.batchId === this.config.productBatchId;
        console.log(`Checking item ${item.lineId}: batchId=${item.batchId}, target=${this.config.productBatchId}, matches=${matches}`);
        return matches;
      }
    );

    if (!targetLineItem) {
      console.log(`No line item found for batch ${this.config.productBatchId}`);
      console.log('Available items:', context.items.map(i => ({ lineId: i.lineId, batchId: i.batchId, productId: i.productId })));
      return;
    }
    
    console.log(`Found target line item for batch ${this.config.productBatchId}:`, targetLineItem);
    
    const lineResult = result.getLineItem(targetLineItem.lineId);
    if (!lineResult) {
      console.log(`No line result found for ${targetLineItem.lineId}`);
      return;
    }
    
    // Check if a higher-priority discount exists
    if (lineResult.totalDiscount > 0) {
      console.log(`Higher priority discount already applied to ${targetLineItem.lineId}, skipping batch rule`);
      return;
    }
    
    const lineTotal = targetLineItem.price * targetLineItem.quantity;
    console.log(`Processing batch rule for line ${targetLineItem.lineId}: price=${targetLineItem.price}, qty=${targetLineItem.quantity}, total=${lineTotal}`);
    
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
      if (!ruleEntry.config?.isEnabled) {
        console.log(`Rule ${ruleEntry.type} is not enabled`);
        continue;
      }

      console.log(`Evaluating rule ${ruleEntry.type}:`, ruleEntry.config);

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

      console.log(`Rule evaluation result for ${ruleEntry.type}: discount=${discountAmount}`);

      if (discountAmount > 0) {
        const ruleId = generateRuleId('batch', this.config.id, ruleEntry.type, targetLineItem.productId, targetLineItem.batchId);
        const isOneTime = isOneTimeRule(ruleEntry.config, this.config.discountSet?.isOneTimePerTransaction);

        console.log(`Applying batch discount: ruleId=${ruleId}, amount=${discountAmount}, isOneTime=${isOneTime}`);

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
      } else {
        console.log(`Rule ${ruleEntry.type} did not qualify for discount`);
      }
    }
  }
}