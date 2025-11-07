// src/app/dashboard/layout.tsx
// ✅ Main එක overflow hidden - Card එක විතරක් scroll වෙනවා

import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* 🔹 Full viewport container - no overflow */}
      <div className="flex w-screen h-screen overflow-hidden">
        
        {/* 🔹 Sidebar - fixed width */}
        <Sidebar collapsible="icon">
          <DashboardSidebar />
        </Sidebar>

        {/* 🔹 Main content area - flex grow */}
        <SidebarInset className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Header - fixed height */}
          <SidebarHeader className="border-b flex-shrink-0">
            <SidebarTrigger />
          </SidebarHeader>

          {/* ⚠️ Main එක overflow hidden - scroll කරන්නේ නැහැ */}
          <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
