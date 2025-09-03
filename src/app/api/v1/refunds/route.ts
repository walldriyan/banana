// src/app/api/v1/refunds/route.ts

import { NextResponse } from 'next/server';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

/**
 * API endpoint to handle refund transaction submissions from external clients.
 */
export async function POST(request: Request) {
  try {
    const refundTransactionData = (await request.json()) as DatabaseReadyTransaction;

    // Basic validation
    if (
      !refundTransactionData || 
      !refundTransactionData.transactionHeader ||
      refundTransactionData.transactionHeader.status !== 'refund' ||
      !refundTransactionData.transactionHeader.originalTransactionId
    ) {
      return NextResponse.json(
        { message: 'Invalid refund transaction data provided.' },
        { status: 400 }
      );
    }
    
    // In a real app, you would now save this to your primary database (e.g., PostgreSQL)
    // and potentially update the status of the original transaction.
    console.log('[API] Received refund transaction to save:', refundTransactionData.transactionHeader.transactionId);
    
    // Example: const result = await YourDatabaseService.saveRefund(refundTransactionData);
    
    return NextResponse.json({
        message: 'Refund transaction processed successfully via API.',
        transactionId: refundTransactionData.transactionHeader.transactionId,
    }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('[API_REFUND_POST_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { message: 'Failed to process refund transaction.', error: errorMessage },
      { status: 500 }
    );
  }
}
