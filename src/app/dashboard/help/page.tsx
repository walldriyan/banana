// src/app/dashboard/help/page.tsx
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";
import { HelpClientPage } from "./HelpClientPage";

export default async function HelpPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers and guides for using the application.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <AuthorizationGuard 
          permissionKey="help.view"
          fallback={<HelpClientPage />} // Everyone can view help for now
        >
          <HelpClientPage />
        </AuthorizationGuard>
      </div>
    </div>
  );
}
