// src/app/dashboard/lost-and-damage/page.tsx
import { LostDamageClientPage } from "./LostDamageClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function LostDamagePage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lost & Damage Management</h1>
          <p className="text-muted-foreground">
            Track products that are lost, damaged, or expired.
          </p>
        </div>
      </div>
      <AuthorizationGuard
        permissionKey="products.delete"
        fallback={<p>You do not have permission to manage lost & damage records.</p>}
      >
        <LostDamageClientPage />
      </AuthorizationGuard>
    </div>
  );
}
