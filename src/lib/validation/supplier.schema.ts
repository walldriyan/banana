// src/lib/validation/supplier.schema.ts
import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters."),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
