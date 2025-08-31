// src/discount-engine/index.ts
import { DiscountContext, LineItemData } from './core/context';
import { DiscountResult } from './core/result';
import { IDiscountRule } from './rules/interface';
import { ProductLevelRule } from './rules/product-level-rule';
import { DefaultItemRule } from './rules/default-item-rule';
import { BuyXGetYRule } from './rules/buy-x-get-y-rule';
import { CartTotalRule } from './rules/cart-total-rule';
import { BatchSpecificRule } from './rules/batch-specific-rule';
import { CustomItemDiscountRule } from './rules/custom-item-discount-rule';
import type { DiscountSet, Product } from '@/types';

export class DiscountEngine {
  private itemRules: IDiscountRule[] = [];
  private cartRules: IDiscountRule[] = [];
  private campaign: DiscountSet;
  private allProducts: Product[];

  constructor(campaign: DiscountSet, allProducts: Product[]) {
    this.campaign = campaign;
    this.allProducts = allProducts;
    this.buildRulesFromCampaign(campaign);
  }

  private buildRulesFromCampaign(campaign: DiscountSet): void {
    // Priority Order for Item-level rules
    this.itemRules.push(new CustomItemDiscountRule());
    if (campaign.batchConfigurations) {
      campaign.batchConfigurations.forEach((config) => {
        this.itemRules.push(new BatchSpecificRule(config));
      });
    }
    if (campaign.productConfigurations) {
      campaign.productConfigurations.forEach((config) => {
        this.itemRules.push(new ProductLevelRule(config));
      });
    }
    if (campaign.buyGetRulesJson) {
      campaign.buyGetRulesJson.forEach((ruleConfig) => {
        // Pass campaign name and all products to the rule
        this.itemRules.push(new BuyXGetYRule(ruleConfig, this.campaign.name, this.allProducts));
      });
    }
    this.itemRules.push(new DefaultItemRule(campaign));
    
    // Cart-level rules
    this.cartRules.push(new CartTotalRule(campaign));
  }

  public process(context: DiscountContext): DiscountResult {
    const result = new DiscountResult(context);
    const appliedRepeatableRuleIds = new Set<string>();

    // 1. Apply all item-level discounts first
    this.applyItemRules(context, result, appliedRepeatableRuleIds);

    // 2. Apply all cart-level discounts
    this.applyCartRules(context, result);

    result.finalize();
    return result;
  }

  private applyItemRules(context: DiscountContext, result: DiscountResult, appliedRepeatableRuleIds: Set<string>): void {
    const isOneTimeDealActive = this.campaign.isOneTimePerTransaction;

    // Iterate through each item in the cart
    for (const item of context.items) {
      // For each item, iterate through the prioritized list of rules
      for (const rule of this.itemRules) {
        const lineResult = result.getLineItem(item.lineId);
        
        // If a discount has already been applied by a higher-priority rule, skip to the next item
        if (lineResult && lineResult.totalDiscount > 0) {
          break; // Stop checking rules for this item
        }

        // --- One-Time Deal Logic ---
        const ruleId = rule.getId(item);
        const isRulePotentiallyRepeatable = rule.isPotentiallyRepeatable;
        const wasRuleAlreadyApplied = appliedRepeatableRuleIds.has(ruleId);

        if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleAlreadyApplied) {
          console.log(`[Engine] රීතිය මඟහැරියා ('${rule.constructor.name}' - ID: ${ruleId}). හේතුව: One-Time Deal ක්‍රියාත්මකයි, සහ මෙම නැවත යෙදිය හැකි රීතිය දැනටමත් යොදා ඇත.`);
          continue; // Skip this rule, check the next one
        }
        // --- End One-Time Deal Logic ---

        const discountsBefore = result.getAppliedRulesSummary().length;
        rule.apply(context, result);
        const wasRuleJustApplied = result.getAppliedRulesSummary().length > discountsBefore;

        // If a repeatable rule was just applied under a "One-Time Deal" campaign, mark it as used.
        if (isOneTimeDealActive && isRulePotentiallyRepeatable && wasRuleJustApplied) {
          console.log(`[Engine] One-Time Deal: නැවත යෙදිය හැකි රීතියක් (ID: ${ruleId}) දැන් යෙදුවා. එය 'යෙදූ' ලැයිස්තුවට ඇතුලත් කරනවා.`);
          appliedRepeatableRuleIds.add(ruleId);
        }
      }
    }
  }
  
  private applyCartRules(context: DiscountContext, result: DiscountResult): void {
      for (const rule of this.cartRules) {
          rule.apply(context, result);
      }
  }
}
