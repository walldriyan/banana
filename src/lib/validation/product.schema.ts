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

// This schema now represents the combined data for a Master Product and its initial Batch.
// It's used in the "Add New Master Product" form.
export const productSchema = z.object({
  // Master Product Fields
  name: z.string().min(2, "Product name must be at least 2 characters."),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  units: unitDefinitionSchema,
  isService: z.boolean().default(false),
  isActive: z.boolean().default(true),

  // Initial Batch Fields
  productId: z.string(), // This will be auto-generated from the name
  batchNumber: z.string().min(1, "Batch number is required."),
  sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative."),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative.").optional().nullable(),
  quantity: z.coerce.number().int().min(0, "Initial stock must be a non-negative integer."),
  
  // Optional Fields (can belong to master or batch)
  barcode: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  manufactureDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // Unused fields from original schema, kept for compatibility, but can be removed later
  minStockLevel: z.coerce.number().optional().nullable(),
  maxStockLevel: z.coerce.number().optional().nullable(),
  tax: z.coerce.number().optional().nullable(),
  taxtype: z.string().optional().nullable(),
  defaultDiscount: z.coerce.number().optional().nullable(),
  defaultDiscountType: z.string().optional().nullable(),
  defaultQuantity: z.coerce.number().optional().nullable(),
});


export type ProductFormValues = z.infer<typeof productSchema>;

// This schema is more specific and can be used for GRN item creation
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
