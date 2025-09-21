// src/app/dashboard/settings/page.tsx
import { SettingsClientPage } from "./SettingsClientPage";

export default async function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Application Settings</h1>
            <p className="text-muted-foreground">Manage global application settings and preferences.</p>
        </div>
      </div>
      <SettingsClientPage />
    </div>
  );
}
