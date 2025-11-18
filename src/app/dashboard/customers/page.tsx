// src/app/dashboard/customers/page.tsx
import { CustomersClientPage } from "./CustomersClientPage";

export default async function CustomersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">View, add, edit, and manage all your customers.</p>
        </div>
      </div>
      <CustomersClientPage />
    </div>
  );
}
