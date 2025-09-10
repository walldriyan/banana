// src/lib/discount-service.ts
import { DiscountEngine } from '@/discount-engine';
import type { SaleItem, DiscountSet } from '@/types';

export function getMyDiscounts(cartItems: SaleItem[], activeCampaign: DiscountSet) {
  const engine = new DiscountEngine(activeCampaign);

  const context = {
    items: cartItems.map(item => ({
      ...item,
      productId: item.id,
      lineId: item.saleItemId,
      batchId: item.selectedBatch?.id
    })),
  };

  return engine.process(context);
}
