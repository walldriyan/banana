// src/app/dashboard/credit/page.tsx
import { CreditClientPage } from "./CreditClientPage";

export default async function CreditManagementPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">GRN Credit Management</h1>
            <p className="text-muted-foreground">Track and manage outstanding payments for Goods Received Notes.</p>
        </div>
      </div>
      <CreditClientPage />
    </div>
  );
}
