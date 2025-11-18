'use client';

import { useSessionStore } from "@/store/session-store";

interface AuthorizationGuardProps {
    permissionKey: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * A client-side component to conditionally render its children
 * based on the current user's permissions.
 * It checks for the 'access_all' permission for admin override.
 */
export function AuthorizationGuard({ permissionKey, children, fallback = null }: AuthorizationGuardProps) {
    const permissions = useSessionStore(state => state.permissions);

    const hasAccess = permissions.includes('access_all') || permissions.includes(permissionKey);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}
