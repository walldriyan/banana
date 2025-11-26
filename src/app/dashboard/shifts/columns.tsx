// src/app/dashboard/shifts/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Shift } from "@prisma/client"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance } from "date-fns"

const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "N/A";
    return `Rs. ${amount.toFixed(2)}`;
}

export const getColumns = (): ColumnDef<Shift>[] => [
    {
        accessorKey: "userName",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              User
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("userName")}</div>
    },
    {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }) => format(new Date(row.getValue("startTime")), "PPp")
    },
    {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ row }) => {
            const endTime = row.getValue("endTime") as string | null;
            return endTime ? format(new Date(endTime), "PPp") : <Badge variant="secondary">Active</Badge>;
        }
    },
     {
        id: "duration",
        header: "Duration",
        cell: ({ row }) => {
             const start = new Date(row.original.startTime);
             const end = row.original.endTime ? new Date(row.original.endTime) : new Date();
             return formatDistance(end, start, { includeSeconds: true });
        }
    },
    {
        accessorKey: "openingBalance",
        header: () => <div className="text-right">Opening Balance</div>,
        cell: ({ row }) => formatCurrency(row.getValue("openingBalance"))
    },
    {
        accessorKey: "closingBalance",
        header: () => <div className="text-right">Closing Balance</div>,
        cell: ({ row }) => formatCurrency(row.getValue("closingBalance"))
    },
    {
        accessorKey: "difference",
        header: () => <div className="text-right">Difference</div>,
        cell: ({ row }) => {
            const diff = row.getValue("difference") as number | null;
            if (diff === null) return "N/A";
            const color = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "";
            return <div className={`text-right font-bold ${color}`}>{formatCurrency(diff)}</div>
        },
    },
]
