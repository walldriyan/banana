// src/lib/actions/product.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { productSchema, ProductFormValues } from "@/lib/validation/product.schema";
import { Prisma }from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a new product to the database.
 * @param data - The product data from the form.
 * @returns An object with success status and either the new product or an error message.
 */
export async function addProductAction(data: ProductFormValues) {
  // 1. Validate the data on the server
  const validationResult = productSchema.safeParse(data);
  if (!validationResult.success) {
    console.log(validationResult.error.flatten());
    return {
      success: false,
      error: "Invalid data provided. " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  
  const validatedData = validationResult.data;

  try {
    // 2. Use Prisma to create the product
    const newProduct = await prisma.product.create({
      data: {
        ...validatedData,
        sellingPrice: Number(validatedData.sellingPrice),
        costPrice: validatedData.costPrice ? Number(validatedData.costPrice) : null,
        quantity: Number(validatedData.quantity),
        stock: Number(validatedData.quantity),
        tax: validatedData.tax ? Number(validatedData.tax) : null,
        defaultDiscount: validatedData.defaultDiscount ? Number(validatedData.defaultDiscount) : null,
        minStockLevel: validatedData.minStockLevel ? Number(validatedData.minStockLevel) : null,
        maxStockLevel: validatedData.maxStockLevel ? Number(validatedData.maxStockLevel) : null,
        manufactureDate: validatedData.manufactureDate ? new Date(validatedData.manufactureDate) : null,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        addeDate: new Date(),
        units: JSON.stringify(validatedData.units),
      },
    });
    
    revalidatePath('/products');

    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[])?.join(', ');
        return { success: false, error: `A product with this ${target} already exists.` };
      }
    }
    return {
      success: false,
      error: "Failed to create product in the database.",
    };
  }
}


/**
 * Server action to fetch all products from the database.
 * @returns An object with success status and the list of products or an error message.
 */
export async function getProductsAction() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        
        // Convert Date objects to strings and parse the 'units' JSON string for client compatibility
        const productsForClient = products.map(p => {
          let parsedUnits;
          try {
            parsedUnits = JSON.parse(p.units as string);
          } catch(e) {
            console.error(`Failed to parse units JSON for product ${p.id}:`, p.units);
            parsedUnits = { baseUnit: 'unit', derivedUnits: [] };
          }

          return {
            ...p,
            manufactureDate: p.manufactureDate?.toISOString() ?? null,
            expiryDate: p.expiryDate?.toISOString() ?? null,
            addeDate: p.addeDate.toISOString(),
            units: parsedUnits,
          }
        });

        return { success: true, data: productsForClient };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            success: false,
            error: "Failed to fetch products from the database.",
        };
    }
}

/**
 * Server action to fetch a single product by its ID.
 * @param id - The unique ID of the product.
 * @returns The product object or null if not found.
 */
export async function getProductByIdAction(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return { success: false, error: "Product not found." };
        }
        
        let parsedUnits;
        try {
            parsedUnits = JSON.parse(product.units as string);
        } catch(e) {
            parsedUnits = { baseUnit: 'unit', derivedUnits: [] };
        }

        const productForClient = {
            ...product,
            manufactureDate: product.manufactureDate?.toISOString().split('T')[0] ?? undefined,
            expiryDate: product.expiryDate?.toISOString().split('T')[0] ?? undefined,
            units: parsedUnits,
        };

        return { success: true, data: productForClient };
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        return { success: false, error: "Database error." };
    }
}

/**
 * Server action to update an existing product.
 * @param id - The ID of the product to update.
 * @param data - The new data for the product.
 * @returns The updated product or an error message.
 */
export async function updateProductAction(id: string, data: ProductFormValues) {
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    const validatedData = validationResult.data;

    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
              ...validatedData,
              sellingPrice: Number(validatedData.sellingPrice),
              costPrice: validatedData.costPrice ? Number(validatedData.costPrice) : null,
              quantity: Number(validatedData.quantity),
              stock: Number(validatedData.quantity),
              tax: validatedData.tax ? Number(validatedData.tax) : null,
              defaultDiscount: validatedData.defaultDiscount ? Number(validatedData.defaultDiscount) : null,
              minStockLevel: validatedData.minStockLevel ? Number(validatedData.minStockLevel) : null,
              maxStockLevel: validatedData.maxStockLevel ? Number(validatedData.maxStockLevel) : null,
              manufactureDate: validatedData.manufactureDate ? new Date(validatedData.manufactureDate) : null,
              expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
              units: JSON.stringify(validatedData.units),
            },
        });
        
        revalidatePath('/products');
        revalidatePath(`/products/edit/${id}`);

        return { success: true, data: updatedProduct };
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            return { success: false, error: `A product with this ${target} already exists.` };
        }
        return { success: false, error: "Failed to update product." };
    }
}

/**
 * Server action to delete a product.
 * @param id - The ID of the product to delete.
 * @returns Success status or an error message.
 */
export async function deleteProductAction(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });
        
        revalidatePath('/products');

        return { success: true };
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        return { success: false, error: "Failed to delete product." };
    }
}
