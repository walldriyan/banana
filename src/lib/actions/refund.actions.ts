// src/lib/actions/refund.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';
import { processRefund } from '../services/refund.service';
import { calculateDiscounts } from '../services/discount.service';
import { saveTransactionToDb } from './database.actions';


interface ProcessRefundPayload {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[]; // Items being KEPT by the customer
    activeCampaign: DiscountSet; // The campaign used for the original transaction
}

/**
 * Server action to process a refund.
 * This action now performs ALL server-side logic:
 * 1. Recalculates discounts for the items being kept.
 * 2. Creates the new refund transaction object.
 * 3. IT DOES NOT SAVE. It returns the final object to the client.
 * This fixes the "Client Reference" error by not calling client-code from the server.
 * 
 * @param payload - The data required for the refund, containing only plain objects.
 * @returns A result object with success status and either the new transaction or an error message.
 */
export async function processRefundAction(payload: ProcessRefundPayload) {
    try {
        const { originalTransaction, refundCart, activeCampaign } = payload;

        // 1. Recalculate discounts for the items being kept on the server.
        const refundDiscountResult = calculateDiscounts(refundCart, activeCampaign);

        // 2. Create the refund transaction object using the pure service function.
        const refundTransaction = processRefund({
            originalTransaction,
            refundCart,
            refundDiscountResult,
            activeCampaign,
        });
        
        // 3. Save the refund transaction to the database
        await saveTransactionToDb(refundTransaction);

        // 4. Return the prepared data to the client to confirm success
        return { success: true, data: refundTransaction };

    } catch (error) {
        console.error("[REFUND_ACTION_ERROR]", error);
        // 5. Return a failure status and a clear error message.
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred while processing the refund."
        };
    }
}
