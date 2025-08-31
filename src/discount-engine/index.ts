// src/discount-engine/index.ts

import { DiscountContext } from './core/context';
import { DiscountResult } from './core/result';
import { IDiscountRule } from './rules/interface';

import { ProductLevelRule } from './rules/product-level-rule';
import { DefaultItemRule } from './rules/default-item-rule';
import { BuyXGetYRule } from './rules/buy-x-get-y-rule';
import { CartTotalRule } from './rules/cart-total-rule';
import { BatchSpecificRule } from './rules/batch-specific-rule';
import { CustomItemDiscountRule } from './rules/custom-item-discount-rule';
import type { DiscountSet, AppliedRuleInfo } from '@/types';

export class DiscountEngine {
  private rules: IDiscountRule[] = [];
  private campaign: DiscountSet;

  constructor(campaign: DiscountSet) {
    // The entire campaign object, including the isOneTimePerTransaction flag, is stored.
    this.campaign = campaign; 
    this.buildRulesFromCampaign(campaign);
  }

  /**
   * Dynamically builds the list of rule processors based on a campaign configuration.
   * The order of rule addition is critical for precedence.
   */
  private buildRulesFromCampaign(campaign: DiscountSet): void {
    // Priority 1: Custom discounts applied directly to sale items
    this.rules.push(new CustomItemDiscountRule());

    // Priority 2: Batch-specific rules
    if (campaign.batchConfigurations) {
      campaign.batchConfigurations.forEach((config) => {
        this.rules.push(new BatchSpecificRule(config));
      });
    }

    // Priority 3: Product-specific rules
    if (campaign.productConfigurations) {
      campaign.productConfigurations.forEach((config) => {
        this.rules.push(new ProductLevelRule(config));
      });
    }

    // Priority 4: "Buy X, Get Y" rules
    if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson.forEach((ruleConfig) => {
        // Pass the entire campaign object to the rule constructor
        this.rules.push(new BuyXGetYRule(ruleConfig));
      });
    }

    // Priority 5: Campaign's default item-level rules
    this.rules.push(new DefaultItemRule(campaign));

    // Priority 6: Global cart total rules (applied last)
    this.rules.push(new CartTotalRule(campaign));
  }

  /**
   * Processes a sale context, applying all configured discount rules in order.
   * @param context The sale context containing all items.
   * @returns A DiscountResult object with detailed discount information.
   */
  public process(context: DiscountContext): DiscountResult {
    const result = new DiscountResult(context);
    
    // This is the global tracker for repeatable rules when 'One-Time Deal' is active.
    const appliedRepeatableRuleIds = new Set<string>();

    console.log(`[Engine] Processing campaign: "${this.campaign.name}". One-Time Deal is ${this.campaign.isOneTimePerTransaction ? 'ACTIVE' : 'INACTIVE'}.`);

    for (const rule of this.rules) {
      // Check if this rule is repeatable and if it has already been applied in one-time mode.
      // We check this *before* applying the rule.
      if (this.campaign.isOneTimePerTransaction && rule.isPotentiallyRepeatable) {
        // This is a simplified check. A robust implementation would need rule to expose a unique ID.
        // For now, we assume rule's constructor name or a unique property can identify it.
        // Let's refine the rule interface to add a unique ID.
        const ruleId = rule.getId(); // Assuming rules have a getId() method.
         if (appliedRepeatableRuleIds.has(ruleId)) {
           console.log(`[Engine] Skipping repeatable rule (ID: ${ruleId}) because One-Time Deal is active and it has already been applied.`);
           continue; // Skip this rule for the rest of the transaction.
         }
      }

      const discountsBefore = result.getAppliedRulesSummary();
      
      rule.apply(context, result);
      
      const discountsAfter = result.getAppliedRulesSummary();

      // If 'One-Time Deal' is active, we check if a repeatable rule was *just* applied.
      if (this.campaign.isOneTimePerTransaction && discountsAfter.length > discountsBefore.length) {
        const newDiscounts = this.findNewDiscounts(discountsBefore, discountsAfter);
        
        for (const newDiscount of newDiscounts) {
          // If the rule that was just applied is repeatable, we add its ID to our tracker
          // so it won't be applied again in this transaction.
          if(newDiscount.isRepeatable) {
            console.log(`[Engine] One-Time Deal: Rule "${newDiscount.sourceRuleName}" (ID: ${newDiscount.ruleId}) was just applied. It will not be applied again.`);
            appliedRepeatableRuleIds.add(newDiscount.ruleId);
          }
        }
      }
    }
    
    result.finalize();
    return result;
  }

  /**
   * Helper to find which discounts are new between two states.
   */
  private findNewDiscounts(before: AppliedRuleInfo[], after: AppliedRuleInfo[]): AppliedRuleInfo[] {
    const beforeIds = new Set(before.map(d => JSON.stringify(d))); // Inefficient but works for object comparison
    return after.filter(d => !beforeIds.has(JSON.stringify(d)));
  }
}
