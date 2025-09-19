// src/lib/validation/product.schema.ts
import { z } from 'zod';

const derivedUnitSchema = z.object({
  name: z.string().min(1, "Derived unit name is required."),
  conversionFactor: z.coerce.number().positive("Conversion factor must be positive."),
});

export const unitDefinitionSchema = z.object({
  baseUnit: z.string().min(1, "Base unit is required."),
  derivedUnits: z.array(derivedUnitSchema).optional(),
});

// Schema for the "master" product
export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  units: unitDefinitionSchema,
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// Schema for a Product Batch
export const productBatchSchema = z.object({
    productId: z.string().min(1, "A master product must be selected."),
    batchNumber: z.string().min(1, "Batch number is required."),
    sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative."),
    costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional().nullable(),
    quantity: z.coerce.number().int().min(0, "Quantity must be a non-negative integer."),
    barcode: z.string().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    manufactureDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    minStockLevel: z.coerce.number().int().min(0).optional().nullable(),
    maxStockLevel: z.coerce.number().int().min(0).optional().nullable(),
    location: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export type ProductBatchFormValues = z.infer<typeof productBatchSchema>;
