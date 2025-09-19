// src/app/dashboard/credit/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { format } from "date-fns";
import type { CreditorGrn } from "./CreditClientPage"
import { Badge } from "@/components/ui/badge"

interface CellActionsProps {
  grn: CreditorGrn;
  onManagePayments: (grn: CreditorGrn) => void;
}

const CellActions = ({ grn, onManagePayments }: CellActionsProps) => {
    return (
        <AuthorizationGuard permissionKey="credit.manage">
             <Button onClick={() => onManagePayments(grn)}>
                Manage Payments
             </Button>
        </AuthorizationGuard>
    )
}

export const getColumns = (
  onManagePayments: (grn: CreditorGrn) => void,
): ColumnDef<CreditorGrn>[] => [
    {
        accessorKey: "grnNumber",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              GRN Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("grnNumber")}</div>
    },
    {
        accessorKey: "grnDate",
        header: "Date",
        cell: ({ row }) => format(new Date(row.getValue("grnDate")), "PPP")
    },
    {
        accessorKey: "supplier.name",
        header: "Supplier",
    },
    {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total Amount</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"))
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
            const total = row.original.totalAmount;
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
        cell: ({ row }) => <CellActions grn={row.original} onManagePayments={onManagePayments} />,
    },
]
