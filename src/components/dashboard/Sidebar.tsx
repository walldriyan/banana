// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart, LayoutDashboard, Building, ShoppingCart, CreditCard, HandCoins, LogOut, Printer, Settings, Briefcase, TrendingUp } from 'lucide-react';
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
import { LogoutButton } from '../auth/LogoutButton';
import { Button } from '../ui/button';
import { signOut } from 'next-auth/react';
import { useSidebar } from '../ui/sidebar';

const generalItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: null },
];

const inventoryItems = [
  { href: '/dashboard/products', icon: Package, label: 'Products', permission: 'products.view' },
  { href: '/dashboard/purchases', icon: ShoppingCart, label: 'Purchases (GRN)', permission: 'purchases.view' },
  { href: '/dashboard/suppliers', icon: Building, label: 'Suppliers', permission: 'suppliers.view' },
];

const peopleItems = [
    { href: '/dashboard/customers', icon: Users, label: 'Customers', permission: 'customers.view' },
]

const financeItems = [
  { href: '/dashboard/credit', icon: CreditCard, label: 'Creditors', permission: 'credit.view' },
  { href: '/dashboard/debtors', icon: HandCoins, label: 'Debtors', permission: 'debtors.view' },
  { href: '/dashboard/finance', icon: TrendingUp, label: 'Income/Expenses', permission: 'finance.view' },
];

const reportItems = [
    { href: '/dashboard/reports', icon: Printer, label: 'Reports', permission: 'reports.view' },
]

const settingsItems = [
  { href: '/dashboard/company', icon: Briefcase, label: 'Company', permission: 'company.manage' },
  { href: '/dashboard/settings', icon: Settings, label: 'Application Settings', permission: 'settings.view' },
]

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
    const iconSize = state === 'collapsed' ? 'lg' : 'default';

  const renderLink = (item: typeof generalItems[0]) => {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
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
                    <item.icon />
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

  return (
    <>
      <SidebarHeader>
        <Link href="/">
           <h2 className="text-2xl font-bold text-sidebar-foreground p-2 cursor-pointer group-data-[collapsible=icon]:hidden">My Store</h2>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>GENERAL</SidebarGroupLabel>
            <SidebarMenu>{generalItems.map(renderLink)}</SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
            <SidebarGroupLabel>INVENTORY</SidebarGroupLabel>
            <SidebarMenu>{inventoryItems.map(renderLink)}</SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
            <SidebarGroupLabel>PEOPLE</SidebarGroupLabel>
            <SidebarMenu>{peopleItems.map(renderLink)}</SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
            <SidebarGroupLabel>FINANCE</SidebarGroupLabel>
            <SidebarMenu>{financeItems.map(renderLink)}</SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
            <SidebarGroupLabel>REPORTS & PRINTING</SidebarGroupLabel>
            <SidebarMenu>{reportItems.map(renderLink)}</SidebarMenu>
        </SidebarGroup>

        <AuthorizationGuard permissionKey='settings.view'>
             <SidebarGroup>
                <SidebarGroupLabel>SETTINGS</SidebarGroupLabel>
                <SidebarMenu>{settingsItems.map(renderLink)}</SidebarMenu>
            </SidebarGroup>
        </AuthorizationGuard>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <AuthorizationGuard permissionKey='pos.view'>
              <SidebarMenuItem>
                  <Link href="/" passHref>
                    <SidebarMenuButton variant="ghost" className="w-full justify-start" tooltip="Point of Sale" size={iconSize}>
                      <Home />
                      <span>POS View</span>
                    </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
            </AuthorizationGuard>
            <SidebarMenuItem>
                <SidebarMenuButton variant="ghost" className="w-full justify-start" tooltip="Logout" onClick={() => signOut({ callbackUrl: '/login' })} size={iconSize}>
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </>
  );
}
