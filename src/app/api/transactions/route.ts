// src/app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

/**
 * API endpoint to handle transaction submissions.
 * This is the entry point for external clients like a Flutter app.
 * It leverages the shared TransactionService to ensure consistent business logic.
 */
export async function POST(request: Request) {
  try {
    const transactionData = (await request.json()) as DatabaseReadyTransaction;

    // Basic check to ensure we have some data
    if (!transactionData || !transactionData.transactionHeader) {
      return NextResponse.json(
        { message: 'Invalid transaction data provided.' },
        { status: 400 }
      );
    }
    
    // In a real app, you would now save this to your primary database (e.g., PostgreSQL)
    // For this example, we'll just log it to the server console.
    console.log('[API] Received transaction to save:', transactionData.transactionHeader.transactionId);
    
    // Example: const result = await YourDatabaseService.save(transactionData);
    
    return NextResponse.json({
        message: 'Transaction processed successfully via API.',
        transactionId: transactionData.transactionHeader.transactionId,
    }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('[API_TRANSACTION_POST_ERROR]', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    return NextResponse.json(
      { message: 'Failed to process transaction.', error: errorMessage },
      { status: 500 }
    );
  }
}
