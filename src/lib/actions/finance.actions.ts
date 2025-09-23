// src/lib/actions/finance.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { 
    financialTransactionSchema, type FinancialTransactionFormValues,
    financialTransactionCategorySchema, type FinancialTransactionCategoryFormValues 
} from "@/lib/validation/finance.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Category Actions ---

export async function addCategoryAction(data: FinancialTransactionCategoryFormValues) {
  const validation = financialTransactionCategorySchema.safeParse(data);
  if (!validation.success) return { success: false, error: JSON.stringify(validation.error.flatten()) };
  try {
    const category = await prisma.financialTransactionCategory.create({ data: validation.data });
    revalidatePath('/dashboard/finance');
    return { success: true, data: category };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: "A category with this name already exists for the selected type." };
    }
    return { success: false, error: "Failed to create category." };
  }
}

export async function getCategoriesAction() {
    try {
        const categories = await prisma.financialTransactionCategory.findMany({
            orderBy: { name: 'asc' },
        });
        return { success: true, data: categories };
    } catch (error) {
        return { success: false, error: "Failed to fetch categories." };
    }
}


// --- Transaction Actions ---

export async function addTransactionAction(data: FinancialTransactionFormValues) {
  const validation = financialTransactionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: JSON.stringify(validation.error.flatten()) };
  }
  const { customerId, supplierId, companyId, ...validatedData } = validation.data;
  
  try {
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
        const firstCompany = await prisma.company.findFirst();
        if (!firstCompany) {
            return { success: false, error: "No companies found in the database. Please add a company first." };
        }
        finalCompanyId = firstCompany.id;
    }

    const transaction = await prisma.financialTransaction.create({ 
        data: {
            ...validatedData,
            companyId: finalCompanyId,
            customerId: customerId || null,
            supplierId: supplierId || null,
        }
     });
    revalidatePath('/dashboard/finance');
    return { success: true, data: transaction };
  } catch (error) {
    console.error("[addTransactionAction Error]", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add financial transaction." };
  }
}

export async function getTransactionsAction() {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      include: {
        category: true,
        company: true,
        customer: true,
        supplier: true,
      },
      orderBy: { date: 'desc' },
    });
    return { success: true, data: transactions };
  } catch (error) {
    console.error('[getTransactionsAction Error]:', error);
    return { success: false, error: "Failed to fetch financial transactions." };
  }
}

export async function updateTransactionAction(id: string, data: FinancialTransactionFormValues) {
    const validation = financialTransactionSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }
    const { customerId, supplierId, companyId, ...validatedData } = validation.data;

    try {
        let finalCompanyId = companyId;
        if (!finalCompanyId) {
            const firstCompany = await prisma.company.findFirst();
             if (!firstCompany) {
                return { success: false, error: "No companies found in the database. Please add a company first." };
            }
            finalCompanyId = firstCompany.id;
        }

        const transaction = await prisma.financialTransaction.update({
            where: { id },
            data: {
                ...validatedData,
                companyId: finalCompanyId,
                customerId: customerId || null,
                supplierId: supplierId || null,
            },
        });
        revalidatePath('/dashboard/finance');
        return { success: true, data: transaction };
    } catch (error) {
        console.error("[updateTransactionAction Error]", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to update financial transaction." };
    }
}


export async function deleteTransactionAction(id: string) {
  try {
    await prisma.financialTransaction.delete({ where: { id } });
    revalidatePath('/dashboard/finance');
    return { success: true };
  } catch (error) {
    console.error("[deleteTransactionAction Error]", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete financial transaction." };
  }
}
