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
  transactionId?: string; // For one-time rule tracking
  config?: DiscountEngineConfig; // Engine configuration
}

// Global engine instance cache for maintaining one-time rule state
const engineCache = new Map<string, DiscountEngine>();

/**
 * Acts as a bridge between the existing application structure and the new Discount Engine.
 * Enhanced with proper one-time rule handling and transaction management.
 * @param input - The sale context including items and the active campaign.
 * @returns An instance of the DiscountResult class.
 */
export function calculateDiscountsForItems(input: CalculateDiscountsInput): DiscountResult {
  const { saleItems, activeCampaign, allProducts, transactionId, config } = input;

  if (!activeCampaign || saleItems.length === 0) {
    // Return an empty but valid DiscountResult object
    return new DiscountResult({ items: [] });
  }

  // 1. Get or create discount engine instance
  const campaignKey = `${activeCampaign.id}-${transactionId || 'default'}`;
  let engine = engineCache.get(campaignKey);
  
  if (!engine) {
    engine = new DiscountEngine(activeCampaign);
    engineCache.set(campaignKey, engine);
  }

  // 2. Create the context for the calculation
  const context = {
    items: saleItems.map((item) => ({
      ...item,
      lineId: item.saleItemId,
      productId: item.id,
      batchId: item.selectedBatchId,
    })),
    // customer: undefined, // Future enhancement for customer-specific discounts
  };

  // 3. Process discounts with the engine
  const result = engine.process(context, transactionId);
  
  // 4. Apply global safety checks if configured
  if (config?.maxDiscountPercentage) {
    applySafetyLimits(result, config.maxDiscountPercentage);
  }

  return result;
}

/**
 * Apply global safety limits to prevent excessive discounts
 */
function applySafetyLimits(result: DiscountResult, maxDiscountPercentage: number): void {
  const maxAllowedDiscount = (result.originalSubtotal * maxDiscountPercentage) / 100;
  
  if (result.totalDiscount > maxAllowedDiscount) {
    console.warn(`Total discount ${result.totalDiscount} exceeds safety limit ${maxAllowedDiscount}. Applying limit.`);
    
    // Proportionally reduce discounts to stay within limit
    const reductionFactor = maxAllowedDiscount / result.totalDiscount;
    
    // Reduce line item discounts
    result.lineItems.forEach(lineItem => {
      if (lineItem.totalDiscount > 0) {
        lineItem.totalDiscount *= reductionFactor;
        lineItem.appliedRules.forEach(rule => {
          rule.discountAmount *= reductionFactor;
        });
      }
    });
    
    // Reduce cart discounts
    if (result.totalCartDiscount > 0) {
      result.totalCartDiscount *= reductionFactor;
      result.appliedCartRules.forEach(rule => {
        rule.discountAmount *= reductionFactor;
      });
    }
  }
}

/**
 * Reset one-time rules for a specific campaign (call when transaction completes)
 */
export function resetOneTimeRulesForCampaign(campaignId: string, transactionId?: string): void {
  const campaignKey = `${campaignId}-${transactionId || 'default'}`;
  const engine = engineCache.get(campaignKey);
  
  if (engine) {
    engine.resetOneTimeRules();
    console.log(`One-time rules reset for campaign ${campaignId}`);
  }
}

/**
 * Clear engine cache (call periodically or when memory cleanup needed)
 */
export function clearEngineCache(): void {
  engineCache.clear();
  console.log('Discount engine cache cleared');
}

/**
 * Get cache size for monitoring
 */
export function getEngineCacheSize(): number {
  return engineCache.size;
}

/**
 * Validate discount configuration before processing
 */
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

  // Validate product configurations
  if (campaign.productConfigurations) {
    campaign.productConfigurations.forEach((config, index) => {
      if (!config.productId) {
        errors.push(`Product configuration ${index + 1}: Product ID is required`);
      }
      
      // Check for duplicate product configurations
      const duplicates = campaign.productConfigurations!.filter(c => c.productId === config.productId);
      if (duplicates.length > 1) {
        warnings.push(`Multiple configurations found for product ${config.productId}. Only the first valid rule will apply.`);
      }
    });
  }

  // Validate batch configurations
  if (campaign.batchConfigurations) {
    campaign.batchConfigurations.forEach((config, index) => {
      if (!config.productBatchId) {
        errors.push(`Batch configuration ${index + 1}: Batch ID is required`);
      }
    });
  }

  // Validate buy-get rules
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