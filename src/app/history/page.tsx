// src/app/history/page.tsx
import { HistoryClientPage } from "@/components/history/HistoryClientPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function HistoryPage() {
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
