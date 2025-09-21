// src/lib/validation/discount.schema.ts
import { z } from 'zod';

export const discountSetSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters."),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  isOneTimePerTransaction: z.boolean().default(false),
  validFrom: z.date().optional().nullable(),
  validTo: z.date().optional().nullable(),
});

export type DiscountSetFormValues = z.infer<typeof discountSetSchema>;
