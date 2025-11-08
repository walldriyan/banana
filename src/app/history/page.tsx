// src/app/history/page.tsx
import { HistoryClientPage } from "@/components/history/HistoryClientPage";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";

export default async function HistoryPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 flex flex-col min-h-0">
        <AuthorizationGuard 
          permissionKey="history.view" 
          fallback={
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-600 mt-2">You do not have permission to view transaction history.</p>
            </div>
          }
        >
          <HistoryClientPage />
        </AuthorizationGuard>
      </main>
    </div>
  );
}
