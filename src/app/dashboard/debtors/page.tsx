// src/app/dashboard/debtors/page.tsx
import { DebtorsClientPage } from "./DebtorsClientPage";

export default async function DebtorsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold">Customer Credit (Debtors)</h1>
        <p className="text-muted-foreground">Track and manage outstanding payments for sales transactions.</p>
      </div>
      <div className="flex-1 min-h-0">
        <DebtorsClientPage />
      </div>
    </div>
  );
}
