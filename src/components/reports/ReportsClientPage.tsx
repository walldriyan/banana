// src/components/reports/ReportsClientPage.tsx
'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, startOfYear, startOfWeek, isSameDay } from 'date-fns';
import { getSummaryReportDataAction, type SummaryReportData } from '@/lib/actions/report.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from './DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer } from 'lucide-react';
import { SummaryReport } from './SummaryReport';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '../LanguageToggle';

const reportPrintStyles = `
  @page { 
    size: A4; 
    margin: 20mm; 
  }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: transparent !important;
      color: black !important;
    }
    .report-container {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      color: black;
      background-color: white;
    }
    .no-print {
      display: none;
    }
  }
  html.dark body, html.dark .report-container {
    background-color: #111827 !important; /* gray-900 */
    color: white !important;
  }
  html.dark .text-black { color: white !important; }
  html.dark .text-gray-800 { color: #e5e7eb !important; } /* gray-200 */
  html.dark .text-gray-600 { color: #9ca3af !important; } /* gray-400 */
  html.dark .text-gray-500 { color: #a1a1aa !important; } /* zinc-400 */
  html.dark .bg-gray-100 { background-color: #374151 !important; } /* gray-700 */
  html.dark .bg-blue-50 { background-color: #1e3a8a !important; } /* blue-900 */
  html.dark .text-blue-800 { color: #93c5fd !important; } /* blue-300 */
  html.dark .border-gray-200 { border-color: #4b5563 !important; } /* gray-600 */
  html.dark .border-gray-300 { border-color: #4b5563 !important; }
`;

const ReportGenerator = () => {
    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(today, 6), // Default to last 7 days including today
        to: today,
    });
    const [activePreset, setActivePreset] = useState<string | null>('week');
    const [reportData, setReportData] = useState<SummaryReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { language } = useLanguage();

    const handleGenerateReport = useCallback((range: DateRange) => {
        if (!range || !range.from || !range.to) {
            setError("Please select a valid date range.");
            return;
        }

        startTransition(async () => {
            setError(null);
            setReportData(null);
            const result = await getSummaryReportDataAction({ from: range.from!, to: range.to! });
            if (result.success) {
                setReportData(result.data!);
            } else {
                setError(result.error!);
            }
        });
    }, []);
    
    // Auto-generate report when date range changes
    useEffect(() => {
        if (dateRange?.from && dateRange.to) {
            handleGenerateReport(dateRange);
            
            // Check if the current range matches a preset
            if (isSameDay(dateRange.from, today) && isSameDay(dateRange.to, today)) {
                setActivePreset('today');
            } else if (isSameDay(dateRange.from, startOfWeek(today)) && isSameDay(dateRange.to, today)) {
                setActivePreset('week');
            } else if (isSameDay(dateRange.from, startOfMonth(today)) && isSameDay(dateRange.to, today)) {
                setActivePreset('month');
            } else if (isSameDay(dateRange.from, startOfYear(today)) && isSameDay(dateRange.to, today)) {
                setActivePreset('year');
            } else {
                setActivePreset(null); // Custom range
            }
        }
    }, [dateRange, handleGenerateReport]);


    const handlePresetClick = (range: DateRange, presetName: string) => {
        setActivePreset(presetName);
        setDateRange(range); // This will trigger the useEffect to generate the report
    };
    
    const handlePrint = async () => {
        if (!reportData) return;

        const isDarkMode = document.documentElement.classList.contains('dark');
        const ReactDOMServer = (await import('react-dom/server')).default;
        const reportHTML = ReactDOMServer.renderToString(
          <LanguageProvider initialLanguage={language}>
            <SummaryReport data={reportData} />
          </LanguageProvider>
        );

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <html>
                  <head>
                    <title>Financial Summary Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>${reportPrintStyles}</style>
                  </head>
                  <body class="${isDarkMode ? 'dark' : ''}">
                    <div class="report-container">
                      ${reportHTML}
                    </div>
                  </body>
                </html>
            `);
            iframeDoc.close();
            
             setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 500);
        }

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1500);
    };

    return (
        <div className="flex flex-row h-full gap-6">
            <div className="flex-1 min-h-0 overflow-y-auto">
                 {isPending && (
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                        <CardContent className="space-y-4"><Skeleton className="h-64 w-full" /></CardContent>
                    </Card>
                 )}
                 {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
                 {reportData && (
                     <Card>
                         <CardHeader className="flex flex-row items-center justify-between no-print">
                            <div>
                                <CardTitle>Summary Report</CardTitle>
                                <CardDescription>
                                    Report for the period of {new Date(reportData.dateRange.from).toLocaleDateString()} to {new Date(reportData.dateRange.to).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
                         </CardHeader>
                         <CardContent>
                            <SummaryReport data={reportData} />
                         </CardContent>
                     </Card>
                 )}
            </div>

            <div className="flex flex-col w-96 flex-shrink-0 gap-6">
                <Card className="no-print">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Report Generation</CardTitle>
                            <CardDescription>Select a date range to automatically generate your financial summary report.</CardDescription>
                        </div>
                        <LanguageToggle />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
                        <div className="flex flex-wrap gap-2">
                            <Button variant={activePreset === 'today' ? 'secondary' : 'outline'} size="sm" onClick={() => handlePresetClick({ from: today, to: today }, 'today')}>Today</Button>
                            <Button variant={activePreset === 'week' ? 'secondary' : 'outline'} size="sm" onClick={() => handlePresetClick({ from: startOfWeek(today), to: today }, 'week')}>This Week</Button>
                            <Button variant={activePreset === 'month' ? 'secondary' : 'outline'} size="sm" onClick={() => handlePresetClick({ from: startOfMonth(today), to: today }, 'month')}>This Month</Button>
                            <Button variant={activePreset === 'year' ? 'secondary' : 'outline'} size="sm" onClick={() => handlePresetClick({ from: startOfYear(today), to: today }, 'year')}>This Year</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export function ReportsClientPage() {
  return (
    <LanguageProvider>
      <ReportGenerator />
    </LanguageProvider>
  )
}
