// src/app/dashboard/reports/page.tsx
import { ReportsClientPage } from "@/components/reports/ReportsClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold">Reports & Printing</h1>
        <p className="text-muted-foreground">Generate and view financial summary reports for your business.</p>
      </div>
      
       <div className="flex-1 min-h-0">
         <AuthorizationGuard 
            permissionKey="reports.view"
            fallback={<p>You do not have permission to view reports.</p>}
          >
            <ReportsClientPage />
        </AuthorizationGuard>
      </div>
    </div>
  );
}
