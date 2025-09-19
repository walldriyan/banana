// src/discount-engine/core/context.ts
import type { SaleItem, User } from '@/types';

/**
 * Represents a single line in the shopping cart, enhanced for the discount engine.
 */
export interface LineItemData extends SaleItem {
  lineId: string; // A unique identifier for this line item in this specific sale (e.g., saleItemId)
  productId: string; // The general product identifier (e.g., 't-shirt-01')
  batchId: string; // The unique product-batch identifier (e.g., 't-shirt-old-batch')
}

/**
 * Represents the entire context of a sale, providing all necessary information
 * for discount rules to make their decisions.
 */
export interface DiscountContext {
  items: LineItemData[];
  customer?: User; // For customer-specific discounts in the future
  // Other context like date, store location, etc., can be added here.
}
