// src/lib/actions/company.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { companySchema, type CompanyFormValues } from "@/lib/validation/company.schema";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addCompanyAction(data: CompanyFormValues) {
  const validationResult = companySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  const { email, logoUrl, ...validatedData } = validationResult.data;

  try {
    const newCompany = await prisma.company.create({
      data: {
        ...validatedData,
        email: email || null,
        logoUrl: logoUrl || null,
      },
    });
    revalidatePath('/dashboard/company');
    return { success: true, data: newCompany };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A company with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to create company." };
  }
}

export async function getCompaniesAction() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: companies };
  } catch (error) {
    return { success: false, error: "Failed to fetch companies." };
  }
}

/**
 * Fetches the first active company profile to be used for receipt details.
 */
export async function getCompanyForReceiptAction() {
  try {
    const company = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: {
        createdAt: 'asc'
      },
    });
    if (!company) {
       return { success: false, error: "No active company found. Please add a company profile first." };
    }
    return { success: true, data: company };
  } catch (error) {
    return { success: false, error: "Failed to fetch company details for receipt." };
  }
}

export async function updateCompanyAction(id: string, data: CompanyFormValues) {
  const validationResult = companySchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data: " + JSON.stringify(validationResult.error.flatten().fieldErrors),
    };
  }
  const { email, logoUrl, ...validatedData } = validationResult.data;

  try {
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        ...validatedData,
        email: email || null,
        logoUrl: logoUrl || null,
      },
    });
    revalidatePath('/dashboard/company');
    revalidatePath('/dashboard/settings'); // Revalidate settings page as well
    return { success: true, data: updatedCompany };
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ');
      return { success: false, error: `A company with this ${target} already exists.` };
    }
    return { success: false, error: "Failed to update company." };
  }
}

/**
 * Specifically updates only the fields relevant to the receipt header.
 */
export async function updateCompanyReceiptDetailsAction(id: string, data: { name: string; address: string; phone: string; }) {
  try {
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      },
    });
    revalidatePath('/dashboard/settings');
    return { success: true, data: updatedCompany };
  } catch (error) {
    return { success: false, error: "Failed to update company receipt details." };
  }
}


export async function deleteCompanyAction(id: string) {
  try {
    // We might need to check for dependencies here in the future
    await prisma.company.delete({
      where: { id },
    });
    revalidatePath('/dashboard/company');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete company." };
  }
}
