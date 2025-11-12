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
        totalRefunds: number; // New field
    };
    purchases: {
        totalCost: number;
        totalGrns: number;
    };
    inventory: { // New section
        lostAndDamageValue: number;
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
        
        const adjustedFrom = startOfDay(from);
        const adjustedTo = endOfDay(to);

        const [
            salesData, 
            purchaseData, 
            financialTxData, 
            debtorsData, 
            creditorsData,
            lostAndDamageData,
            refundData
        ] = await Promise.all([
            // Sales Data
            prisma.transaction.aggregate({
                where: {
                    status: 'completed',
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                _sum: { finalTotal: true, totalDiscountAmount: true },
                _count: { id: true },
            }),
            // Purchase Data
            prisma.goodsReceivedNote.aggregate({
                where: { grnDate: { gte: adjustedFrom, lte: adjustedTo } },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            // Other Income/Expenses
            prisma.financialTransaction.groupBy({
                by: ['type'],
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
                _sum: { amount: true },
            }),
            // Debtors (Outstanding customer payments for transactions within the date range)
            prisma.transaction.aggregate({
                where: { 
                    paymentStatus: { in: ['pending', 'partial'] },
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                _sum: { finalTotal: true, payment: { _sum: { paidAmount: true } } },
            }),
             // Creditors (Outstanding supplier payments for GRNs within the date range)
            prisma.goodsReceivedNote.aggregate({
                where: { 
                    paymentStatus: { in: ['pending', 'partial'] },
                    grnDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                _sum: { totalAmount: true, paidAmount: true },
            }),
            // Lost & Damage Data
            prisma.lostAndDamage.findMany({
                where: { date: { gte: adjustedFrom, lte: adjustedTo } },
                include: { productBatch: { select: { costPrice: true }}}
            }),
            // Refund Data - we sum `finalTotal` which is what customer *kept*. The refund amount is the difference.
            prisma.transaction.findMany({
                 where: {
                    status: 'refund',
                    transactionDate: { gte: adjustedFrom, lte: adjustedTo },
                },
                include: {
                    originalTransaction: {
                        select: { finalTotal: true }
                    }
                }
            })
        ]);
        
        const otherIncome = financialTxData.find(d => d.type === 'INCOME')?._sum.amount || 0;
        const otherExpenses = financialTxData.find(d => d.type === 'EXPENSE')?._sum.amount || 0;

        const grossSalesRevenue = salesData._sum.finalTotal || 0;
        const totalPurchaseCost = purchaseData._sum.totalAmount || 0;
        
        const lostAndDamageValue = lostAndDamageData.reduce((sum, record) => {
            return sum + (record.quantity * (record.productBatch?.costPrice || 0));
        }, 0);
        
        // Calculate total value of refunds issued
        const totalRefundsValue = refundData.reduce((sum, tx) => {
            const originalTotal = tx.originalTransaction?.finalTotal || 0;
            const keptTotal = tx.finalTotal; // finalTotal of a refund tx is the value of items kept
            return sum + (originalTotal - keptTotal);
        }, 0);

        // Net Revenue is sales minus refunds
        const netSalesRevenue = grossSalesRevenue - totalRefundsValue;

        // Gross Profit = Net Sales Revenue - Cost of Goods (approximated by purchases in the period)
        const grossProfit = netSalesRevenue - totalPurchaseCost;

        // Net Profit = Gross Profit + Other Income - Other Expenses - Lost&Damage - Discounts
        const totalDiscountsGiven = salesData._sum.totalDiscountAmount || 0;
        const netProfit = grossProfit + otherIncome - otherExpenses - lostAndDamageValue;
        
        const totalDebtors = (debtorsData._sum.finalTotal || 0) - (debtorsData._sum.payment?._sum?.paidAmount || 0);
        const totalCreditors = (creditorsData._sum.totalAmount || 0) - (creditorsData._sum.paidAmount || 0);

        const reportData: SummaryReportData = {
            dateRange: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            sales: {
                totalRevenue: grossSalesRevenue,
                totalTransactions: salesData._count.id || 0,
                totalDiscount: totalDiscountsGiven,
                totalRefunds: totalRefundsValue,
            },
            purchases: {
                totalCost: totalPurchaseCost,
                totalGrns: purchaseData._count.id || 0,
            },
            inventory: {
                lostAndDamageValue: lostAndDamageValue,
            },
            income: {
                totalIncome: grossSalesRevenue + otherIncome,
                salesIncome: grossSalesRevenue,
                otherIncome: otherIncome,
            },
            expenses: {
                totalExpenses: totalPurchaseCost + otherExpenses + totalDiscountsGiven + lostAndDamageValue + totalRefundsValue,
                purchaseExpenses: totalPurchaseCost,
                otherExpenses: otherExpenses,
            },
            profit: {
                netProfit: netProfit,
                grossProfit: grossProfit,
            },
            balanceSheet: {
                assets: {
                    debtors: totalDebtors,
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


export async function getStockReportDataAction() {
    try {
        const batches = await prisma.productBatch.findMany({
            where: { stock: { gt: 0 }},
            include: { product: true },
            orderBy: [{ product: { name: 'asc' } }, { addedDate: 'desc' }],
        });

        // Convert Decimal `stock` to number for easier use in the report
        const serializedBatches = batches.map(batch => ({
            ...batch,
            stock: Number(batch.stock),
        }));

        return { success: true, data: serializedBatches };
    } catch (error) {
        console.error("Error fetching stock report data:", error);
        return { success: false, error: "Failed to fetch stock report data." };
    }
}

export async function getCreditorsReportDataAction() {
  try {
    const creditorGrns = await prisma.goodsReceivedNote.findMany({
      where: { paymentStatus: { in: ['pending', 'partial'] } },
      include: {
        supplier: true,
        payments: { select: { amount: true } }
      },
      orderBy: { grnDate: 'asc' },
    });

    const grnsWithPaidAmount = creditorGrns.map(grn => ({
      ...grn,
      totalPaid: grn.payments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return { success: true, data: grnsWithPaidAmount };
  } catch (error) {
    console.error('[getCreditorsReportDataAction] Error:', error);
    return { success: false, error: 'Failed to fetch creditors report data.' };
  }
}

export async function getDebtorsReportDataAction() {
  try {
    const debtorTransactions = await prisma.transaction.findMany({
      where: { paymentStatus: { in: ['pending', 'partial'] } },
      include: {
        customer: true,
        salePayments: { select: { amount: true } }
      },
      orderBy: { transactionDate: 'asc' },
    });

    const transactionsWithPaidAmount = debtorTransactions.map(tx => ({
      ...tx,
      totalPaid: tx.salePayments.reduce((sum, p) => sum + p.amount, 0),
    }));

    return { success: true, data: transactionsWithPaidAmount };
  } catch (error) {
    console.error('[getDebtorsReportDataAction] Error:', error);
    return { success: false, error: 'Failed to fetch debtors report data.' };
  }
}
