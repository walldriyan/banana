// src/app/dashboard/layout.tsx
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarHeader } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <DashboardSidebar />
      </Sidebar>
      <SidebarInset>
         <SidebarHeader className="border-b flex-shrink-0">
            <SidebarTrigger />
        </SidebarHeader>
        <main className={cn("flex-1 flex flex-col p-4 sm:p-6 lg:p-8")}>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
