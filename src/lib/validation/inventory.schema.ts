// src/lib/validation/inventory.schema.ts
import { z } from 'zod';

export const lostAndDamageSchema = z.object({
  date: z.date(),
  productBatchId: z.string().min(1, "You must select a product batch."),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  reason: z.enum(['DAMAGED', 'LOST', 'EXPIRED', 'OTHER']),
  notes: z.string().optional(),
}).refine(data => {
    // This refinement would ideally happen with live data, but for schema level it's a good placeholder.
    // In the form, we will check against the actual max quantity.
    return data.quantity > 0;
}, {
    message: "Quantity cannot exceed available stock.",
    path: ["quantity"],
});

export type LostAndDamageFormValues = z.infer<typeof lostAndDamageSchema>;
