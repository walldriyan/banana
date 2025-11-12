// src/components/reports/ReportsClientPage.tsx
'use client';

import { useState, useTransition, useCallback, useEffect, ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, startOfYear, startOfWeek, isSameDay } from 'date-fns';
import { getSummaryReportDataAction, type SummaryReportData, getStockReportDataAction, getCreditorsReportDataAction, getDebtorsReportDataAction } from '@/lib/actions/report.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from './DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer, Package, CreditCard, HandCoins } from 'lucide-react';
import { SummaryReport } from './SummaryReport';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '../LanguageToggle';
import { StockReport } from './StockReport';
import { CreditorsReport } from './CreditorsReport';
import { DebtorsReport } from './DebtorsReport';
import { useToast } from '@/hooks/use-toast';


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

type ReportType = 'summary' | 'stock' | 'creditors' | 'debtors';

const ReportGenerator = () => {
    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(today, 6), to: today });
    const [activePreset, setActivePreset] = useState<string | null>('week');
    
    const [activeReport, setActiveReport] = useState<ReportType>('summary');
    const [activeReportData, setActiveReportData] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { language } = useLanguage();
    const { toast } = useToast();

    const handleGenerateReport = useCallback((range: DateRange | undefined, type: ReportType) => {
        if (type === 'summary' && (!range || !range.from || !range.to)) {
            setError("Please select a valid date range for the summary report.");
            return;
        }

        startTransition(async () => {
            setError(null);
            setActiveReportData(null);
            
            let result: { success: boolean; data?: any; error?: string };

            switch(type) {
                case 'summary':
                    result = await getSummaryReportDataAction({ from: range!.from!, to: range!.to! });
                    break;
                case 'stock':
                    result = await getStockReportDataAction();
                    break;
                case 'creditors':
                    result = await getCreditorsReportDataAction();
                    break;
                case 'debtors':
                    result = await getDebtorsReportDataAction();
                    break;
                default:
                    result = { success: false, error: 'Invalid report type' };
            }

            if (result.success) {
                setActiveReport(type);
                setActiveReportData(result.data!);
            } else {
                setError(result.error!);
                setActiveReport('summary'); // Fallback to summary view on error
            }
        });
    }, []);
    
    // Auto-generate summary report when date range changes
    useEffect(() => {
        if (dateRange?.from && dateRange.to) {
            handleGenerateReport(dateRange, 'summary');
            
            const from = dateRange.from;
            const to = dateRange.to;
            if (isSameDay(from, today) && isSameDay(to, today)) setActivePreset('today');
            else if (isSameDay(from, startOfWeek(today)) && isSameDay(to, today)) setActivePreset('week');
            else if (isSameDay(from, startOfMonth(today)) && isSameDay(to, today)) setActivePreset('month');
            else if (isSameDay(from, startOfYear(today)) && isSameDay(to, today)) setActivePreset('year');
            else setActivePreset(null);
        }
    }, [dateRange, handleGenerateReport]);


    const handlePresetClick = (range: DateRange, presetName: string) => {
        setActivePreset(presetName);
        setDateRange(range); 
    };
    
    const printReport = async (reportHTML: string, title: string) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <html>
                  <head>
                    <title>${title}</title>
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
    }
    
    const handlePrintActiveReport = async () => {
        if (!activeReportData) {
             toast({ variant: 'destructive', title: 'Error', description: 'No report data to print.' });
             return;
        }
        
        let ReportComponent: React.ComponentType<{ data: any }> | null = null;
        let title = "Report";

        switch(activeReport) {
            case 'summary':
                ReportComponent = SummaryReport;
                title = 'Financial Summary Report';
                break;
            case 'stock':
                ReportComponent = StockReport;
                title = 'Stock Report';
                break;
            case 'creditors':
                ReportComponent = CreditorsReport;
                title = 'Creditors Report';
                break;
            case 'debtors':
                ReportComponent = DebtorsReport;
                title = 'Debtors Report';
                break;
        }

        if (ReportComponent) {
            const ReactDOMServer = (await import('react-dom/server')).default;
            const reportHTML = ReactDOMServer.renderToString(
            <LanguageProvider initialLanguage={language}>
                <ReportComponent data={activeReportData} />
            </LanguageProvider>
            );
            await printReport(reportHTML, title);
        }
    };

    const renderActiveReport = (): ReactNode => {
        if (!activeReportData) return null;

        switch(activeReport) {
            case 'summary': return <SummaryReport data={activeReportData} />;
            case 'stock': return <StockReport data={activeReportData} />;
            case 'creditors': return <CreditorsReport data={activeReportData} />;
            case 'debtors': return <DebtorsReport data={activeReportData} />;
            default: return null;
        }
    }
    
    const getReportTitle = (): string => {
        switch(activeReport) {
            case 'summary': return 'Summary Report';
            case 'stock': return 'Stock Report';
            case 'creditors': return 'Creditors Report';
            case 'debtors': return 'Debtors Report';
            default: return 'Report';
        }
    }
    
    const getReportDescription = (): string => {
        if (activeReport === 'summary' && activeReportData?.dateRange) {
             return `Report for the period of ${new Date(activeReportData.dateRange.from).toLocaleDateString()} to ${new Date(activeReportData.dateRange.to).toLocaleDateString()}`;
        }
        return `Generated on ${new Date().toLocaleDateString()}`;
    }


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
                 {activeReportData && (
                     <Card>
                         <CardHeader className="flex flex-row items-center justify-between no-print">
                            <div>
                                <CardTitle>{getReportTitle()}</CardTitle>
                                <CardDescription>{getReportDescription()}</CardDescription>
                            </div>
                            <Button onClick={handlePrintActiveReport} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
                         </CardHeader>
                         <CardContent>
                            {renderActiveReport()}
                         </CardContent>
                     </Card>
                 )}
            </div>

            <div className="flex flex-col w-96 flex-shrink-0 gap-6">
                <Card className="no-print">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Report Generation</CardTitle>
                            <CardDescription>Select a date range for the financial summary report.</CardDescription>
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
                 <Card className="no-print">
                    <CardHeader>
                        <CardTitle>Other Reports</CardTitle>
                        <CardDescription>Select a specific report to view and print.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                         <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport(undefined, 'stock')} disabled={isPending}>
                            <Package className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'stock' ? 'Generating...' : 'View Stock Report'}
                        </Button>
                         <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport(undefined, 'creditors')} disabled={isPending}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'creditors' ? 'Generating...' : 'View Creditors Report'}
                        </Button>
                         <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport(undefined, 'debtors')} disabled={isPending}>
                            <HandCoins className="mr-2 h-4 w-4" />
                           {isPending && activeReport === 'debtors' ? 'Generating...' : 'View Debtors Report'}
                        </Button>
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
