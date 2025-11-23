// src/lib/actions/role.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { roleSchema, type RoleFormValues } from "@/lib/validation/role.schema";
import { revalidatePath } from "next/cache";

export async function getRolesAction() {
    try {
        const roles = await prisma.role.findMany({
            include: { permissions: true, _count: { select: { users: true } } },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: roles };
    } catch (error) {
        return { success: false, error: "Failed to fetch roles." };
    }
}

export async function getPermissionsAction() {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: { key: 'asc' }
        });
        return { success: true, data: permissions };
    } catch (error) {
        return { success: false, error: "Failed to fetch permissions." };
    }
}

export async function addRoleAction(data: RoleFormValues) {
    const validation = roleSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    const { name, description, permissionIds } = validation.data;

    try {
        const newRole = await prisma.role.create({
            data: {
                name,
                description,
                permissions: {
                    connect: permissionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/dashboard/roles');
        return { success: true, data: newRole };
    } catch (error) {
        return { success: false, error: "Failed to create role." };
    }
}

export async function updateRoleAction(id: string, data: RoleFormValues) {
    const validation = roleSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: JSON.stringify(validation.error.flatten()) };
    }

    const { name, description, permissionIds } = validation.data;

    try {
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                name,
                description,
                permissions: {
                    set: permissionIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath('/dashboard/roles');
        return { success: true, data: updatedRole };
    } catch (error) {
        return { success: false, error: "Failed to update role." };
    }
}

export async function deleteRoleAction(id: string) {
    try {
        const userCount = await prisma.user.count({ where: { roleId: id } });
        if (userCount > 0) {
            return { success: false, error: `Cannot delete role. It is currently assigned to ${userCount} user(s).` };
        }
        await prisma.role.delete({ where: { id } });
        revalidatePath('/dashboard/roles');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete role." };
    }
}
