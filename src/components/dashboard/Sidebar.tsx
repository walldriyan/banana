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
  SidebarFooter
} from '@/components/ui/sidebar';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';
import { LogoutButton } from '../auth/LogoutButton';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { href: '/dashboard/products', icon: Package, label: 'Products', permission: 'products.view' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers', permission: 'customers.view' },
  { href: '/dashboard/suppliers', icon: Building, label: 'Suppliers', permission: 'suppliers.view' },
  { href: '/dashboard/purchases', icon: ShoppingCart, label: 'Purchases (GRN)', permission: 'purchases.view' },
  { href: '/dashboard/credit', icon: CreditCard, label: 'Creditors', permission: 'credit.view' },
  { href: '/dashboard/debtors', icon: HandCoins, label: 'Debtors', permission: 'debtors.view' },
  // Add more dashboard items here
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const renderLink = (item: typeof navItems[0]) => {
      const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
      return (
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
      )
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/">
           <h2 className="text-2xl font-bold text-sidebar-foreground p-2 cursor-pointer">My Store</h2>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.permission) {
              return (
                <AuthorizationGuard key={item.href} permissionKey={item.permission}>
                    {renderLink(item)}
                </AuthorizationGuard>
              )
            }
            return renderLink(item);
          })}
        </SidebarMenu>
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
