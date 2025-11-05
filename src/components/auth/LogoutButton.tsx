'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton } from '../ui/sidebar';
import { useSidebar } from '../ui/sidebar';

export function LogoutButton() {
    const { state } = useSidebar();
    const iconSize = state === 'collapsed' ? 'lg' : 'default';
    return (
        <SidebarMenuButton 
            variant="ghost"
            size={iconSize}
            className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
            tooltip="Logout"
            onClick={() => signOut({ callbackUrl: '/login' })}
        >
            <LogOut />
            <span className="text-sm font-medium">Logout</span>
        </SidebarMenuButton>
    )
}
