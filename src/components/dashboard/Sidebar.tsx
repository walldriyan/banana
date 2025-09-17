// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';

const navItems = [
  { href: '/', icon: Home, label: 'POS' },
  { href: '/products', icon: Package, label: 'Products', permission: 'products.view' },
  // Add more dashboard items here
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md hidden md:block">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      </div>
      <nav className="mt-8">
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <a
                className={cn(
                  'flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200',
                  isActive && 'bg-blue-500 text-white dark:bg-blue-600'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-4 font-medium">{item.label}</span>
              </a>
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
