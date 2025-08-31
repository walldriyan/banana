// src/lib/discountUtils.ts
import { DiscountEngine } from '@/discount-engine';
import { DiscountResult } from '@/discount-engine/core/result';
import {
  type Product,
  type SaleItem,
  type DiscountSet,
 
} from '@/types';

interface CalculateDiscountsInput {
  saleItems: SaleItem[];
  activeCampaign: DiscountSet | null;
  allProducts: Product[]; 
}

/**
 * Acts as a bridge between the existing application structure and the new Discount Engine.
 * It prepares the context for the engine and returns the full DiscountResult object.
 * @param input - The sale context including items and the active campaign.
 * @returns An instance of the DiscountResult class.
 */
export function calculateDiscountsForItems(input: CalculateDiscountsInput): DiscountResult {
  const { saleItems, activeCampaign, allProducts } = input;

  // If there's no active campaign or the cart is empty, return an empty but valid result
  if (!activeCampaign || saleItems.length === 0) {
    return new DiscountResult({ items: [] });
  }

  // 1. Initialize the Discount Engine with the active campaign and product list
  const engine = new DiscountEngine(activeCampaign, allProducts);

  // 2. Create the context for the calculation, mapping sale items to what the engine expects
  const context = {
    items: saleItems.map((item) => ({
      ...item,
      lineId: item.saleItemId, // Use saleItemId as the unique line identifier
      productId: item.id,
      batchId: item.selectedBatchId,
    })),
    // customer: undefined, // Future enhancement for customer-specific discounts
  };

  // 3. Run the engine and return the full result object
  const result = engine.process(context);
  return result;
}
