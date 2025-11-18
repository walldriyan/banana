// src/lib/actions/supplier.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { supplierSchema, type SupplierFormValues } from "@/lib/validation/supplier.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a new supplier.
 */
export async function addSupplierAction(data: SupplierFormValues) {
  const validationResult = supplierSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }

  const { email, ...validatedData } = validationResult.data;

  try {
    const newSupplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        email: email || null,
      },
    });
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: newSupplier };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A supplier with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to create supplier." };
  }
}

/**
 * Server action to fetch all suppliers.
 */
export async function getSuppliersAction() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: suppliers };
  } catch (error) {
    return { success: false, error: "Failed to fetch suppliers." };
  }
}

/**
 * Server action to update an existing supplier.
 */
export async function updateSupplierAction(id: string, data: SupplierFormValues) {
  const validationResult = supplierSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  
  const { email, ...validatedData } = validationResult.data;

  try {
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...validatedData,
        email: email || null,
      },
    });
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: updatedSupplier };
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A supplier with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to update supplier." };
  }
}

/**
 * Server action to delete a supplier.
 */
export async function deleteSupplierAction(id: string) {
  try {
    await prisma.supplier.delete({
      where: { id },
    });
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete supplier." };
  }
}
