// src/app/dashboard/finance/page.tsx
import { FinanceClientPage } from "./FinanceClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function FinancePage() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
            <h1 className="text-3xl font-bold">Income & Expense Management</h1>
            <p className="text-muted-foreground">Track all your financial transactions.</p>
        </div>
      </div>
      <AuthorizationGuard permissionKey="finance.view" fallback={<p>You do not have permission to view finance.</p>}>
          <FinanceClientPage />
      </AuthorizationGuard>
    </div>
  );
}
