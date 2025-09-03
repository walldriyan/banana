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
  finalTotal: z.number(), // We need the final total to be in the form data for validation
}).refine(data => {
    // If it's NOT an installment plan, the paid amount must be exactly the final total.
    if (!data.isInstallment) {
      // Using a small epsilon for floating point comparison
      return Math.abs(data.paidAmount - data.finalTotal) < 0.01;
    }
    // If it IS an installment, this rule doesn't apply, so we return true.
    return true;
}, {
    message: "For a full payment, the amount paid must exactly match the total amount.",
    path: ["paidAmount"], // Apply this error message to the paidAmount field
}).refine(data => {
    // If it IS an installment plan, the paid amount must be less than the final total.
    if (data.isInstallment) {
        return data.paidAmount < data.finalTotal && data.paidAmount > 0;
    }
    // If it's NOT an installment, this rule doesn't apply.
    return true;
}, {
    message: "Installment amount must be greater than zero and less than the total.",
    path: ["paidAmount"],
});


export const transactionFormSchema = z.object({
    customer: customerSchema,
    payment: paymentSchema,
});


export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
