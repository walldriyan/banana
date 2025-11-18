// src/lib/actions/transaction.actions.ts
'use server';

import type { SaleItem, DiscountSet } from '@/types';
import { calculateDiscounts } from '../services/discount.service';

/**
 * A Server Action to calculate discounts for the web UI.
 * It acts as a secure bridge between the client-side UI and the server-side discount service.
 * @param cart - The current list of sale items from the client.
 * @param activeCampaign - The currently selected discount campaign.
 * @returns The final discount result, or an error object.
 */
export async function calculateDiscountsAction(
  cart: SaleItem[],
  activeCampaign: DiscountSet
): Promise<any> { // Using 'any' to allow for raw object transfer without class instances
  try {
    // 1. Call the core, server-only discount service
    const discountResult = calculateDiscounts(cart, activeCampaign);

    // 2. The DiscountResult class instance cannot be passed to the client directly.
    // We need to convert it to a plain JavaScript object.
    // The client will receive a structured object, not a class instance.
    const resultObject = {
      lineItems: discountResult.lineItems.map(li => ({
        ...li,
        netPrice: li.netPrice, // Manually include calculated properties if needed
      })),
      totalItemDiscount: discountResult.totalItemDiscount,
      totalCartDiscount: discountResult.totalCartDiscount,
      appliedCartRules: discountResult.appliedCartRules,
      originalSubtotal: discountResult.originalSubtotal,
      totalDiscount: discountResult.totalDiscount,
      finalTotal: discountResult.finalTotal,
      appliedRulesSummary: discountResult.getAppliedRulesSummary(), // Convert summary to plain array
    };
    
    return { success: true, data: resultObject };

  } catch (error) {
    console.error('[ACTION_ERROR] Failed to calculate discounts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
