// src/app/dashboard/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's a quick overview of your store.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader>
                    <CardTitle>Manage Products</CardTitle>
                    <CardDescription>
                        View, add, edit, and manage all your products in one place.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/dashboard/products" passHref>
                        <Button>
                            <Package className="mr-2 h-4 w-4" />
                            Go to Products
                        </Button>
                    </Link>
                </CardContent>
            </Card>
            {/* You can add more cards here for other dashboard sections like Orders, Customers, etc. */}
        </div>
    </div>
  );
}
