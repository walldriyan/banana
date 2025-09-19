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
  const { units, ...validatedData } = validationResult.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...validatedData,
        units: units as any, // Prisma expects JSON
      },
    });
    revalidatePath('/dashboard/products');
    return { success: true, data: newProduct };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: `A product with this name already exists.` };
    }
    return { success: false, error: "Failed to create product." };
  }
}

export async function updateProductAction(id: string, data: ProductFormValues) {
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }
    const { units, ...validatedData } = validationResult.data;

    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                ...validatedData,
                units: units as any, // Prisma expects JSON
            },
        });
        revalidatePath('/dashboard/products');
        return { success: true, data: updatedProduct };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: `A product with this name already exists.` };
        }
        return { success: false, error: "Failed to update product." };
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

export async function updateProductBatchAction(id: string, data: ProductBatchFormValues) {
    const validationResult = productBatchSchema.safeParse(data);
    if (!validationResult.success) {
        return { success: false, error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors) };
    }
    const validatedData = validationResult.data;

    try {
        const oldBatch = await prisma.productBatch.findUnique({ where: { id }});
        if (!oldBatch) {
            return { success: false, error: "Batch not found."};
        }

        const quantityChange = validatedData.quantity - oldBatch.quantity;

        const updatedBatch = await prisma.productBatch.update({
            where: { id },
            data: {
                ...validatedData,
                // Stock should be updated based on the change in quantity
                stock: {
                    increment: quantityChange
                },
                manufactureDate: validatedData.manufactureDate ? new Date(validatedData.manufactureDate) : null,
                expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
            },
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


export async function deleteProductBatchAction(id: string) {
    try {
        await prisma.productBatch.delete({
            where: { id },
        });
        revalidatePath('/dashboard/products');
        return { success: true };
    } catch (error) {
        console.error(`Error deleting batch ${id}:`, error);
        return { success: false, error: "Failed to delete product batch. It might be in use in transactions." };
    }
}
