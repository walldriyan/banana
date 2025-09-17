// src/lib/actions/product.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { productSchema, ProductFormValues } from "@/lib/validation/product.schema";
import { Prisma }from "@prisma/client";

/**
 * Server action to add a new product to the database.
 * @param data - The product data from the form.
 * @returns An object with success status and either the new product or an error message.
 */
export async function addProductAction(data: ProductFormValues) {
  // 1. Validate the data on the server
  const validationResult = productSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data provided. " + validationResult.error.flatten().fieldErrors,
    };
  }
  
  const validatedData = validationResult.data;

  try {
    // 2. Use Prisma to create the product
    const newProduct = await prisma.product.create({
      data: {
        ...validatedData,
        sellingPrice: Number(validatedData.sellingPrice),
        costPrice: Number(validatedData.costPrice),
        quantity: Number(validatedData.quantity),
        stock: Number(validatedData.quantity), // stock is an alias for quantity
        tax: validatedData.tax ? Number(validatedData.tax) : null,
        defaultDiscount: validatedData.defaultDiscount ? Number(validatedData.defaultDiscount) : null,
        minStockLevel: validatedData.minStockLevel ? Number(validatedData.minStockLevel) : null,
        maxStockLevel: validatedData.maxStockLevel ? Number(validatedData.maxStockLevel) : null,
        manufactureDate: validatedData.manufactureDate ? new Date(validatedData.manufactureDate) : null,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        addeDate: new Date(),
        // Prisma expects the JSON field to be an object
        units: validatedData.units as Prisma.JsonObject,
      },
    });

    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: "A product with this Unique ID already exists." };
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
        // Convert Date objects to strings for client compatibility
        const productsForClient = products.map(p => ({
            ...p,
            manufactureDate: p.manufactureDate?.toISOString() ?? null,
            expiryDate: p.expiryDate?.toISOString() ?? null,
            addeDate: p.addeDate.toISOString(),
        }));

        return { success: true, data: productsForClient };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            success: false,
            error: "Failed to fetch products from the database.",
        };
    }
}
