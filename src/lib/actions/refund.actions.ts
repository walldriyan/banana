// src/lib/actions/refund.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';
import { processRefund } from '../services/refund.service';
import { saveTransaction } from '../db/local-db';

interface ProcessRefundPayload {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[];
    refundDiscountResult: any; // Simplified for action, core service uses DiscountResult
    activeCampaign: DiscountSet; // The campaign used for recalculation
}

/**
 * Server action to process a refund.
 * It takes the original transaction and the "kept" items to calculate the refund
 * and save a new transaction record. This is a pure server-side operation.
 * 
 * @param payload - The data required for the refund.
 * @returns A result object with success status and either the new transaction or an error message.
 */
export async function processRefundAction(payload: ProcessRefundPayload) {
    try {
        // 1. The processRefund service function is a pure server-side function
        //    that handles all the business logic for creating the refund transaction object.
        const refundTransaction = processRefund({
            originalTransaction: payload.originalTransaction,
            refundCart: payload.refundCart,
            refundDiscountResult: payload.refundDiscountResult,
            activeCampaign: payload.activeCampaign,
        });
        
        // 2. Save the newly created refund transaction to the local DB (or any other DB).
        //    This saves the refund as a new, separate entry. The original transaction is untouched.
        await saveTransaction(refundTransaction);

        // 3. Return a success status and the data to the client component.
        return { success: true, data: refundTransaction };

    } catch (error) {
        console.error("[REFUND_ACTION_ERROR]", error);
        // 4. Return a failure status and a clear error message.
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred while processing the refund."
        };
    }
}
