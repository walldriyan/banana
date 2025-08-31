
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
    this.campaign = campaign;
    this.buildRulesFromCampaign(campaign);
  }

  private buildRulesFromCampaign(campaign: DiscountSet): void {
    this.rules.push(new CustomItemDiscountRule());
    if (campaign.batchConfigurations) {
      campaign.batchConfigurations.forEach((config) => {
        this.rules.push(new BatchSpecificRule(config));
      });
    }
    if (campaign.productConfigurations) {
      campaign.productConfigurations.forEach((config) => {
        this.rules.push(new ProductLevelRule(config));
      });
    }
    if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson.forEach((ruleConfig) => {
        this.rules.push(new BuyXGetYRule(ruleConfig));
      });
    }
    this.rules.push(new DefaultItemRule(campaign));
    this.rules.push(new CartTotalRule(campaign));
  }

  public process(context: DiscountContext): DiscountResult {
    const result = new DiscountResult(context);
    // This Set will track the IDs of repeatable rules that have already been applied once.
    const appliedRepeatableRuleIds = new Set<string>();

    const isOneTimeDealActive = this.campaign.isOneTimePerTransaction;

    for (const rule of this.rules) {
      const ruleId = rule.getId();
      const isRulePotentiallyRepeatable = rule.isPotentiallyRepeatable;
      const wasRuleAlreadyApplied = appliedRepeatableRuleIds.has(ruleId);

      // --- තීරණය ගන්නා ස්ථානය (Decision Point) ---
      console.log(`[Engine] රීතිය පරීක්ෂා කිරීම: '${rule.constructor.name}' (ID: ${ruleId})`);
      console.log(`[Engine] Params: { isOneTimeDealActive: ${isOneTimeDealActive}, isRulePotentiallyRepeatable: ${isRulePotentiallyRepeatable}, wasRuleAlreadyApplied: ${wasRuleAlreadyApplied} }`);
      
      if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleAlreadyApplied) {
        console.log(`[Engine] රීතිය මඟහැරියා (ID: ${ruleId}). හේතුව: One-Time Deal ක්‍රියාත්මකයි, සහ මෙම repeatable රීතිය දැනටමත් යොදා ඇත.`);
        continue;
      }
      
      const discountsBefore = result.getAppliedRulesSummary().length;
      
      rule.apply(context, result);
      
      const discountsAfter = result.getAppliedRulesSummary().length;
      const wasRuleJustApplied = discountsAfter > discountsBefore;

      // --- THE BUG FIX IS HERE ---
      // "One-Time Deal" ක්‍රියාත්මක නම්, සහ නැවත යෙදිය හැකි රීතියක් දැන් යෙදුවා නම්, එය 'යෙදූ' ලැයිස්තුවට ඇතුලත් කිරීම.
      // If a one-time deal is active, the rule is repeatable, and it was just applied, we add its ID to our tracker.
      if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleJustApplied) {
        console.log(`[Engine] One-Time Deal: නැවත යෙදිය හැකි රීතියක් (ID: ${ruleId}) දැන් යෙදුවා. එය 'යෙදූ' ලැයිස්තුවට ඇතුලත් කරනවා.`);
        appliedRepeatableRuleIds.add(ruleId);
      }
    }
    
    result.finalize();
    return result;
  }
}
