// src/app/dashboard/settings/page.tsx
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Application Settings</h1>
            <p className="text-muted-foreground">Manage global application settings and preferences.</p>
        </div>
      </div>
      <AuthorizationGuard permissionKey="settings.view" fallback={
        <p className="text-destructive">You do not have permission to view settings.</p>
      }>
        <div>
            <p>Application settings will be configured here.</p>
        </div>
      </AuthorizationGuard>
    </div>
  );
}
