// src/lib/validation/customer.schema.ts
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters."),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
