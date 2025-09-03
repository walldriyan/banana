// src/lib/actions/refund.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import type { SaleItem, DiscountSet } from '@/types';
import { processRefund } from '../services/refund.service';
import { saveTransaction } from '../db/local-db';
import { calculateDiscounts } from '../services/discount.service';

interface ProcessRefundPayload {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[]; // Items being KEPT by the customer
    activeCampaign: DiscountSet; // The campaign used for the original transaction
}

/**
 * Server action to process a refund.
 * It takes the original transaction and the "kept" items to calculate the refund
 * and save a new transaction record. This is a pure server-side operation.
 * 
 * This action now performs the discount recalculation internally to avoid passing
 * complex objects from the client to the server, thus preventing "Client Reference" errors.
 * 
 * @param payload - The data required for the refund, containing only plain objects.
 * @returns A result object with success status and either the new transaction or an error message.
 */
export async function processRefundAction(payload: ProcessRefundPayload) {
    try {
        const { originalTransaction, refundCart, activeCampaign } = payload;

        // 1. Recalculate discounts for the items being kept, now done on the server.
        // This is the key change to fix the Client Reference error.
        const refundDiscountResult = calculateDiscounts(refundCart, activeCampaign);

        // 2. The processRefund service function is a pure server-side function
        //    that handles all the business logic for creating the refund transaction object.
        const refundTransaction = processRefund({
            originalTransaction,
            refundCart,
            refundDiscountResult, // Pass the newly calculated result
            activeCampaign,
        });
        
        // 3. Save the newly created refund transaction to the local DB (or any other DB).
        //    This saves the refund as a new, separate entry. The original transaction is untouched.
        await saveTransaction(refundTransaction);

        // 4. Return a success status and the data to the client component.
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
