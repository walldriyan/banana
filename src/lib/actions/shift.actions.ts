// src/lib/actions/shift.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { z } from 'zod';
import { revalidatePath } from "next/cache";

const startShiftSchema = z.object({
    userId: z.string().min(1),
    userName: z.string().min(1),
    openingBalance: z.coerce.number().min(0),
});

const endShiftSchema = z.object({
    shiftId: z.string().min(1),
    closingBalance: z.coerce.number().min(0),
    notes: z.string().optional(),
    calculatedSales: z.number(), // Added to receive the pre-calculated sales
});

export async function startShiftAction(data: z.infer<typeof startShiftSchema>) {
    const validation = startShiftSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid data provided." };
    }

    // Check for existing open shift for the user
    const existingOpenShift = await prisma.shift.findFirst({
        where: {
            userId: data.userId,
            status: "open",
        },
    });

    if (existingOpenShift) {
        return { success: false, error: "User already has an open shift. Please close it first." };
    }

    try {
        const newShift = await prisma.shift.create({
            data: validation.data,
        });
        revalidatePath("/dashboard/shifts");
        const { openingBalance, ...rest } = newShift;
        return { success: true, data: { ...rest, openingBalance: openingBalance.toNumber() } };
    } catch (error) {
        return { success: false, error: "Failed to start shift." };
    }
}

export async function endShiftAction(data: z.infer<typeof endShiftSchema>) {
    const validation = endShiftSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid data provided." };
    }

    try {
        const shiftToEnd = await prisma.shift.findUnique({
            where: { id: data.shiftId },
        });

        if (!shiftToEnd || shiftToEnd.status !== 'open') {
            return { success: false, error: "Shift not found or is not open." };
        }

        // The calculated total and difference are now based on the pre-calculated sales from the client
        const calculatedTotal = (shiftToEnd.openingBalance.toNumber() || 0) + data.calculatedSales;
        const difference = data.closingBalance - calculatedTotal;

        const updatedShift = await prisma.shift.update({
            where: { id: data.shiftId },
            data: {
                endTime: new Date(),
                closingBalance: data.closingBalance,
                calculatedTotal: calculatedTotal, // Save the server-calculated total
                difference: difference,
                notes: data.notes,
                status: 'closed',
            },
        });

        revalidatePath("/dashboard/shifts");
        
        // Convert Decimal fields to number before returning
        const { openingBalance, closingBalance, calculatedTotal: calcTotal, difference: diff, ...rest } = updatedShift;
        const plainObject = {
            ...rest,
            openingBalance: openingBalance.toNumber(),
            closingBalance: closingBalance?.toNumber() ?? null,
            calculatedTotal: calcTotal?.toNumber() ?? null,
            difference: diff?.toNumber() ?? null,
        };

        return { success: true, data: plainObject };

    } catch (error) {
        console.error("Error ending shift:", error);
        return { success: false, error: "Failed to end shift." };
    }
}

export async function getShiftsAction() {
    try {
        const shifts = await prisma.shift.findMany({
            orderBy: { startTime: 'desc' },
        });
        
        // Convert Decimal fields to number before returning
        const plainShifts = shifts.map(shift => {
             const { openingBalance, closingBalance, calculatedTotal, difference, ...rest } = shift;
             return {
                 ...rest,
                 openingBalance: openingBalance.toNumber(),
                 closingBalance: closingBalance?.toNumber() ?? null,
                 calculatedTotal: calculatedTotal?.toNumber() ?? null,
                 difference: difference?.toNumber() ?? null,
             }
        });

        return { success: true, data: plainShifts };
    } catch (error) {
        return { success: false, error: "Failed to fetch shifts." };
    }
}


export type ShiftWithCalculations = Shift & { calculatedSales?: number };

export async function getActiveShiftAction(userId: string): Promise<{ success: boolean; data?: ShiftWithCalculations | null; error?: string }> {
     try {
        const activeShift = await prisma.shift.findFirst({
            where: {
                userId: userId,
                status: "open",
            },
        });

        if (!activeShift) {
            return { success: true, data: null };
        }
        
        // If an active shift exists, calculate the sales during that shift
        const salesData = await prisma.transaction.aggregate({
            where: {
                transactionDate: { gte: activeShift.startTime },
                status: 'completed'
            },
            _sum: {
                finalTotal: true
            }
        });

        // Convert Decimal fields to number before returning
        const { openingBalance, closingBalance, calculatedTotal, difference, ...rest } = activeShift;
        const plainShift: ShiftWithCalculations = {
            ...rest,
            openingBalance: openingBalance.toNumber(),
            closingBalance: closingBalance?.toNumber() ?? null,
            calculatedTotal: calculatedTotal?.toNumber() ?? null,
            difference: difference?.toNumber() ?? null,
            calculatedSales: salesData._sum.finalTotal || 0
        };

        return { success: true, data: plainShift };
    } catch (error) {
        return { success: false, error: "Failed to fetch active shift." };
    }
}

