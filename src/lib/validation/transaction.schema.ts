// src/lib/validation/transaction.schema.ts
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, { message: "Customer name cannot be empty." }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const paymentSchema = z.object({
  paidAmount: z.number().min(0, { message: "Paid amount cannot be negative." }),
  paymentMethod: z.enum(['cash', 'card', 'online'], {
    errorMap: () => ({ message: "Please select a valid payment method." }),
  }),
  outstandingAmount: z.number().min(0),
  isInstallment: z.boolean(),
});

export const transactionFormSchema = z.object({
    customer: customerSchema,
    payment: paymentSchema,
}).refine(data => data.payment.paidAmount >= 0, {
    message: "Paid amount must be a positive number.",
    path: ["payment", "paidAmount"],
});


export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
