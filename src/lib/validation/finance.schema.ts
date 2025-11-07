// src/lib/validation/finance.schema.ts
import { z } from 'zod';

export const financialTransactionSchema = z.object({
  date: z.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().min(0, "Amount must be a non-negative number."),
  description: z.string(),
  category: z.string(),
  companyId: z.string().optional(), // Make optional as it's auto-assigned on server
  
  // Optional linked entities
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});
export type FinancialTransactionFormValues = z.infer<typeof financialTransactionSchema>;
