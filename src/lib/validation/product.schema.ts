// src/lib/validation/product.schema.ts
import { z } from 'zod';

const derivedUnitSchema = z.object({
  name: z.string().min(1, "Derived unit name is required."),
  // Use z.coerce to reliably convert string from form input to number
  conversionFactor: z.coerce.number().positive("Conversion factor must be positive."),
});

const unitDefinitionSchema = z.object({
  baseUnit: z.string().min(1, "Base unit is required."),
  derivedUnits: z.array(derivedUnitSchema).optional(),
});

export const productSchema = z.object({
  id: z.string().optional(), // Make ID optional, Prisma will generate it
  name: z.string().min(2, "Product name must be at least 2 characters."),
  productId: z.string().min(1, "Product ID is required."),
  batchNumber: z.string().optional(),
  
  // Use z.coerce to reliably convert string from form input to number for all numeric fields
  sellingPrice: z.coerce.number().min(0, "Selling price must be a non-negative number."),
  costPrice: z.coerce.number().min(0, "Cost price must be a non-negative number.").optional().nullable(),
  quantity: z.coerce.number().int().min(0, "Quantity must be a non-negative integer."),
  
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  
  units: unitDefinitionSchema,
  
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),
  defaultQuantity: z.number().int().positive().default(1),

  tax: z.coerce.number().min(0).optional().nullable(),
  taxtype: z.enum(["FIXED", "PERCENTAGE"]).optional().nullable(),
  
  defaultDiscount: z.coerce.number().min(0).optional().nullable(),
  defaultDiscountType: z.string().optional().nullable(),
  
  // Dates can be optional strings from the form
  manufactureDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),

  minStockLevel: z.coerce.number().int().min(0).optional().nullable(),
  maxStockLevel: z.coerce.number().int().min(0).optional().nullable(),
  
  notes: z.string().optional().nullable(),
  
  // These fields are not on the form and should not be required
  status: z.string().optional().nullable(),
  addeDate: z.date().optional(),
  userId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
