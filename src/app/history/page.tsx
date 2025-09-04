// src/app/history/page.tsx
import { HistoryClientPage } from "@/components/history/HistoryClientPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth/service";

export default async function HistoryPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction History
            </h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <HistoryClientPage />
      </main>
    </div>
  );
}
