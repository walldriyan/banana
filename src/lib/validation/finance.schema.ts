// src/lib/validation/finance.schema.ts
import { z } from 'zod';

export const financialTransactionSchema = z.object({
  date: z.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(3, "Description must be at least 3 characters."),
  category: z.string().min(1, "Category is required."),
  companyId: z.string().optional(), // Make optional as it's auto-assigned on server
  
  // Optional linked entities
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});
export type FinancialTransactionFormValues = z.infer<typeof financialTransactionSchema>;
