// src/lib/validation/product.schema.ts
import { z } from 'zod';

const unitDefinitionSchema = z.object({
  baseUnit: z.string().min(1, "Base unit is required."),
  derivedUnits: z.array(z.object({
    name: z.string().min(1, "Derived unit name is required."),
    conversionFactor: z.number().positive("Conversion factor must be positive."),
  })).optional(),
});

export const productSchema = z.object({
  id: z.string().min(1, "Unique Product/Batch ID is required."),
  name: z.string().min(2, "Product name must be at least 2 characters."),
  productId: z.string().min(1, "Product ID is required."),
  batchNumber: z.string().optional(),
  
  sellingPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Selling price must be a positive number.")),
  costPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0, "Cost price must be a positive number.")),
  quantity: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0, "Quantity must be a positive integer.")),
  
  barcode: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  supplierId: z.string().optional(),
  location: z.string().optional(),
  
  units: unitDefinitionSchema,
  
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),
  defaultQuantity: z.number().int().positive().default(1),

  tax: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0).optional()),
  taxtype: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  
  defaultDiscount: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0).optional()),
  defaultDiscountType: z.string().optional(),
  
  manufactureDate: z.string().optional(),
  expiryDate: z.string().optional(),

  minStockLevel: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0).optional()),
  maxStockLevel: z.union([z.string(), z.number()]).pipe(z.coerce.number().int().min(0).optional()),
  
  notes: z.string().optional(),

  // These fields are usually set by the system, not the user form
  // status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).optional(),
  // addeDate: z.date().optional(),
  // userId: z.string().optional(),
  // companyId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
