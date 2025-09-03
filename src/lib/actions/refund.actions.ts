// src/lib/actions/refund.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';
import type { SaleItem } from '@/types';
import { processRefund } from '../services/refund.service';
import { saveTransaction } from '../db/local-db';

interface ProcessRefundPayload {
    originalTransaction: DatabaseReadyTransaction;
    refundCart: SaleItem[];
    refundDiscountResult: any; // Simplified for action, core service uses DiscountResult
}

export async function processRefundAction(payload: ProcessRefundPayload) {
    try {
        const refundTransaction = processRefund(payload);
        
        // Save the new refund transaction to the local DB
        await saveTransaction(refundTransaction);

        return { success: true, data: refundTransaction };
    } catch (error) {
        console.error("[REFUND_ACTION_ERROR]", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred while processing the refund."
        };
    }
}
