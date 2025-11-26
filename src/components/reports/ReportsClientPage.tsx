// src/components/reports/ReportsClientPage.tsx
'use client';

import { useState, useTransition, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, startOfYear, startOfWeek, isSameDay } from 'date-fns';
import {
    getSummaryReportDataAction, type SummaryReportData,
    getStockReportDataAction,
    getCreditorsReportDataAction,
    getDebtorsReportDataAction,
    getTransactionsReportDataAction,
    getRefundsReportDataAction
} from '@/lib/actions/report.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from './DateRangePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Printer, Package, CreditCard, HandCoins, FileText, RefreshCw } from 'lucide-react';
import { SummaryReport } from './SummaryReport';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '../LanguageToggle';
import { StockReport } from './StockReport';
import { CreditorsReport } from './CreditorsReport';
import { DebtorsReport } from './DebtorsReport';
import { useToast } from '@/hooks/use-toast';
import { TransactionsReport } from './TransactionsReport';
import { RefundsReport } from './RefundsReport';


const reportPrintStyles = `
  @media print {
    /* Hide everything by default */
    body * {
      visibility: hidden;
    }
    
    /* Only show the report area */
    #report-print-area, #report-print-area * {
      visibility: visible;
    }
    
    /* Position the report at the top-left */
    #report-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 20px; /* Add some padding for the paper */
      background-color: white;
      color: black;
    }

    /* Ensure no dark mode colors in print */
    .dark #report-print-area {
        background-color: white !important;
        color: black !important;
    }

    /* Hide specific no-print elements even inside the area if any */
    .no-print {
      display: none !important;
    }
    
    /* Reset page margins */
    @page {
      size: auto;
      margin: 0mm;
    }
  }
`;

type ReportType = 'summary' | 'stock' | 'creditors' | 'debtors' | 'transactions' | 'refunds';

const ReportGenerator = () => {
    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: today, to: today });
    const [activePreset, setActivePreset] = useState<string | null>('today');

    const [activeReport, setActiveReport] = useState<ReportType>('summary');
    const [activeReportData, setActiveReportData] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { language } = useLanguage();
    const { toast } = useToast();

    const handleGenerateReport = useCallback((type: ReportType, range?: DateRange) => {
        if ((type === 'summary' || type === 'transactions' || type === 'refunds' || type === 'debtors' || type === 'creditors') && (!range || !range.from || !range.to)) {
            toast({
                variant: 'destructive',
                title: "Date Range Required",
                description: "Please select a valid date range to generate this report.",
            });
            return;
        }

        startTransition(async () => {
            setError(null);
            setActiveReportData(null);
            setActiveReport(type);

            let result: { success: boolean; data?: any; error?: string };

            // Create a safe range object where from and to are guaranteed to be Dates
            // We know they exist because of the validation check above
            const safeRange = range && range.from && range.to ? { from: range.from, to: range.to } : undefined;

            switch (type) {
                case 'summary':
                    result = await getSummaryReportDataAction(safeRange as any);
                    break;
                case 'stock':
                    result = await getStockReportDataAction();
                    break;
                case 'creditors':
                    result = await getCreditorsReportDataAction(safeRange as any);
                    break;
                case 'debtors':
                    result = await getDebtorsReportDataAction(safeRange as any);
                    break;
                case 'transactions':
                    result = await getTransactionsReportDataAction(safeRange as any);
                    break;
                case 'refunds':
                    result = await getRefundsReportDataAction(safeRange as any);
                    break;
                default:
                    result = { success: false, error: 'Invalid report type' };
            }

            if (result.success) {
                setActiveReportData(result.data!);
            } else {
                setError(result.error!);
                setActiveReport('summary'); // Fallback to summary view on error
            }
        });
    }, [toast]);

    const dateRangeString = useMemo(() => {
        return dateRange ? `${dateRange.from?.toISOString()}-${dateRange.to?.toISOString()}` : '';
    }, [dateRange]);

    useEffect(() => {
        if (dateRange?.from && dateRange.to) {
            handleGenerateReport(activeReport, dateRange);

            const from = dateRange.from;
            const to = dateRange.to;
            if (isSameDay(from, today) && isSameDay(to, today)) setActivePreset('today');
            else if (isSameDay(from, startOfWeek(today)) && isSameDay(to, today)) setActivePreset('week');
            else if (isSameDay(from, startOfMonth(today)) && isSameDay(to, today)) setActivePreset('month');
            else if (isSameDay(from, startOfYear(today)) && isSameDay(to, today)) setActivePreset('year');
            else setActivePreset(null);
        }
    }, [dateRangeString, activeReport, handleGenerateReport]);


    const handlePresetClick = (range: DateRange, presetName: string) => {
        setActivePreset(presetName);
        setDateRange(range);
    };

    // Simple and robust printing using window.print()
    const handlePrintActiveReport = () => {
        if (!activeReportData) {
            toast({ variant: 'destructive', title: 'Error', description: 'No report data to print.' });
            return;
        }
        window.print();
    };

    const renderActiveReport = (): ReactNode => {
        if (!activeReportData) return null;

        switch (activeReport) {
            case 'summary': return <SummaryReport data={activeReportData} />;
            case 'stock': return <StockReport data={activeReportData.data} />;
            case 'creditors': return <CreditorsReport data={activeReportData} />;
            case 'debtors': return <DebtorsReport data={activeReportData} />;
            case 'transactions': return <TransactionsReport data={activeReportData} />;
            case 'refunds': return <RefundsReport data={activeReportData} />;
            default: return null;
        }
    }

    const getReportTitle = (): string => {
        switch (activeReport) {
            case 'summary': return 'Summary Report';
            case 'stock': return 'Stock Report';
            case 'creditors': return 'Creditors Report';
            case 'debtors': return 'Debtors Report';
            case 'transactions': return 'Transactions Report';
            case 'refunds': return 'Refunds Report';
            default: return 'Report';
        }
    }

    const getReportDescription = (): string => {
        const dataForDesc = activeReportData?.dateRange;
        if ((['summary', 'transactions', 'refunds', 'debtors', 'creditors'].includes(activeReport)) && dataForDesc) {
            return `Report for the period of ${new Date(dataForDesc.from).toLocaleDateString()} to ${new Date(dataForDesc.to).toLocaleDateString()}`;
        }
        return `Generated on ${new Date().toLocaleDateString()}`;
    }


    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            <style>{reportPrintStyles}</style>
            <div className="flex-1">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                        <div>
                            <CardTitle>{getReportTitle()}</CardTitle>
                            {activeReportData && <CardDescription>{getReportDescription()}</CardDescription>}
                        </div>
                        <div className="flex items-center gap-4 no-print">
                            <LanguageToggle />
                            <Button onClick={handlePrintActiveReport} variant="outline" disabled={!activeReportData || isPending}>
                                <Printer className="mr-2 h-4 w-4" /> Print Report
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto">
                        {isPending && (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {activeReportData && !isPending && (
                            <div id="report-print-area">
                                {renderActiveReport()}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col w-full md:w-96 flex-shrink-0 gap-6 no-print">
                <Card>
                    <CardHeader>
                        <CardTitle>Report Generation</CardTitle>
                        <CardDescription>Select a date range to generate reports.</CardDescription>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Other Reports</CardTitle>
                        <CardDescription>Select a specific report to view and print.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('summary', dateRange!)} disabled={isPending}>
                            <FileText className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'summary' ? 'Generating...' : 'View Summary Report'}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('stock', dateRange!)} disabled={isPending}>
                            <Package className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'stock' ? 'Generating...' : 'View Stock Report'}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('creditors', dateRange!)} disabled={isPending}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'creditors' ? 'Generating...' : 'View Creditors Report'}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('debtors', dateRange!)} disabled={isPending}>
                            <HandCoins className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'debtors' ? 'Generating...' : 'View Debtors Report'}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('transactions', dateRange!)} disabled={isPending}>
                            <FileText className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'transactions' ? 'Generating...' : 'View Transactions Report'}
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleGenerateReport('refunds', dateRange!)} disabled={isPending}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {isPending && activeReport === 'refunds' ? 'Generating...' : 'View Refunds Report'}
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
