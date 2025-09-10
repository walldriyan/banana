// src/lib/auth/service.ts
'use server';

import { User } from 'next-auth';
import permissionsConfig from './permissions.json';

type Role = keyof typeof permissionsConfig.roles;
type UserPermissions = typeof permissionsConfig.users[keyof typeof permissionsConfig.users];

/**
 * Calculates the effective permissions for a given user.
 * It combines permissions from the user's role, inherited roles, and user-specific overrides.
 * @param user - The user object, which should contain username (as id) and role.
 * @returns A unique set of permission strings for the user.
 */
function getEffectivePermissions(user: User | { id: string, role?: Role }): Set<string> {
    if (!user.id || !('role' in user) || !user.role) {
        return new Set();
    }

    const userConfig = (permissionsConfig.users as Record<string, UserPermissions>)[user.id];
    const userRoleKey = userConfig?.role || user.role;

    if (!userRoleKey || !(userRoleKey in permissionsConfig.roles)) {
        return new Set();
    }

    const effectivePermissions = new Set<string>();

    // Function to recursively add permissions from roles
    const addPermissionsFromRole = (roleKey: Role) => {
        const role = permissionsConfig.roles[roleKey];
        if (!role) return;

        role.permissions.forEach(p => effectivePermissions.add(p));

        if (role.inherits) {
            addPermissionsFromRole(role.inherits as Role);
        }
    };

    addPermissionsFromRole(userRoleKey);

    // Add user-specific overrides
    userConfig?.overrides?.permissions?.forEach(p => effectivePermissions.add(p));

    return effectivePermissions;
}

/**
 * Checks if a user has a specific permission.
 * @param user - The user object.
 * @param permission - The permission key to check for.
 * @returns `true` if the user has the permission, otherwise `false`.
 */
export async function hasPermission(user: User, permission: string): Promise<boolean> {
    const userPermissions = getEffectivePermissions(user);
    
    // Admin role has all permissions implicitly
    if (userPermissions.has('access_all')) {
        return true;
    }
    
    return userPermissions.has(permission);
}

/**
 * Retrieves all permissions for a user.
 * @param user - The user object.
 * @returns An array of all permission strings for the user.
 */
export async function getUserPermissions(user: User): Promise<string[]> {
    const permissionsSet = getEffectivePermissions(user);
    return Array.from(permissionsSet);
}

/**
 * Finds a user's role from the permissions config.
 * This function is async to comply with Next.js 'use server' module rules.
 * @param username - The username to look up.
 * @returns The user's role key, or null if not found.
 */
export async function findUserRole(username: string): Promise<Role | null> {
   const userConfig = (permissionsConfig.users as Record<string, UserPermissions>)[username];
   return userConfig?.role || null;
}
