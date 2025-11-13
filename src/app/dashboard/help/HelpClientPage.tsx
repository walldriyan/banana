// src/app/dashboard/help/HelpClientPage.tsx
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import helpContent from "@/lib/data/help-content.json";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Package, ShoppingCart, Building, Users, CreditCard,
    HandCoins, Printer, Settings, CircleHelp, TrendingUp, ArchiveX
} from 'lucide-react';

const iconMap = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Building,
    Users,
    CreditCard,
    HandCoins,
    TrendingUp,
    Printer,
    Settings,
    CircleHelp,
    ArchiveX
};

type SectionKey = keyof typeof helpContent;
type IconName = keyof typeof iconMap;

export function HelpClientPage() {
    const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
    const { language, t } = useLanguage();

    const sections = Object.keys(helpContent) as SectionKey[];
    const currentContent = helpContent[activeSection][language];
    const currentIconName = helpContent[activeSection].icon as IconName;
    const CurrentIcon = iconMap[currentIconName] || CircleHelp;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-card border rounded-lg">
             <div className="flex flex-row items-center justify-between no-print p-6 border-b">
                <div>
                    <h2 className="text-xl font-semibold">Application Guide</h2>
                    <p className="text-sm text-muted-foreground">
                        Click on a section to the right to see its description.
                    </p>
                </div>
                <LanguageToggle />
             </div>
             <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 min-h-0 p-6">
                {/* Left Panel: Content */}
                <div className="md:col-span-3 rounded-lg overflow-y-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-primary/10 p-3 rounded-lg">
                           <CurrentIcon className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-primary">{helpContent[activeSection].title}</h2>
                    </div>

                    <div className="space-y-6 prose prose-base max-w-none dark:prose-invert">
                        <p className="lead text-lg text-muted-foreground">{currentContent.summary}</p>
                        
                        <div className="border-t pt-6">
                            <h3 className="text-xl font-semibold mb-3">{t('featuresTitle') || 'Key Features'}</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                {currentContent.features.map((feature, index) => (
                                    <li key={index} className="pl-2">{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Navigation */}
                <div className="md:col-span-1 border-l pl-4 overflow-y-auto">
                    <nav className="flex flex-col gap-1">
                        {sections.map((key) => {
                            const sectionInfo = helpContent[key];
                            const IconComponent = iconMap[sectionInfo.icon as IconName] || CircleHelp;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key)}
                                    className={cn(
                                        "group flex w-full items-center gap-3 p-2 text-left rounded-md text-sm font-medium transition-colors border-l-4",
                                        activeSection === key 
                                            ? "border-primary text-primary font-semibold" 
                                            : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <IconComponent className="h-5 w-5 shrink-0" />
                                    <span>{sectionInfo.title}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
             </div>
        </div>
    )
}
