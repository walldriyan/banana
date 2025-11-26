// src/app/dashboard/roles/page.tsx
import { RolesClientPage } from "./RolesClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function RolesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Define roles and manage their permissions.</p>
        </div>
      </div>
      <AuthorizationGuard 
          permissionKey="roles.view" 
          fallback={<p>You do not have permission to view roles.</p>}
        >
          <RolesClientPage />
      </AuthorizationGuard>
    </div>
  );
}
