// src/lib/actions/report.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from 'date-fns';

interface DateRange {
    from: Date;
    to: Date;
}

export interface SummaryReportData {
    dateRange: { from: string; to: string };
    sales: {
        totalRevenue: number;
        totalTransactions: number;
        totalDiscount: number;
    };
    purchases: {
        totalCost: number;
        totalGrns: number;
    };
    income: {
        totalIncome: number;
        salesIncome: number;
        otherIncome: number;
    };
    expenses: {
        totalExpenses: number;
        purchaseExpenses: number;
        otherExpenses: number;
    };
    profit: {
        netProfit: number;
        grossProfit: number;
    };
    balanceSheet: {
        assets: {
            debtors: number; // Money owed by customers
        };
        liabilities: {
            creditors: number; // Money owed to suppliers
        };
    };
}


export async function getSummaryReportDataAction(dateRange: DateRange): Promise<{ success: boolean; data?: SummaryReportData; error?: string }> {
    try {
        const { from, to } = dateRange;
        
        const adjustedTo = endOfDay(to);

        const [salesData, purchaseData, financialTxData, debtorsData, creditorsData] = await Promise.all([
            // Sales Data
            prisma.transaction.aggregate({
                where: {
                    status: 'completed',
                    transactionDate: { gte: from, lte: adjustedTo },
                },
                _sum: { finalTotal: true, totalDiscountAmount: true },
                _count: { id: true },
            }),
            // Purchase Data
            prisma.goodsReceivedNote.aggregate({
                where: { grnDate: { gte: from, lte: adjustedTo } },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            // Other Income/Expenses
            prisma.financialTransaction.groupBy({
                by: ['type'],
                where: { date: { gte: from, lte: adjustedTo } },
                _sum: { amount: true },
            }),
            // Debtors (Outstanding customer payments)
            prisma.transaction.aggregate({
                where: { paymentStatus: { in: ['pending', 'partial'] } },
                _sum: { finalTotal: true },
            }),
             // Creditors (Outstanding supplier payments)
            prisma.goodsReceivedNote.aggregate({
                where: { paymentStatus: { in: ['pending', 'partial'] } },
                _sum: { totalAmount: true, paidAmount: true },
            }),
        ]);
        
        const otherIncome = financialTxData.find(d => d.type === 'INCOME')?._sum.amount || 0;
        const otherExpenses = financialTxData.find(d => d.type === 'EXPENSE')?._sum.amount || 0;

        const totalRevenue = salesData._sum.finalTotal || 0;
        const totalPurchaseCost = purchaseData._sum.totalAmount || 0;

        // Gross Profit = Sales Revenue - Cost of Goods (approximated by purchases in the period)
        const grossProfit = totalRevenue - totalPurchaseCost;

        // Net Profit = Gross Profit + Other Income - Other Expenses
        const netProfit = grossProfit + otherIncome - otherExpenses;
        
        const totalCreditors = (creditorsData._sum.totalAmount || 0) - (creditorsData._sum.paidAmount || 0);

        const reportData: SummaryReportData = {
            dateRange: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            sales: {
                totalRevenue: totalRevenue,
                totalTransactions: salesData._count.id || 0,
                totalDiscount: salesData._sum.totalDiscountAmount || 0,
            },
            purchases: {
                totalCost: totalPurchaseCost,
                totalGrns: purchaseData._count.id || 0,
            },
            income: {
                totalIncome: totalRevenue + otherIncome,
                salesIncome: totalRevenue,
                otherIncome: otherIncome,
            },
            expenses: {
                totalExpenses: totalPurchaseCost + otherExpenses,
                purchaseExpenses: totalPurchaseCost,
                otherExpenses: otherExpenses,
            },
            profit: {
                netProfit: netProfit,
                grossProfit: grossProfit,
            },
            balanceSheet: {
                assets: {
                    debtors: debtorsData._sum.finalTotal || 0,
                },
                liabilities: {
                    creditors: totalCreditors,
                },
            },
        };

        return { success: true, data: reportData };

    } catch (error) {
        console.error('[getSummaryReportDataAction] Error:', error);
        return { success: false, error: 'Failed to generate summary report data.' };
    }
}
