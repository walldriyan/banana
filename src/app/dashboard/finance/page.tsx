// src/app/dashboard/finance/page.tsx
// ✅ Page container එක - flex column structure
// -------------------------------------------------------------------

import { FinanceClientPage } from "./FinanceClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function FinancePage() {
  return (
    <div className="flex flex-col h-full">
      {/* Fixed header section */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold">Income & Expense Management</h1>
        <p className="text-muted-foreground">Track all your financial transactions.</p>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AuthorizationGuard 
          permissionKey="finance.view" 
          fallback={<p>You do not have permission to view finance.</p>}
        >
          <FinanceClientPage />
        </AuthorizationGuard>
      </div>
    </div>
  );
}
