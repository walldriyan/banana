// src/lib/services/discount.service.ts

/**
 * @file This file contains the core, server-only service for calculating discounts.
 * It acts as the single source of truth for all discount logic, ensuring consistency
 * between the web UI (via Server Actions) and the mobile app (via API Routes).
 * It is completely decoupled from the UI and the network layer.
 */

import { DiscountEngine } from '@/discount-engine';
import { DiscountResult } from '@/discount-engine/core/result';
import type { SaleItem, DiscountSet, ProductBatch } from '@/types';

/**
 * Calculates discounts for a given set of items and an active campaign.
 * This is the central function that orchestrates the discount engine.
 * @param saleItems The list of items in the cart.
 * @param activeCampaign The active discount campaign configuration.
 * @returns A DiscountResult class instance containing detailed discount information.
 */
export function calculateDiscounts(
  saleItems: SaleItem[],
  activeCampaign: DiscountSet
): DiscountResult {
  // Return an empty result if there's nothing to process.
  if (!activeCampaign || saleItems.length === 0) {
    return new DiscountResult({ items: [] });
  }

  // Initialize the discount engine with the active campaign.
  const engine = new DiscountEngine(activeCampaign);

  // Prepare the context for the discount engine.
  // The engine expects a specific format, so we map the saleItems to it.
  const context = {
    items: saleItems.map((item) => ({
      ...item,
      lineId: item.saleItemId,
      // The general product ID (e.g. `t-shirt-01`)
      productId: item.productId, 
      // The unique ID for a specific batch (e.g. `t-shirt-old-batch-blue-large`)
      batchId: item.id
    })),
  };

  // Process the context and get the result.
  const result = engine.process(context);

  // Here you could add any post-processing or global safety limits if needed.
  // For example: applySafetyLimits(result, 80); // To cap max discount at 80%

  return result;
}
