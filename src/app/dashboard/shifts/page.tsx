// src/app/dashboard/shifts/page.tsx
import { ShiftsClientPage } from "./ShiftsClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function ShiftsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground">Start, end, and review user work shifts.</p>
        </div>
      </div>
       <AuthorizationGuard 
          permissionKey="shifts.view"
          fallback={<p>You do not have permission to view shifts.</p>}
        >
          <ShiftsClientPage />
        </AuthorizationGuard>
    </div>
  );
}
