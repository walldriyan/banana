// src/app/dashboard/finance/page.tsx
import { FinanceClientPage } from "./FinanceClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function FinancePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Income & Expense Management</h1>
            <p className="text-muted-foreground">Track all your financial transactions.</p>
        </div>
      </div>
      <AuthorizationGuard permissionKey="finance.view">
          <FinanceClientPage />
      </AuthorizationGuard>
    </div>
  );
}
