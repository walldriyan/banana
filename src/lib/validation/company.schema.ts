// src/lib/validation/company.schema.ts
import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  registrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  logoUrl: z.string().url("Invalid URL.").optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
