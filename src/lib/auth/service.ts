// src/lib/auth/service.ts
'use server';

import type { User as NextAuthUser } from 'next-auth';
import { prisma } from '../prisma';

type UserWithRole = Awaited<ReturnType<typeof findUserByUsername>>;

/**
 * Finds a user by their username, including their role and permissions.
 */
export async function findUserByUsername(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });
        return user;
    } catch (error) {
        console.error("Error finding user by username:", error);
        return null;
    }
}

/**
 * Placeholder for password verification. In a real app, use a library like bcrypt.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // const bcrypt = require('bcrypt');
  // return await bcrypt.compare(password, hash);
  return password === hash;
}


/**
 * Retrieves all permissions for a user from the database.
 * @param user - A minimal user object with id and role name.
 * @returns An array of all permission strings for the user.
 */
export async function getUserPermissions(user: { id: string, role?: string }): Promise<string[]> {
    if (!user.id || !user.role) {
        return [];
    }

    try {
        const userWithRole = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });

        if (!userWithRole) {
            return [];
        }

        const permissions = userWithRole.role.permissions.map(p => p.key);
        
        // Handle 'access_all' special permission
        if (permissions.includes('access_all')) {
            // In a more complex system, you might fetch all possible permissions.
            // For now, 'access_all' will be checked directly in the guard.
            return ['access_all'];
        }

        return Array.from(new Set(permissions)); // Return unique permissions

    } catch (error) {
        console.error("Error getting user permissions:", error);
        return [];
    }
}
