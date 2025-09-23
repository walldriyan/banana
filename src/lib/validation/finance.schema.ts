// src/lib/validation/finance.schema.ts
import { z } from 'zod';

export const financialTransactionCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
});
export type FinancialTransactionCategoryFormValues = z.infer<typeof financialTransactionCategorySchema>;


export const financialTransactionSchema = z.object({
  date: z.date(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(3, "Description must be at least 3 characters."),
  categoryId: z.string().min(1, "Category is required."),
  companyId: z.string().min(1, "Company is required.").optional(), // Make optional as it's auto-assigned
  
  // Optional linked entities
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});
export type FinancialTransactionFormValues = z.infer<typeof financialTransactionSchema>;
