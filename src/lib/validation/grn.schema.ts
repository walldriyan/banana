// src/lib/validation/grn.schema.ts
import { z } from 'zod';

export const grnItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  productName: z.string().optional(),
  batchNumber: z.string().min(1, "Batch number is required."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative."),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number(),
});

export const grnSchema = z.object({
  grnNumber: z.string().min(1, "GRN number is required."),
  grnDate: z.date(),
  supplierId: z.string().min(1, "Supplier is required."),
  invoiceNumber: z.string().optional(),
  items: z.array(grnItemSchema).min(1, "At least one item must be added to the GRN."),
  notes: z.string().optional(),
  paidAmount: z.coerce.number().min(0).nullable(),
  paymentMethod: z.enum(['cash', 'card', 'cheque', 'credit']),
});


export type GrnFormValues = z.infer<typeof grnSchema>;
