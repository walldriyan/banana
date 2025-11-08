// src/lib/actions/inventory.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { lostAndDamageSchema, type LostAndDamageFormValues } from "@/lib/validation/inventory.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addLostAndDamageAction(data: LostAndDamageFormValues) {
  const validation = lostAndDamageSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: JSON.stringify(validation.error.flatten()) };
  }

  const { productBatchId, quantity } = validation.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.productBatch.findUnique({
        where: { id: productBatchId },
      });

      if (!batch) {
        throw new Error("Product batch not found.");
      }
      if (batch.stock < quantity) {
        throw new Error(`Quantity (${quantity}) exceeds available stock (${batch.stock}).`);
      }

      // Create the record
      const record = await tx.lostAndDamage.create({
        data: validation.data,
      });

      // Adjust the stock
      await tx.productBatch.update({
        where: { id: productBatchId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      return record;
    });

    revalidatePath('/dashboard/lost-and-damage');
    revalidatePath('/dashboard/products'); // Revalidate products page as stock changes
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to add record." };
  }
}

export async function getLostAndDamageAction() {
  try {
    const records = await prisma.lostAndDamage.findMany({
      orderBy: { date: 'desc' },
      include: {
        productBatch: {
          include: {
            product: true
          }
        }
      }
    });
    return { success: true, data: records };
  } catch (error) {
    return { success: false, error: "Failed to fetch records." };
  }
}

export async function deleteLostAndDamageAction(id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
        const record = await tx.lostAndDamage.findUnique({
            where: { id },
        });

        if (!record) {
            throw new Error("Record not found.");
        }

        // Restore the stock
        await tx.productBatch.update({
            where: { id: record.productBatchId },
            data: {
                stock: {
                    increment: record.quantity,
                },
            },
        });

        // Delete the record
        await tx.lostAndDamage.delete({ where: { id } });

        return record;
    });

    revalidatePath('/dashboard/lost-and-damage');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete record." };
  }
}
