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
        return { success: true, data: newShift };
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

        const transactions = await prisma.transaction.findMany({
            where: {
                transactionDate: {
                    gte: shiftToEnd.startTime,
                },
                status: 'completed'
            },
            select: {
                finalTotal: true,
            }
        });
        
        const calculatedTotal = transactions.reduce((sum, tx) => sum + tx.finalTotal, 0);
        const difference = data.closingBalance - calculatedTotal;

        const updatedShift = await prisma.shift.update({
            where: { id: data.shiftId },
            data: {
                endTime: new Date(),
                closingBalance: data.closingBalance,
                calculatedTotal: calculatedTotal,
                difference: difference,
                notes: data.notes,
                status: 'closed',
            },
        });

        revalidatePath("/dashboard/shifts");
        return { success: true, data: updatedShift };
    } catch (error) {
        return { success: false, error: "Failed to end shift." };
    }
}

export async function getShiftsAction() {
    try {
        const shifts = await prisma.shift.findMany({
            orderBy: { startTime: 'desc' },
        });
        return { success: true, data: shifts };
    } catch (error) {
        return { success: false, error: "Failed to fetch shifts." };
    }
}

export async function getActiveShiftAction(userId: string) {
     try {
        const activeShift = await prisma.shift.findFirst({
            where: {
                userId: userId,
                status: "open",
            },
        });
        return { success: true, data: activeShift };
    } catch (error) {
        return { success: false, error: "Failed to fetch active shift." };
    }
}
