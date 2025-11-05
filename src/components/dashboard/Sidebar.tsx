// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, Package, Users, LineChart, LayoutDashboard, Building, ShoppingCart, 
    CreditCard, HandCoins, LogOut, Printer, Settings, Briefcase, TrendingUp 
} from 'lucide-react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';
import { useSidebar } from '../ui/sidebar';
import menuConfig from '@/lib/sidebar-menu.json';
import { LogoutButton } from '../auth/LogoutButton';

// A map to resolve icon names from the JSON config to actual components
const iconMap = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Building,
    Users,
    CreditCard,
    HandCoins,
    TrendingUp,
    Printer,
    Briefcase,
    Settings,
    Home,
    LogOut,
};

type IconName = keyof typeof iconMap;

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const iconSize = state === 'collapsed' ? 'lg' : 'default';

  const renderLink = (item: typeof menuConfig.groups[0]['items'][0]) => {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
      const IconComponent = iconMap[item.icon as IconName];
      
      const linkContent = (
        <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
                <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="justify-start"
                    variant="ghost"
                    size={iconSize}
                >
                    {IconComponent && <IconComponent />}
                    <span className="text-sm font-medium">{item.label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
      );

      if (item.permission) {
        return (
            <AuthorizationGuard key={item.href} permissionKey={item.permission}>
                {linkContent}
            </AuthorizationGuard>
        )
      }
      return linkContent;
  }
  
  return (
    <>
      <SidebarHeader>
        <Link href="/">
           <h2 className="text-2xl font-bold text-sidebar-foreground p-2 cursor-pointer group-data-[collapsible=icon]:hidden">My Store</h2>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
        {menuConfig.groups.flatMap(group => 
            group.items.map(item => (
                <AuthorizationGuard key={item.href} permissionKey={item.permission || ''}>
                   {renderLink(item)}
                </AuthorizationGuard>
            ))
        )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/" passHref>
                    <SidebarMenuButton
                        isActive={pathname === '/'}
                        tooltip="POS View"
                        className="justify-start"
                        variant="ghost"
                        size={iconSize}
                    >
                        <Home />
                        <span className="text-sm font-medium">POS View</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <LogoutButton />
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
