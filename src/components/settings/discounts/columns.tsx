// src/components/settings/discounts/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { DiscountSet } from "@prisma/client"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface CellActionsProps {
  campaign: DiscountSet;
  onEdit: (campaign: DiscountSet) => void;
  onDelete: (campaignId: string) => void;
}

const CellActions = ({ campaign, onEdit, onDelete }: CellActionsProps) => {
    return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                    Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(campaign.id)} className="text-red-500">
                    Delete Campaign
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (campaign: DiscountSet) => void,
  onDelete: (campaignId: string) => void
): ColumnDef<DiscountSet>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue("description")}</div>
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("isActive");
            return <Badge variant={isActive ? "secondary" : "destructive"}>{isActive ? "Active" : "Inactive"}</Badge>
        }
    },
    {
        accessorKey: "isOneTimePerTransaction",
        header: "One-Time",
        cell: ({ row }) => row.getValue("isOneTimePerTransaction") ? "Yes" : "No"
    },
    {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => format(new Date(row.getValue("updatedAt")), "PP")
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions campaign={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
