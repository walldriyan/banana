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
    const appliedRepeatableRuleIds = new Set<string>();
    const isOneTimeDealActive = this.campaign.isOneTimePerTransaction;

    for (const rule of this.rules) {
      const ruleId = rule.getId();
      const isRulePotentiallyRepeatable = rule.isPotentiallyRepeatable;
      const wasRuleAlreadyApplied = appliedRepeatableRuleIds.has(ruleId);
      
      const shouldSkipRule = isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleAlreadyApplied;
      
      const ruleClassName = (rule as any).constructor.name;
      console.log(`[Engine] > රීතිය පරීක්ෂා කිරීම: '${ruleClassName}' (ID: ${ruleId})`);

      if (shouldSkipRule) {
        console.log(`[Engine] ---> ✋ රීතිය මඟහැරියා. හේතුව: "One-Time Deal" ක්‍රියාත්මකයි, සහ මෙම නැවත යෙදිය හැකි රීතිය දැනටමත් යොදා ඇත.`);
        continue;
      }
      
      const discountsBefore = result.getAppliedRulesSummary().length;
      
      rule.apply(context, result);
      
      const wasRuleJustApplied = result.getAppliedRulesSummary().length > discountsBefore;

      if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleJustApplied) {
        console.log(`[Engine] ---> ✅ One-Time Deal: නැවත යෙදිය හැකි රීතියක් (ID: ${ruleId}) දැන් යෙදුවා. එය 'යෙදූ' ලැයිස්තුවට ඇතුලත් කරනවා.`);
        appliedRepeatableRuleIds.add(ruleId);
      }
    }
    
    result.finalize();
    return result;
  }
}
