// src/lib/validation/discount.schema.ts
import { z } from 'zod';

export const specificDiscountRuleSchema = z.object({
  isEnabled: z.boolean().default(false),
  name: z.string().optional(),
  type: z.enum(['percentage', 'fixed']).default('fixed'),
  value: z.coerce.number().default(0),
  conditionMin: z.coerce.number().optional().nullable(),
  conditionMax: z.coerce.number().optional().nullable(),
  applyFixedOnce: z.boolean().optional().default(true),
  description: z.string().optional(),
}).nullable();


export const discountSetSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters."),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  isOneTimePerTransaction: z.boolean().default(false),
  validFrom: z.date().optional().nullable(),
  validTo: z.date().optional().nullable(),
  
  // JSON rule fields
  globalCartPriceRuleJson: specificDiscountRuleSchema,
  globalCartQuantityRuleJson: specificDiscountRuleSchema,
  defaultLineItemValueRuleJson: specificDiscountRuleSchema,
  defaultLineItemQuantityRuleJson: specificDiscountRuleSchema,
  defaultSpecificQtyThresholdRuleJson: specificDiscountRuleSchema,
  defaultSpecificUnitPriceThresholdRuleJson: specificDiscountRuleSchema,
});

export type DiscountSetFormValues = z.infer<typeof discountSetSchema>;
