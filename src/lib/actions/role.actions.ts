// src/lib/actions/role.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { roleSchema, type RoleFormValues } from "@/lib/validation/role.schema";
import { revalidatePath } from "next/cache";
import permissionsData from '@/lib/auth/permissions.json'; // Import the static JSON data
import { Prisma } from '@prisma/client';

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

/**
 * Ensures the Permission table is populated with all available permissions
 * from the permissions.json file. This is a self-seeding mechanism.
 */
async function seedPermissions() {
    try {
        const permissionCount = await prisma.permission.count();
        if (permissionCount > 0) {
            // Permissions already exist, no need to seed.
            return;
        }

        console.log("Permission table is empty. Seeding from permissions.json...");

        const allPermissionKeys = new Set<string>();
        Object.values(permissionsData.roles).forEach(role => {
            role.permissions.forEach(p => allPermissionKeys.add(p));
        });
         Object.values(permissionsData.users).forEach(user => {
            user.overrides.permissions.forEach(p => allPermissionKeys.add(p));
        });

        const permissionCreateData = Array.from(allPermissionKeys).map(key => ({
            key,
            description: `Allows to ${key.replace('.', ' ')}`,
        }));
        
        // Use a transaction to ensure all permissions are created or none are.
        await prisma.$transaction(
            permissionCreateData.map(p => 
                prisma.permission.create({ data: p })
            )
        );

        console.log(`Successfully seeded ${permissionCreateData.length} permissions.`);

    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // This can happen in a race condition, it's safe to ignore.
            console.log("Permissions seeding race condition detected. Already seeded.");
        } else {
            console.error("Failed to seed permissions:", error);
            // We don't throw here to avoid blocking the main action if seeding fails.
        }
    }
}


export async function getPermissionsAction() {
    try {
        // Run the seeding logic before fetching. It will only run if the table is empty.
        await seedPermissions();

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
