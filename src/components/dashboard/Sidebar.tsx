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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';
import { useSidebar } from '../ui/sidebar';
import menuConfig from '@/lib/sidebar-menu.json';

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
                    <span>{item.label}</span>
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
  
  const footerItems = [
    { href: '/', icon: 'Home', label: 'POS View', permission: 'pos.view' },
    { href: '/login', icon: 'LogOut', label: 'Logout', permission: null, isLogout: true }
  ];

  return (
    <>
      <SidebarHeader>
        <Link href="/">
           <h2 className="text-2xl font-bold text-sidebar-foreground p-2 cursor-pointer group-data-[collapsible=icon]:hidden">My Store</h2>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {menuConfig.groups.map((group) => (
            <AuthorizationGuard key={group.label} permissionKey={group.permission || ''}>
                <SidebarGroup>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarMenu>{group.items.map(renderLink)}</SidebarMenu>
                </SidebarGroup>
            </AuthorizationGuard>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            {footerItems.map(item => {
              const IconComponent = iconMap[item.icon as IconName];
              const button = (
                 <SidebarMenuButton 
                    variant="ghost" 
                    className="w-full justify-start" 
                    tooltip={item.label} 
                    size={iconSize}
                    onClick={item.isLogout ? () => (window.location.href = '/login') : undefined}
                  >
                    {IconComponent && <IconComponent />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
              );

              const content = item.isLogout ? button : <Link href={item.href} passHref>{button}</Link>;
              
              if (item.permission) {
                  return (
                    <AuthorizationGuard key={item.href} permissionKey={item.permission}>
                      <SidebarMenuItem>{content}</SidebarMenuItem>
                    </AuthorizationGuard>
                  )
              }
              return <SidebarMenuItem key={item.href}>{content}</SidebarMenuItem>;
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </>
  );
}
