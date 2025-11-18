// src/lib/discount-service.ts
import { DiscountEngine } from '@/discount-engine';
import type { SaleItem, DiscountSet } from '@/types';

export function getMyDiscounts(cartItems: SaleItem[], activeCampaign: DiscountSet) {
  const engine = new DiscountEngine(activeCampaign);

  const context = {
    items: cartItems.map(item => ({
      ...item,
      productId: item.productId, // Pass the general product ID
      lineId: item.saleItemId,
      batchId: item.id // The unique product ID is the batch ID
    })),
  };

  return engine.process(context);
}
