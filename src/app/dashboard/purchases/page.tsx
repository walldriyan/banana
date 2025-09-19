// src/app/dashboard/purchases/page.tsx
import { PurchasesClientPage } from "./PurchasesClientPage";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";


export default async function PurchasesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold">Goods Received Notes (GRN)</h1>
            <p className="text-muted-foreground">Manage your product purchases from suppliers.</p>
        </div>
        <AuthorizationGuard permissionKey="credit.view">
          <Link href="/dashboard/credit" passHref>
              <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Management
              </Button>
          </Link>
        </AuthorizationGuard>
      </div>
      <PurchasesClientPage />
    </div>
  );
}
