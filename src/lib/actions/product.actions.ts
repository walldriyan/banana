// src/lib/actions/product.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { productSchema, type ProductFormValues, productBatchSchema, type ProductBatchFormValues } from "@/lib/validation/product.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Master Product Actions ---

export async function addProductAction(data: ProductFormValues) {
  const validationResult = productSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  const { units, quantity, batchNumber, sellingPrice, costPrice, ...validatedProductData } = validationResult.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create the master product
        const newProduct = await tx.product.create({
            data: {
                ...validatedProductData,
                units: units as any, // Prisma expects JSON
            },
        });

        // 2. Create the initial batch for this product
        await tx.productBatch.create({
            data: {
                product: { connect: { id: newProduct.id } },
                batchNumber: batchNumber || `B-${Date.now()}`,
                sellingPrice: sellingPrice || 0,
                costPrice: costPrice || 0,
                stock: quantity || 0,
                addedDate: new Date(),
            }
        });

        return newProduct;
    });
    
    revalidatePath('/dashboard/products');
    return { success: true, data: result };

  } catch (error) {
    console.error('[addProductAction Error]', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'fields';
      return { success: false, error: `A product with the same ${target} already exists.` };
    }
    return { success: false, error: "Failed to create product and initial batch." };
  }
}

export async function updateProductBatchAction(id: string, data: ProductFormValues) {
    // This action now specifically updates a BATCH, not a master product.
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data for batch update: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }
    const { units, quantity, batchNumber, sellingPrice, costPrice, name, description, category, brand, isService, isActive } = validationResult.data;

    try {
        const oldBatch = await prisma.productBatch.findUnique({ where: { id }});
        if (!oldBatch) {
            return { success: false, error: "Batch not found."};
        }

        // Only update the batch-specific fields
        const updatedBatch = await prisma.productBatch.update({
            where: { id },
            data: {
                batchNumber,
                sellingPrice,
                costPrice,
            },
        });

        // Update the master product fields separately
        await prisma.product.update({
            where: { id: oldBatch.productId },
            data: {
                name,
                description,
                category,
                brand,
                units: units as any,
                isService,
                isActive,
            }
        });

        revalidatePath('/dashboard/products');
        return { success: true, data: updatedBatch };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: `A batch with this Product ID and Batch Number already exists.` };
        }
        return { success: false, error: "Failed to update product batch." };
    }
}


export async function getProductsAction() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching master products:", error);
    return { success: false, error: "Failed to fetch master products." };
  }
}


export async function deleteProductAction(id: string) {
    try {
        const batchCount = await prisma.productBatch.count({
            where: { productId: id },
        });
        if (batchCount > 0) {
            return { success: false, error: `Cannot delete product. It has ${batchCount} associated batch(es). Please delete the batches first.` };
        }
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath('/dashboard/products');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete product." };
    }
}

// --- Product Batch Actions ---

export async function getProductBatchesAction() {
    try {
        const batches = await prisma.productBatch.findMany({
            include: { product: true },
            orderBy: [{ product: { name: 'asc' } }, { addedDate: 'desc' }],
        });
        return { success: true, data: batches };
    } catch (error) {
        console.error("Error fetching product batches:", error);
        return { success: false, error: "Failed to fetch product batches." };
    }
}


export async function addProductBatchAction(data: ProductBatchFormValues) {
    const validationResult = productBatchSchema.safeParse(data);
    if (!validationResult.success) {
        return { success: false, error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors) };
    }
    const validatedData = validationResult.data;
    try {
        const newBatch = await prisma.productBatch.create({
            data: {
                ...validatedData,
                stock: validatedData.quantity, // Initial stock is the same as quantity
                addedDate: new Date(),
                manufactureDate: validatedData.manufactureDate ? new Date(validatedData.manufactureDate) : null,
                expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
            },
        });
        revalidatePath('/dashboard/products');
        return { success: true, data: newBatch };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: `A batch with this Product ID and Batch Number already exists.` };
        }
        return { success: false, error: "Failed to create product batch." };
    }
}


export async function deleteProductBatchAction(id: string) {
    try {
        // First check if the batch is part of any transaction lines
        const transactionLineCount = await prisma.transactionLine.count({
            where: { productBatchId: id }
        });

        if (transactionLineCount > 0) {
            return {
                success: false,
                error: `Cannot delete batch. It is part of ${transactionLineCount} existing transaction(s).`
            };
        }

        await prisma.productBatch.delete({
            where: { id },
        });
        
        revalidatePath('/dashboard/products');
        return { success: true };
    } catch (error) {
        console.error(`Error deleting batch ${id}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { success: false, error: "Batch not found for deletion." };
        }
        return { success: false, error: "Failed to delete product batch." };
    }
}
