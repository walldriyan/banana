
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
    const isOneTimeDealActive = this.campaign.isOneTimePerTransaction;

    console.log(`[Engine] Processing campaign: "${this.campaign.name}". One-Time Deal is ${isOneTimeDealActive ? 'ACTIVE' : 'INACTIVE'}.`);

    for (const rule of this.rules) {
      const ruleId = rule.getId();
      const isRulePotentiallyRepeatable = rule.isPotentiallyRepeatable;
      const wasRuleAlreadyApplied = appliedRepeatableRuleIds.has(ruleId);
      
      console.log(`[Engine] CHECKING Rule: '${rule.constructor.name}' (ID: ${ruleId})`);
      console.log(`[Engine] Params: { isOneTimeDealActive: ${isOneTimeDealActive}, isRulePotentiallyRepeatable: ${isRulePotentiallyRepeatable}, wasRuleAlreadyApplied: ${wasRuleAlreadyApplied} }`);

      // This is the main global control point.
      if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleAlreadyApplied) {
        console.log(`[Engine] SKIPPING Rule (ID: ${ruleId}). Reason: One-Time Deal is active and this repeatable rule has already been applied.`);
        continue; // Skip this rule for the rest of the transaction.
      }
      
      const discountsBefore = result.getAppliedRulesSummary().length;
      
      rule.apply(context, result);
      
      const discountsAfter = result.getAppliedRulesSummary().length;
      const wasRuleJustApplied = discountsAfter > discountsBefore;

      // If 'One-Time Deal' is active, we check if a repeatable rule was *just* applied.
      if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleJustApplied) {
        console.log(`[Engine] One-Time Deal: Repeatable rule (ID: ${ruleId}) was just applied. Adding to the 'applied' list for this transaction.`);
        appliedRepeatableRuleIds.add(ruleId);
      }
    }
    
    result.finalize();
    return result;
  }
}
