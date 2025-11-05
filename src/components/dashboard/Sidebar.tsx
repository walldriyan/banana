// src/components/dashboard/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, Package, Users, LineChart, LayoutDashboard, Building, ShoppingCart, 
    CreditCard, HandCoins, LogOut, Printer, Settings, Briefcase, TrendingUp, ChevronRight
} from 'lucide-react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { AuthorizationGuard } from '../auth/AuthorizationGuard';
import { useSidebar } from '../ui/sidebar';
import menuConfig from '@/lib/sidebar-menu.json';
import { LogoutButton } from '../auth/LogoutButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
type MenuItem = typeof menuConfig.groups[0]['items'][0] & { subItems?: typeof menuConfig.groups[0]['items'] };


export function DashboardSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const iconSize = state === 'collapsed' ? 'lg' : 'default';

  const renderLink = (item: MenuItem) => {
      const isActive = item.href ? (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)) : false;
      const IconComponent = iconMap[item.icon as IconName];
      
      const linkContent = (
        <SidebarMenuItem key={item.href || item.label} data-active={isActive}>
             {item.subItems ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        className="w-full"
                        variant="ghost"
                        size={iconSize}
                    >
                        {IconComponent && <IconComponent />}
                         {state === 'expanded' && (
                            <>
                                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                                <ChevronRight className="ml-auto h-4 w-4" />
                            </>
                         )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={10}>
                    {item.subItems.map((subItem) => (
                       <AuthorizationGuard key={subItem.href} permissionKey={subItem.permission || ''}>
                          <DropdownMenuItem asChild>
                              <Link href={subItem.href} passHref>
                                {subItem.label}
                              </Link>
                          </DropdownMenuItem>
                       </AuthorizationGuard>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={item.href || '#'} passHref className='w-full'>
                    <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        className="w-full"
                        variant="ghost"
                        size={iconSize}
                    >
                        {IconComponent && <IconComponent />}
                        <span className="text-sm font-medium">{item.label}</span>
                    </SidebarMenuButton>
                </Link>
              )}
        </SidebarMenuItem>
      );

      if (item.permission) {
        return (
            <AuthorizationGuard key={item.href || item.label} permissionKey={item.permission}>
                {linkContent}
            </AuthorizationGuard>
        )
      }
      return linkContent;
  }
  
  return (
    <>
      <SidebarHeader>
         <Link href="/" className="w-full">
            <SidebarMenuButton
                tooltip="My Store"
                className="w-full"
                variant="ghost"
                size={iconSize}
            >
                <Package />
            </SidebarMenuButton>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
        {menuConfig.groups.flatMap(group => 
            group.items.map(item => (
                <AuthorizationGuard key={item.href || item.label} permissionKey={item.permission || ''}>
                   {renderLink(item as MenuItem)}
                </AuthorizationGuard>
            ))
        )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
             <SidebarMenuItem data-active={pathname === '/'}>
                <Link href="/" passHref className='w-full'>
                    <SidebarMenuButton
                        isActive={pathname === '/'}
                        tooltip="POS View"
                        className="w-full"
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
