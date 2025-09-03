// src/lib/actions/refund.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';
import { processRefund } from '../services/refund.service';
import { saveTransaction } from '../db/local-db';
import type { DiscountResult } from '@/discount-engine/core/result';

interface ProcessRefundPayload {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[];
    refundDiscountResult: any; // Simplified for action, core service uses DiscountResult
}

/**
 * Server action to process a refund.
 * It takes the original transaction and the "kept" items to calculate the refund
 * and save a new transaction record.
 * 
 * @param payload - The data required for the refund.
 * @returns A result object with success status and either the new transaction or an error message.
 */
export async function processRefundAction(payload: ProcessRefundPayload) {
    try {
        // The processRefund service function is a pure server-side function
        // that handles all the business logic for creating the refund transaction.
        const refundTransaction = processRefund({
            originalTransaction: payload.originalTransaction,
            refundCart: payload.refundCart,
            refundDiscountResult: payload.refundDiscountResult,
        });
        
        // Save the newly created refund transaction to the local DB
        await saveTransaction(refundTransaction);

        // Return a success status and the data to the client component.
        return { success: true, data: refundTransaction };

    } catch (error) {
        console.error("[REFUND_ACTION_ERROR]", error);
        // Return a failure status and a clear error message.
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred while processing the refund."
        };
    }
}