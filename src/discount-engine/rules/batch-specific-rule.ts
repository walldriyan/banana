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
      // console.log(`[BatchRule] Config ${this.config.id} is inactive.`);
      return;
    }

    // Find the line item that corresponds to this specific batch ID (which is the unique product ID now)
    const targetLineItem = context.items.find(
      (item) => item.id === this.config.productBatchId
    );

    if (!targetLineItem) {
      // This is expected if the cart doesn't contain this specific batch
      // console.log(`[BatchRule] No line item found for batch ${this.config.productBatchId}`);
      return;
    }
    
    console.log(`[BatchRule] Found target item ${targetLineItem.lineId} for batch ${this.config.productBatchId}`);
    
    const lineResult = result.getLineItem(targetLineItem.lineId);
    if (!lineResult) {
      console.error(`[BatchRule] CRITICAL: No line result found for ${targetLineItem.lineId}, though item exists.`);
      return;
    }
    
    // Check if a higher-priority discount (like a custom one) already exists
    if (lineResult.totalDiscount > 0) {
      console.log(`[BatchRule] Higher priority discount already applied to ${targetLineItem.lineId}, skipping batch rule.`);
      return;
    }
    
    const lineTotal = targetLineItem.price * targetLineItem.quantity;
    console.log(`[BatchRule] Processing for line ${targetLineItem.lineId}: price=${targetLineItem.price}, qty=${targetLineItem.quantity}, lineTotal=${lineTotal}`);
    
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
        // console.log(`[BatchRule] Rule type ${ruleEntry.type} is not enabled in config.`);
        continue;
      }

      // Validate rule configuration
      const validation = validateRuleConfig(ruleEntry.config);
      if (!validation.isValid) {
        console.warn(`[BatchRule] Invalid config for ${ruleEntry.type}:`, validation.errors);
        continue;
      }
      
      console.log(`[BatchRule] Evaluating rule '${ruleEntry.config.name}' (${ruleEntry.type})`);

      const discountAmount = evaluateRule(
          ruleEntry.config,
          targetLineItem.price,
          targetLineItem.quantity,
          lineTotal,
          ruleEntry.valueToTest
      );


      if (discountAmount > 0) {
        const ruleId = generateRuleId('batch', this.config.id, ruleEntry.type, targetLineItem.productId, targetLineItem.id);
        const isOneTime = isOneTimeRule(ruleEntry.config, this.config.discountSet?.isOneTimePerTransaction);

        console.log(`[BatchRule] SUCCESS: Applying batch discount: ruleId=${ruleId}, amount=${discountAmount}, isOneTime=${isOneTime}`);

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
                batchIdAffected: targetLineItem.id, // The unique product ID is the batch ID
                appliedOnce: isOneTime
            }
        });
        
        // Stop after first successful rule application for this batch item
        return; 
      } else {
        // console.log(`[BatchRule] Rule ${ruleEntry.type} did not qualify for discount.`);
      }
    }
  }
}
