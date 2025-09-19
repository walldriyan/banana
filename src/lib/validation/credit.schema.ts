// src/lib/validation/credit.schema.ts
import { z } from 'zod';

export const paymentSchema = z.object({
  grnId: z.string().min(1),
  amount: z.coerce.number().positive("Payment amount must be greater than zero."),
  paymentDate: z.date(),
  paymentMethod: z.enum(['cash', 'card', 'cheque', 'online']),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
