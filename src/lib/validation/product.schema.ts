// src/lib/validation/product.schema.ts
import { z } from 'zod';

const derivedUnitSchema = z.object({
  name: z.string().min(1, "Derived unit name is required."),
  conversionFactor: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive("Conversion factor must be positive.")),
});

const unitDefinitionSchema = z.object({
  baseUnit: z.string().min(1, "Base unit is required."),
  derivedUnits: z.array(derivedUnitSchema).optional(),
});

export const productSchema = z.object({
  id: z.string().min(1, "Unique Product/Batch ID is required."),
  name: z.string().min(2, "Product name must be at least 2 characters."),
  productId: z.string().min(1, "Product ID is required."),
  batchNumber: z.string().optional(),
  
  sellingPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Selling price must be a positive number.")),
  costPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Cost price must be a positive number.")).optional().nullable(),
  quantity: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0, "Quantity must be a positive integer.")),
  
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  
  units: unitDefinitionSchema,
  
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),
  defaultQuantity: z.number().int().positive().default(1),

  tax: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0).optional()).nullable(),
  taxtype: z.enum(["FIXED", "PERCENTAGE"]).optional().nullable(),
  
  defaultDiscount: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0).optional()).nullable(),
  defaultDiscountType: z.string().optional().nullable(),
  
  manufactureDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),

  minStockLevel: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0).optional()).nullable(),
  maxStockLevel: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0).optional()).nullable(),
  
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  addeDate: z.date().optional(),
  userId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
