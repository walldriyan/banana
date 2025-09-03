// src/lib/validation/refund.schema.ts
import { z } from 'zod';

// For now, the refund process is simple and doesn't require a complex form.
// We can add validation schemas here if we add more user inputs to the refund dialog,
// for example, reason for refund, or different payment methods for the refund.

export const placeholderRefundSchema = z.object({
  reason: z.string().optional(),
});
