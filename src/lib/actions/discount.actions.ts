// src/lib/actions/discount.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { discountSetSchema, type DiscountSetFormValues } from "@/lib/validation/discount.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all discount sets.
 */
export async function getDiscountSetsAction() {
  try {
    const discountSets = await prisma.discountSet.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: discountSets };
  } catch (error) {
    return { success: false, error: "Failed to fetch discount campaigns." };
  }
}

/**
 * Server action to add a new discount set.
 */
export async function addDiscountSetAction(data: DiscountSetFormValues) {
  const validationResult = discountSetSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }

  try {
    const newDiscountSet = await prisma.discountSet.create({
      data: validationResult.data,
    });
    revalidatePath('/dashboard/settings');
    return { success: true, data: newDiscountSet };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: "A discount campaign with this name already exists." };
    }
    return { success: false, error: "Failed to create discount campaign." };
  }
}


/**
 * Server action to update an existing discount set.
 */
export async function updateDiscountSetAction(id: string, data: DiscountSetFormValues) {
    const validationResult = discountSetSchema.safeParse(data);
    if (!validationResult.success) {
        return {
            success: false,
            error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
        };
    }

    try {
        const updatedDiscountSet = await prisma.discountSet.update({
            where: { id },
            data: validationResult.data,
        });
        revalidatePath('/dashboard/settings');
        return { success: true, data: updatedDiscountSet };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: "A discount campaign with this name already exists." };
        }
        return { success: false, error: "Failed to update discount campaign." };
    }
}


/**
 * Server action to delete a discount set.
 */
export async function deleteDiscountSetAction(id: string) {
    try {
        // Here, we should also handle deleting related configurations in a transaction.
        // For now, Prisma's onDelete: Cascade will handle it.
        await prisma.discountSet.delete({
            where: { id },
        });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error(`[deleteDiscountSetAction] Error:`, error);
        return { success: false, error: "Failed to delete discount campaign. It might be in use." };
    }
}
