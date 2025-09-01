// src/lib/discountUtils.ts
import { DiscountEngine } from '@/discount-engine';
import { DiscountResult } from '@/discount-engine/core/result';
import {
  type Product,
  type SaleItem,
  type DiscountSet,
  type DiscountEngineConfig
} from '@/types';

interface CalculateDiscountsInput {
  saleItems: SaleItem[];
  activeCampaign: DiscountSet | null;
  allProducts: Product[];
  transactionId?: string;
  config?: DiscountEngineConfig;
}

export function calculateDiscountsForItems(input: CalculateDiscountsInput): DiscountResult {
  const { saleItems, activeCampaign, transactionId, config } = input;

  if (!activeCampaign || saleItems.length === 0) {
    return new DiscountResult({ items: [] });
  }

  const engine = new DiscountEngine(activeCampaign);

  const context = {
    items: saleItems.map((item) => ({
      ...item,
      lineId: item.saleItemId,
      productId: item.id,
      batchId: item.selectedBatchId,
    })),
  };

  const result = engine.process(context, transactionId);

  if (config?.maxDiscountPercentage) {
    applySafetyLimits(result, config.maxDiscountPercentage);
  }

  return result;
}

function applySafetyLimits(result: DiscountResult, maxDiscountPercentage: number): void {
  const maxAllowedDiscount = (result.originalSubtotal * maxDiscountPercentage) / 100;
  
  if (result.totalDiscount > maxAllowedDiscount) {
    const reductionFactor = maxAllowedDiscount / result.totalDiscount;
    
    result.lineItems.forEach(lineItem => {
      if (lineItem.totalDiscount > 0) {
        lineItem.totalDiscount *= reductionFactor;
        lineItem.appliedRules.forEach(rule => {
          rule.discountAmount *= reductionFactor;
          rule.appliedRuleInfo.totalCalculatedDiscount *= reductionFactor;
        });
      }
    });
    
    if (result.totalCartDiscount > 0) {
      result.totalCartDiscount *= reductionFactor;
      result.appliedCartRules.forEach(rule => {
        rule.discountAmount *= reductionFactor;
        rule.appliedRuleInfo.totalCalculatedDiscount *= reductionFactor;
      });
    }

    result.finalize();
  }
}
