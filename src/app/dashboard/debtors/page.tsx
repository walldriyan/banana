// src/app/dashboard/debtors/page.tsx
import { DebtorsClientPage } from "./DebtorsClientPage";

export default async function DebtorsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Customer Credit (Debtors)</h1>
            <p className="text-muted-foreground">Track and manage outstanding payments for sales transactions.</p>
        </div>
      </div>
      <DebtorsClientPage />
    </div>
  );
}
