// src/app/dashboard/layout.tsx
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarHeader } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardSidebar />
      </Sidebar>
      <SidebarInset className="bg-gray-100 dark:bg-gray-900 min-h-screen">
         <SidebarHeader className="border-b">
            <SidebarTrigger />
        </SidebarHeader>
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
