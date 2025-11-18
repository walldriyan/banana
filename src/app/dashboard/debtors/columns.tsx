// src/app/dashboard/debtors/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { format } from "date-fns";
import type { DebtorTransaction } from "./DebtorsClientPage"
import { Badge } from "@/components/ui/badge"

interface CellActionsProps {
  transaction: DebtorTransaction;
  onManagePayments: (transaction: DebtorTransaction) => void;
}

const CellActions = ({ transaction, onManagePayments }: CellActionsProps) => {
    return (
        <AuthorizationGuard permissionKey="debtors.manage">
             <Button onClick={() => onManagePayments(transaction)}>
                Manage Payments
             </Button>
        </AuthorizationGuard>
    )
}

export const getColumns = (
  onManagePayments: (transaction: DebtorTransaction) => void,
): ColumnDef<DebtorTransaction>[] => [
    {
        accessorKey: "id",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Transaction ID
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium truncate max-w-[120px]">{row.getValue("id")}</div>
    },
    {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => format(new Date(row.getValue("transactionDate")), "PPP")
    },
    {
        accessorKey: "customer.name",
        header: "Customer",
    },
    {
        accessorKey: "finalTotal",
        header: () => <div className="text-right">Total Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("finalTotal"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
     {
        accessorKey: "totalPaid",
        header: () => <div className="text-right">Total Paid</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalPaid"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(amount)
            return <div className="text-right font-medium text-green-600">{formatted}</div>
        },
    },
    {
        id: "balance",
        header: () => <div className="text-right">Balance Due</div>,
        cell: ({ row }) => {
            const total = row.original.finalTotal;
            const paid = row.original.totalPaid;
            const balance = total - paid;
             const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(balance)
            return <div className="text-right font-bold text-red-600">{formatted}</div>
        },
    },
    {
        accessorKey: "paymentStatus",
        header: "Payment Status",
         cell: ({ row }) => {
            const status = row.getValue("paymentStatus") as string;
            return <Badge 
                variant={status === 'pending' ? 'destructive' : 'secondary'}
                className="capitalize"
            >
                {status}
            </Badge>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions transaction={row.original} onManagePayments={onManagePayments} />,
    },
]
