// src/app/dashboard/layout.tsx
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
      {/* 🔹 Full-screen flex container */}
      <div className="flex w-screen h-screen overflow-hidden">
        {/* 🔹 Sidebar */}
        <Sidebar collapsible="icon">
          <DashboardSidebar />
        </Sidebar>

        {/* 🔹 Main Area */}
        <SidebarInset className="flex flex-col flex-1 min-h-0 min-w-0">
          <SidebarHeader className="border-b flex-shrink-0">
            <SidebarTrigger />
          </SidebarHeader>

          {/* 🔹 Content area */}
          <main
            className={cn(
              "flex flex-col flex-1 min-h-0 min-w-0 p-4 sm:p-6 lg:p-8 overflow-hidden"
            )}
          >
            {/* 🔹 Scrollable children container */}
            <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
