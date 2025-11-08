// src/app/dashboard/help/HelpClientPage.tsx
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import helpContent from "@/lib/data/help-content.json";
import { cn } from "@/lib/utils";

type SectionKey = keyof typeof helpContent;

export function HelpClientPage() {
    const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
    const { language, t } = useLanguage();

    const sections = Object.keys(helpContent) as SectionKey[];
    const currentContent = helpContent[activeSection][language];

    return (
        <Card className="flex flex-col h-full overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between no-print">
                <div>
                    <CardTitle>Application Guide</CardTitle>
                    <CardDescription>
                        Click on a section to the left to see its description.
                    </CardDescription>
                </div>
                <LanguageToggle />
             </CardHeader>
             <CardContent className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                {/* Left Panel: Navigation */}
                <div className="md:col-span-1 rounded-lg border bg-muted/50 p-2 overflow-y-auto">
                    <nav className="flex flex-col gap-1">
                        {sections.map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={cn(
                                    "p-3 text-left rounded-md text-sm font-medium transition-colors",
                                    activeSection === key 
                                        ? "bg-primary text-primary-foreground" 
                                        : "hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                {helpContent[key].title}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Panel: Content */}
                 <div className="md:col-span-2 rounded-lg border p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-primary mb-4">{helpContent[activeSection].title}</h2>
                    <div className="space-y-4 prose prose-sm max-w-none dark:prose-invert">
                        <p className="lead">{currentContent.summary}</p>
                        <h3 className="text-lg font-semibold">{t('featuresTitle') || 'Key Features'}</h3>
                        <ul>
                            {currentContent.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </div>
                </div>
             </CardContent>
        </Card>
    )
}
