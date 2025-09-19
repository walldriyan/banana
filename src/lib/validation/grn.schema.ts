// src/lib/validation/grn.schema.ts
import { z } from 'zod';

const derivedUnitSchema = z.object({
  name: z.string().min(1, "Derived unit name is required."),
  conversionFactor: z.coerce.number().positive("Conversion factor must be positive."),
});

const unitDefinitionSchema = z.object({
  baseUnit: z.string().min(1, "Base unit is required."),
  derivedUnits: z.array(derivedUnitSchema).optional(),
});


export const grnItemSchema = z.object({
  // Base product info needed to create a new batch
  productId: z.string().min(1, "Product ID from template is required."),
  name: z.string().min(1, "Product Name is required."),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  units: unitDefinitionSchema,
  sellingPrice: z.coerce.number().min(0),

  // GRN-specific details
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
  paidAmount: z.coerce.number().min(0).nullable().default(0),
  paymentMethod: z.enum(['cash', 'card', 'cheque', 'credit']),
  totalAmount: z.coerce.number().min(0, "Total amount must be non-negative."),
});


export type GrnFormValues = z.infer<typeof grnSchema>;
