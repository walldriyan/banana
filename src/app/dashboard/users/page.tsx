// src/app/dashboard/users/page.tsx
import { UsersClientPage } from "./UsersClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function UsersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage user accounts.</p>
        </div>
      </div>
       <AuthorizationGuard 
          permissionKey="users.view" 
          fallback={<p>You do not have permission to view users.</p>}
        >
          <UsersClientPage />
      </AuthorizationGuard>
    </div>
  );
}
