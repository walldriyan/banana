// src/app/dashboard/company/page.tsx
import { CompanyClientPage } from "./CompanyClientPage";

export default async function CompanyPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Company Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage company profiles.</p>
        </div>
      </div>
      <CompanyClientPage />
    </div>
  );
}
