// src/app/dashboard/suppliers/page.tsx
import { SuppliersClientPage } from "./SuppliersClientPage";

export default async function SuppliersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Supplier Management</h1>
            <p className="text-muted-foreground">View, add, edit, and manage all your suppliers.</p>
        </div>
      </div>
      <SuppliersClientPage />
    </div>
  );
}
