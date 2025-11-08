// src/components/reports/ReportsClientPage.tsx
'use client';

import { useState, useTransition } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, startOfYear, startOfWeek } from 'date-fns';
import { getSummaryReportDataAction, type SummaryReportData } from '@/lib/actions/report.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from './DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer, RotateCcw } from 'lucide-react';
import { SummaryReport } from './SummaryReport';

const receiptStyles = `
  @page { size: auto; margin: 10px; }
  body { font-family: monospace; color: black; background-color: white; margin: 0; padding: 0; }
  .thermal-receipt-container { background-color: white; color: black; font-family: monospace; font-size: 12px; width: 100%; max-width: 800px; margin: 0 auto; padding: 15px; }
  .text-center { text-align: center; }
  h1 { font-size: 1.5rem; font-weight: bold; }
  h2 { font-size: 1.2rem; font-weight: bold; margin-top: 1rem; border-bottom: 1px dashed black; padding-bottom: 0.25rem; margin-bottom: 0.5rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .flex-between { display: flex; justify-content: space-between; }
  .font-bold { font-weight: bold; }
  .text-green-600 { color: #059669; }
  .text-red-600 { color: #E53E3E; }
  .text-blue-600 { color: #2563EB; }
`;

export function ReportsClientPage() {
    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(today, 7),
        to: today,
    });
    const [reportData, setReportData] = useState<SummaryReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleGenerateReport = () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            setError("Please select a valid date range.");
            return;
        }

        startTransition(async () => {
            setError(null);
            setReportData(null);
            const result = await getSummaryReportDataAction({ from: dateRange.from!, to: dateRange.to! });
            if (result.success) {
                setReportData(result.data!);
            } else {
                setError(result.error!);
            }
        });
    };
    
    const handlePrint = async () => {
        if (!reportData) return;

        const ReactDOMServer = (await import('react-dom/server')).default;
        const reportHTML = ReactDOMServer.renderToString(
            <SummaryReport data={reportData} />
        );

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <html><head><title>Summary Report</title><style>${receiptStyles}</style></head>
                <body>${reportHTML}</body></html>
            `);
            iframeDoc.close();
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Report Generation</CardTitle>
                    <CardDescription>Select a date range and generate your financial summary report.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
                     <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDateRange({ from: today, to: today })}>Today</Button>
                        <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfWeek(today), to: today })}>This Week</Button>
                        <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfMonth(today), to: today })}>This Month</Button>
                        <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfYear(today), to: today })}>This Year</Button>
                     </div>
                     <Button onClick={handleGenerateReport} disabled={isPending}>
                        {isPending ? "Generating..." : "Generate Report"}
                    </Button>
                </CardContent>
            </Card>

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
                         <CardHeader className="flex flex-row items-center justify-between">
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
        </div>
    );
}
