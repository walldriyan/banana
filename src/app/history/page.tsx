// src/app/history/page.tsx
import { HistoryClientPage } from "@/components/history/HistoryClientPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";


export default async function HistoryPage() {
  // SINHALA COMMENT:
  // Development (සංවර්ධන) පරිසරය සඳහා, අපි, server-side authentication පරීක්ෂාව, තාවකාලිකව, ඉවත් කර ඇත.
  // මෙයට හේතුව, අප, දැනට, client-side එකේ, තාවකාලික (dummy) session එකක්, භාවිතා කරන නිසා,
  // server-side එකට, එම session එක, නොලැබීමයි.
  // Production (සැබෑ යෙදුම) සඳහා, මෙම comment කළ කොටස්, නැවත, enable කළ යුතුය.
  
  /*
  const session = await getServerSession(authOptions);

  // This is a server-side check. If the user is not logged in,
  // they will be redirected by the middleware, but this is an extra layer of security.
  if (!session?.user) {
    redirect('/login');
  }

  // Server-side permission check
  const canViewHistory = await hasPermission(session.user, 'history.view');
  if(!canViewHistory) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
                <Link href="/" passHref>
                    <Button className="mt-4">Go to Dashboard</Button>
                </Link>
            </div>
        </div>
      )
  }
  */

  return (
    <div className="min-h-screen bg-background">
      {/* The main content area will now be managed by the client page */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* The AuthorizationGuard inside HistoryClientPage will now handle access based on the client-side dummy session */}
        <AuthorizationGuard permissionKey="history.view" fallback={
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-600 mt-2">You do not have permission to view transaction history.</p>
            </div>
        }>
            <HistoryClientPage />
        </AuthorizationGuard>
      </main>
    </div>
  );
}
