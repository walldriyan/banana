// src/app/dashboard/settings/SettingsClientPage.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, Printer, Bell, Users, Palette, UserCog } from "lucide-react";
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard";
import { DiscountSettings } from "@/components/settings/discounts/DiscountSettings";
import { PrintSettings } from "@/components/settings/printing/PrintSettings";
import { AppearanceSettings } from "@/components/settings/appearance/AppearanceSettings";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

const settingsNav = [
    {
        value: "discounts",
        icon: Percent,
        title: "Discount Settings",
        description: "Manage global discount rules and behaviors.",
        permission: "settings.discounts",
        component: <DiscountSettings />
    },
    {
        value: "printing",
        icon: Printer,
        title: "Print Settings",
        description: "Configure receipt templates and printer options.",
        permission: "settings.printing",
        component: <PrintSettings />
    },
    {
        value: "appearance",
        icon: Palette,
        title: "Appearance",
        description: "Customize the look and feel of the application.",
        permission: "settings.appearance",
        component: <AppearanceSettings />
    },
    {
        value: "notifications",
        icon: Bell,
        title: "Notifications",
        description: "Set up alerts for low stock, sales, etc.",
        permission: "settings.notifications",
        component: <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Notification settings will be configured here.</CardDescription></CardHeader><CardContent><p>Coming soon...</p></CardContent></Card>
    },
];

export function SettingsClientPage() {
    return (
        <AuthorizationGuard 
            permissionKey="settings.view" 
            fallback={<p className="text-destructive">You do not have permission to view settings.</p>}
        >
            <Tabs defaultValue="discounts" orientation="vertical" className="flex flex-col md:flex-row md:h-[calc(100vh-12rem)] gap-8">
                <TabsList className="h-auto flex-shrink-0 bg-transparent p-0 flex flex-col items-stretch md:w-1/3 lg:w-1/4 md:border-r md:pr-8">
                    {settingsNav.map(nav => (
                         <AuthorizationGuard key={nav.value} permissionKey={nav.permission}>
                            <TabsTrigger value={nav.value} className="h-auto w-full p-4 justify-start text-left data-[state=active]:bg-primary/10 data-[state=active]:shadow-none border-l-4 border-transparent data-[state=active]:border-primary">
                                <div className="flex items-start gap-4">
                                    <nav.icon className="h-5 w-5 mt-1 text-muted-foreground group-data-[state=active]:text-primary" />
                                    <div className="overflow-hidden">
                                        <h4 className="font-semibold text-base text-foreground">{nav.title}</h4>
                                    </div>
                                </div>
                            </TabsTrigger>
                        </AuthorizationGuard>
                    ))}
                </TabsList>

                <div className="flex-1 mt-6 md:mt-0 md:min-h-0 md:overflow-y-auto">
                    {settingsNav.map(nav => (
                        <TabsContent key={nav.value} value={nav.value}>
                           {nav.component}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </AuthorizationGuard>
    );
}
