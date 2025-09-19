// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart, LayoutDashboard, Building, ShoppingCart, CreditCard, HandCoins } from 'lucide-react';
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
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const renderLink = (item: typeof generalItems[0]) => {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
      const linkContent = (
        <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
                <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="justify-start"
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
           <h2 className="text-2xl font-bold text-sidebar-foreground p-2 cursor-pointer">My Store</h2>
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
      </SidebarContent>

      <SidebarFooter className="flex-col">
        <div className="flex flex-col gap-2 p-2">
            <AuthorizationGuard permissionKey='pos.view'>
                <Link href="/" passHref>
                    <Button variant="outline" className="w-full justify-start">
                        <Home className="mr-2 h-4 w-4" />
                        <span>POS View</span>
                    </Button>
                </Link>
            </AuthorizationGuard>
            <LogoutButton />
        </div>
      </SidebarFooter>
    </>
  );
}
