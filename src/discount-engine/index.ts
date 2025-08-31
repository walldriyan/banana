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
        this.rules.push(new BuyXGetYRule(ruleConfig, campaign));
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
    const appliedRuleIdsForOneTimeDeal = new Set<string>();

    for (const rule of this.rules) {
      // Create a snapshot of the total discount before applying the current rule
      const totalDiscountBefore = result.totalItemDiscount + result.totalCartDiscount;

      rule.apply(context, result);

      const totalDiscountAfter = result.totalItemDiscount + result.totalCartDiscount;
      
      // Check if the current rule applied any discount
      if (totalDiscountAfter > totalDiscountBefore) {
        if (this.campaign.isOneTimePerTransaction) {
            // A discount was applied by this rule. If it's a one-time deal, we might need to prevent it from running again.
            // This is particularly relevant for rules like BuyXGetY that can be repeatable.
            // We'll add a generic way to handle this.
            
            // For now, the most direct impact is on BuyXGetYRule, let's refine that logic.
            // The logic inside the BuyXGetYRule is now the primary controller for this.
        }
      }
    }
    
    result.finalize();
    return result;
  }
}
