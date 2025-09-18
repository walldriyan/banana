// src/app/dashboard/purchases/page.tsx
import { PurchasesClientPage } from "./PurchasesClientPage";

export default async function PurchasesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Goods Received Notes (GRN)</h1>
            <p className="text-muted-foreground">Manage your product purchases from suppliers.</p>
        </div>
      </div>
      <PurchasesClientPage />
    </div>
  );
}
