// src/app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction.service';
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
    
    // Use the exact same service layer as the web app's server action
    const result = await TransactionService.save(transactionData);
    
    return NextResponse.json({
        message: 'Transaction processed successfully via API.',
        data: result.data
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
