// src/lib/validation/debtor.schema.ts
import { z } from 'zod';

export const debtorPaymentSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.coerce.number().positive("Payment amount must be greater than zero."),
  paymentDate: z.date(),
  paymentMethod: z.enum(['cash', 'card', 'cheque', 'online']),
  notes: z.string().optional(),
});

export type DebtorPaymentFormValues = z.infer<typeof debtorPaymentSchema>;
