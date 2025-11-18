// src/app/api/v1/calculate-discounts/route.ts

import { NextResponse } from 'next/server';
import { calculateDiscounts } from '@/lib/services/discount.service';
import type { SaleItem, DiscountSet } from '@/types';

/**
 * API endpoint to calculate discounts.
 * This is the entry point for external clients like a Flutter app.
 * It leverages the shared discount.service.ts to ensure consistent business logic.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart, activeCampaign } = body as { cart: SaleItem[], activeCampaign: DiscountSet };

    // Basic validation
    if (!cart || !activeCampaign || !Array.isArray(cart)) {
      return NextResponse.json(
        { message: 'Invalid request body. "cart" and "activeCampaign" are required.' },
        { status: 400 }
      );
    }

    // Use the exact same service layer as the web app's server action
    const discountResult = calculateDiscounts(cart, activeCampaign);

    // The DiscountResult class instance cannot be returned directly in an API response.
    // We convert it to a plain JSON object.
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
      appliedRulesSummary: discountResult.getAppliedRulesSummary(),
    };

    return NextResponse.json(resultObject, { status: 200 });

  } catch (error) {
    console.error('[API_DISCOUNT_POST_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { message: 'Failed to calculate discounts.', error: errorMessage },
      { status: 500 }
    );
  }
}
