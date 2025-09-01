// src/lib/discountUtils.ts - Debug Version
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

const engineCache = new Map<string, DiscountEngine>();

export function calculateDiscountsForItems(input: CalculateDiscountsInput): DiscountResult {
  const { saleItems, activeCampaign, allProducts, transactionId, config } = input;

  if (!activeCampaign || saleItems.length === 0) {
    return new DiscountResult({ items: [] });
  }

  // Debug logging
  console.log('=== DISCOUNT CALCULATION DEBUG ===');
  console.log('Active Campaign:', activeCampaign.name);
  console.log('Sale Items:', saleItems.map(item => ({
    saleItemId: item.saleItemId,
    id: item.id,
    selectedBatchId: item.selectedBatchId,
    selectedBatch: item.selectedBatch,
    quantity: item.quantity,
    price: item.price
  })));

  // 1. Get or create discount engine instance
  const campaignKey = `${activeCampaign.id}-${transactionId || 'default'}`;
  let engine = engineCache.get(campaignKey);
  
  if (!engine) {
    console.log('Creating new discount engine for campaign:', activeCampaign.id);
    engine = new DiscountEngine(activeCampaign);
    engineCache.set(campaignKey, engine);
  } else {
    console.log('Using cached discount engine for campaign:', activeCampaign.id);
  }

  // 2. Create the context for the calculation
  const context = {
    items: saleItems.map((item) => {
      const mappedItem = {
        ...item,
        lineId: item.saleItemId,
        productId: item.id,
        batchId: item.selectedBatchId, // This is critical for batch matching
      };
      
      console.log('Mapped item for context:', {
        lineId: mappedItem.lineId,
        productId: mappedItem.productId,
        batchId: mappedItem.batchId,
        quantity: mappedItem.quantity,
        price: mappedItem.price
      });
      
      return mappedItem;
    }),
  };

  console.log('Context created:', context);
  console.log('Batch configurations in campaign:', activeCampaign.batchConfigurations?.map(bc => ({
    id: bc.id,
    productBatchId: bc.productBatchId,
    isActive: bc.isActiveForBatchInCampaign
  })));

  // 3. Process discounts with the engine
  const result = engine.process(context, transactionId);
  
  console.log('Discount result:', {
    totalItemDiscount: result.totalItemDiscount,
    totalCartDiscount: result.totalCartDiscount,
    appliedRules: result.getAppliedRulesSummary()
  });
  
  // 4. Apply global safety checks if configured
  if (config?.maxDiscountPercentage) {
    applySafetyLimits(result, config.maxDiscountPercentage);
  }

  console.log('=== END DISCOUNT DEBUG ===');
  
  return result;
}

function applySafetyLimits(result: DiscountResult, maxDiscountPercentage: number): void {
  const maxAllowedDiscount = (result.originalSubtotal * maxDiscountPercentage) / 100;
  
  if (result.totalDiscount > maxAllowedDiscount) {
    console.warn(`Total discount ${result.totalDiscount} exceeds safety limit ${maxAllowedDiscount}. Applying limit.`);
    
    const reductionFactor = maxAllowedDiscount / result.totalDiscount;
    
    result.lineItems.forEach(lineItem => {
      if (lineItem.totalDiscount > 0) {
        lineItem.totalDiscount *= reductionFactor;
        lineItem.appliedRules.forEach(rule => {
          rule.discountAmount *= reductionFactor;
        });
      }
    });
    
    if (result.totalCartDiscount > 0) {
      result.totalCartDiscount *= reductionFactor;
      result.appliedCartRules.forEach(rule => {
        rule.discountAmount *= reductionFactor;
      });
    }
  }
}

export function resetOneTimeRulesForCampaign(campaignId: string, transactionId?: string): void {
  const campaignKey = `${campaignId}-${transactionId || 'default'}`;
  const engine = engineCache.get(campaignKey);
  
  if (engine) {
    engine.resetOneTimeRules();
    console.log(`One-time rules reset for campaign ${campaignId}`);
  }
}

export function clearEngineCache(): void {
  engineCache.clear();
  console.log('Discount engine cache cleared');
}

export function getEngineCacheSize(): number {
  return engineCache.size;
}

export function validateDiscountConfiguration(campaign: DiscountSet): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!campaign.id || campaign.id.trim() === '') {
    errors.push('Campaign ID is required');
  }

  if (!campaign.name || campaign.name.trim() === '') {
    errors.push('Campaign name is required');
  }

  if (campaign.productConfigurations) {
    campaign.productConfigurations.forEach((config, index) => {
      if (!config.productId) {
        errors.push(`Product configuration ${index + 1}: Product ID is required`);
      }
      
      const duplicates = campaign.productConfigurations!.filter(c => c.productId === config.productId);
      if (duplicates.length > 1) {
        warnings.push(`Multiple configurations found for product ${config.productId}. Only the first valid rule will apply.`);
      }
    });
  }

  if (campaign.batchConfigurations) {
    campaign.batchConfigurations.forEach((config, index) => {
      if (!config.productBatchId) {
        errors.push(`Batch configuration ${index + 1}: Batch ID is required`);
      }
    });
  }

  if (campaign.buyGetRulesJson) {
    campaign.buyGetRulesJson.forEach((rule, index) => {
      if (!rule.buyProductId || !rule.getProductId) {
        errors.push(`Buy-Get rule ${index + 1}: Both buy and get product IDs are required`);
      }
      if (rule.buyQuantity <= 0 || rule.getQuantity <= 0) {
        errors.push(`Buy-Get rule ${index + 1}: Quantities must be greater than 0`);
      }
      if (rule.discountType === 'percentage' && rule.discountValue > 100) {
        errors.push(`Buy-Get rule ${index + 1}: Percentage discount cannot exceed 100%`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}