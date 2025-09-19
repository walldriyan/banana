'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    // This component is now simplified as its logic is integrated into the main sidebar.
    // It can be kept for other potential uses or removed if no longer needed elsewhere.
    return (
        <Button 
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/login' })}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    )
}
