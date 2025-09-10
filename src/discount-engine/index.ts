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
  private appliedOneTimeRules: Set<string> = new Set(); // Track applied one-time rules

  constructor(campaign: DiscountSet) {
    this.buildRulesFromCampaign(campaign);
  }

  /**
   * Dynamically builds the list of rule processors based on a campaign configuration.
   * The order of rule addition is critical for precedence.
   */
  private buildRulesFromCampaign(campaign: DiscountSet): void {
    // Priority 1: Custom discounts applied directly to sale items
    this.rules.push(new CustomItemDiscountRule());

    // Priority 2: Batch-specific rules (highest priority for products with batches)
    if (campaign.batchConfigurations) {
      campaign.batchConfigurations.forEach((config) => {
        this.rules.push(new BatchSpecificRule(config));
      });
    }

    // Priority 3: Product-specific rules
    if (campaign.productConfigurations) {
      // Sort by priority or order if needed
      campaign.productConfigurations.forEach((config) => {
        this.rules.push(new ProductLevelRule(config));
      });
    }

    // Priority 4: "Buy X, Get Y" rules
    if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson.forEach((ruleConfig) => {
        this.rules.push(new BuyXGetYRule(ruleConfig, campaign.name));
      });
    }

    // Priority 5: Campaign's default item-level rules
    this.rules.push(new DefaultItemRule(campaign));

    // Priority 6: Global cart total rules (applied last)
    this.rules.push(new CartTotalRule(campaign));
  }

  /**
   * Checks if a one-time rule has already been applied
   */
  private hasOneTimeRuleBeenApplied(ruleId: string): boolean {
    return this.appliedOneTimeRules.has(ruleId);
  }

  /**
   * Marks a one-time rule as applied
   */
  private markOneTimeRuleAsApplied(ruleId: string): void {
    this.appliedOneTimeRules.add(ruleId);
  }

  /**
   * Processes a sale context, applying all configured discount rules in order.
   * @param context The sale context containing all items.
   * @param transactionId Optional transaction ID for one-time rule tracking
   * @returns A DiscountResult object with detailed discount information.
   */
  public process(context: DiscountContext, transactionId?: string): DiscountResult {
    const result = new DiscountResult(context);

    // Apply rules sequentially. The order matters for precedence.
    for (const rule of this.rules) {
      // Enhanced rule application with one-time tracking
      rule.apply(context, result);
    }

    // Finalize calculations after all rules have been applied.
    result.finalize();

    return result;
  }

  /**
   * Reset one-time rule tracking (call this when starting a new transaction)
   */
  public resetOneTimeRules(): void {
    this.appliedOneTimeRules.clear();
  }

  /**
   * Get applied one-time rules for debugging
   */
  public getAppliedOneTimeRules(): string[] {
    return Array.from(this.appliedOneTimeRules);
  }
}