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

// Cache for compiled rule sets
const engineCache = new Map<string, { rules: IDiscountRule[], timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

export class DiscountEngine {
  private rules: IDiscountRule[] = [];
  private appliedOneTimeRules: Set<string> = new Set();
  private campaignId: string;

  constructor(campaign: DiscountSet) {
    this.campaignId = campaign.id;
    
    // Check cache first
    const cached = this.getCachedRules(campaign.id);
    if (cached) {
      this.rules = cached;
    } else {
      this.buildRulesFromCampaign(campaign);
      this.cacheRules(campaign.id, this.rules);
    }
  }

  private getCachedRules(campaignId: string): IDiscountRule[] | null {
    const cached = engineCache.get(campaignId);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      engineCache.delete(campaignId);
      return null;
    }
    
    return cached.rules;
  }

  private cacheRules(campaignId: string, rules: IDiscountRule[]): void {
    engineCache.set(campaignId, {
      rules,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries
    if (engineCache.size > 50) {
      const now = Date.now();
      for (const [key, value] of engineCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          engineCache.delete(key);
        }
      }
    }
  }


  /**
   * Dynamically builds the list of rule processors based on a campaign configuration.
   * The order of rule addition is critical for precedence.
   */
  private buildRulesFromCampaign(campaign: DiscountSet): void {
    // Priority 1: Custom discounts applied directly to sale items
    this.rules.push(new CustomItemDiscountRule());

    // Priority 2: Batch-specific rules (highest priority for products with batches)
    const batchIds = new Set<string>();
    if (campaign.batchConfigurations) {
        for (const config of campaign.batchConfigurations) {
            if (!batchIds.has(config.productBatchId)) {
                this.rules.push(new BatchSpecificRule(config));
                batchIds.add(config.productBatchId);
            }
        }
    }

    // Priority 3: Product-specific rules
    const productIds = new Set<string>();
    if (campaign.productConfigurations) {
      // Sort by priority or order if needed
        const sortedConfigs = [...campaign.productConfigurations]
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        for (const config of sortedConfigs) {
            if (!productIds.has(config.productId)) {
                this.rules.push(new ProductLevelRule(config));
                productIds.add(config.productId);
            }
        }
    }

    // Priority 4: "Buy X, Get Y" rules
    if (campaign.buyGetRulesJson?.length) {
        for (const ruleConfig of campaign.buyGetRulesJson) {
            this.rules.push(new BuyXGetYRule(ruleConfig, campaign.name));
        }
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

    // Static method to clear all cached engines (call on campaign updates)
  public static clearCache(): void {
    engineCache.clear();
  }
}
