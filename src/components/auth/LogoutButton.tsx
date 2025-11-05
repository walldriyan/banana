// src/components/auth/LogoutButton.tsx
'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton, useSidebar } from '../ui/sidebar';

export function LogoutButton() {
    let sidebarState: 'expanded' | 'collapsed' = 'expanded';
    let isMobile = false;
    let iconSize: 'default' | 'sm' | 'lg' = 'default';
    
    // Gracefully handle cases where the button is used outside a SidebarProvider
    try {
        const { state, isMobile: mobile, iconSize: size } = useSidebar();
        sidebarState = state;
        isMobile = mobile;
        iconSize = size as 'default' | 'sm' | 'lg';
    } catch (e) {
        // Not inside a sidebar, use default values
    }

    if (sidebarState === 'collapsed' || isMobile) {
         return (
            <SidebarMenuButton
                tooltip="Logout"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                variant="ghost"
                size={iconSize}
                onClick={() => signOut({ callbackUrl: '/login' })}
            >
                <LogOut />
                <span className="sr-only">Logout</span>
            </SidebarMenuButton>
        );
    }
    
    return (
        <Button
            variant="ghost"
            size="icon"
            className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
        >
            <LogOut />
            <span className="sr-only">Logout</span>
        </Button>
    )
}
