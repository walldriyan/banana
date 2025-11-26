// src/lib/actions/user.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { userSchema, type UserFormValues } from "@/lib/validation/user.schema";
import { revalidatePath } from "next/cache";
import { serializeDecimals } from "../utils/serialize";

export async function getUsersAction() {
    try {
        const users = await prisma.user.findMany({
            include: { role: true },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: serializeDecimals(users) };
    } catch (error) {
        return { success: false, error: "Failed to fetch users." };
    }
}

export async function addUserAction(data: UserFormValues) {
    const validation = userSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    // In a real app, hash the password before saving
    // const hashedPassword = await hash(data.password, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                username: data.username,
                name: data.name,
                password: data.password || '', // Should be caught by schema, but satisfying TS
                isActive: data.isActive,
                roleId: data.roleId,
            }
        });
        revalidatePath('/dashboard/users');
        return { success: true, data: serializeDecimals(newUser) };
    } catch (error) {
        return { success: false, error: "Failed to create user. Username might already exist." };
    }
}

export async function updateUserAction(id: string, data: UserFormValues) {
    const validation = userSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                username: data.username,
                name: data.name,
                isActive: data.isActive,
                roleId: data.roleId,
                // Conditionally update password if a new one is provided
                ...(data.password && { password: data.password }),
            }
        });
        revalidatePath('/dashboard/users');
        return { success: true, data: serializeDecimals(updatedUser) };
    } catch (error) {
        return { success: false, error: "Failed to update user. Username might already exist." };
    }
}


export async function deleteUserAction(id: string) {
    try {
        // Prevent self-deletion if we had a concept of current user ID here
        await prisma.user.delete({ where: { id } });
        revalidatePath('/dashboard/users');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete user." };
    }
}
