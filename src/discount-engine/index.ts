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
import type { DiscountSet } from '@/types';

export class DiscountEngine {
  private rules: IDiscountRule[] = [];
  private campaign: DiscountSet;

  constructor(campaign: DiscountSet) {
    this.campaign = campaign; // Store the whole campaign
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
    const appliedRepeatableRules = new Set<string>();

    for (const rule of this.rules) {
      // Create a snapshot of the result object before applying the rule
      // We'll use this to see what the rule did.
      const discountsBefore = result.getAppliedRulesSummary();
      
      rule.apply(context, result);
      
      // Now, see what new discounts were added by this rule
      const discountsAfter = result.getAppliedRulesSummary();

      // If 'One-Time Deal' is active, we need to check if a repeatable rule was just applied.
      if (this.campaign.isOneTimePerTransaction && discountsAfter.length > discountsBefore.length) {
        const newDiscounts = discountsAfter.slice(discountsBefore.length);
        
        for (const newDiscount of newDiscounts) {
          // The rule that applied this discount is considered "used up" for this transaction.
          // Note: This logic assumes a rule instance maps to a single configurable discount.
          // For BuyXGetY, the ruleId is `bogo-${buyProductId}-${getProductId}`, which is unique per BOGO config.
          if(newDiscount.isRepeatable) {
            appliedRepeatableRules.add(newDiscount.ruleId);
          }
        }
      }
    }
    
    result.finalize();
    return result;
  }
}
