// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart, LayoutDashboard, Building, ShoppingCart, CreditCard, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md hidden md:block">
      <div className="p-4">
        <Link href="/">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white cursor-pointer">My Store</h2>
        </Link>
      </div>
      <nav className="mt-8">
        <ul>
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            
            const linkContent = (
              <div
                className={cn(
                  'flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200',
                  isActive && 'bg-blue-500 text-white dark:bg-blue-600'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-4 font-medium">{item.label}</span>
              </div>
            );

            const link = <Link href={item.href} passHref>{linkContent}</Link>;
            
            if (item.permission) {
              return (
                <li key={item.href}>
                  <AuthorizationGuard permissionKey={item.permission}>
                    {link}
                  </AuthorizationGuard>
                </li>
              );
            }

            return <li key={item.href}>{link}</li>;

          })}
        </ul>
      </nav>
    </aside>
  );
}
