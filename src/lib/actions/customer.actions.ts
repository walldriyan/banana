// src/lib/actions/customer.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { customerSchema, type CustomerFormValues } from "@/lib/validation/customer.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a new customer.
 */
export async function addCustomerAction(data: CustomerFormValues) {
  const validationResult = customerSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }

  const { email, ...validatedData } = validationResult.data;

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        ...validatedData,
        email: email || null, // Store empty string as null
      },
    });
    revalidatePath('/dashboard/customers');
    return { success: true, data: newCustomer };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A customer with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to create customer." };
  }
}

/**
 * Server action to fetch all customers.
 */
export async function getCustomersAction() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: "Failed to fetch customers." };
  }
}

/**
 * Server action to update an existing customer.
 */
export async function updateCustomerAction(id: string, data: CustomerFormValues) {
  const validationResult = customerSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  
  const { email, ...validatedData } = validationResult.data;

  try {
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...validatedData,
        email: email || null,
      },
    });
    revalidatePath('/dashboard/customers');
    return { success: true, data: updatedCustomer };
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A customer with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to update customer." };
  }
}

/**
 * Server action to delete a customer.
 */
export async function deleteCustomerAction(id: string) {
  try {
    // Check if the customer has any associated transactions
    const transactionCount = await prisma.transaction.count({
      where: { customerId: id },
    });

    if (transactionCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete customer. They have ${transactionCount} existing transaction(s).` 
      };
    }

    await prisma.customer.delete({
      where: { id },
    });
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // This case is now less likely due to the check above, but good to keep as a fallback
        return { success: false, error: "Customer not found." };
      }
    }
    return { success: false, error: "Failed to delete customer." };
  }
}
