// src/app/dashboard/company/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Company } from "@prisma/client"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Badge } from "@/components/ui/badge"

interface CellActionsProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (companyId: string) => void;
}

const CellActions = ({ company, onEdit, onDelete }: CellActionsProps) => {
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
                 <AuthorizationGuard permissionKey="company.manage">
                    <DropdownMenuItem onClick={() => onEdit(company)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(company.id)} className="text-red-500">
                        Delete
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (company: Company) => void,
  onDelete: (companyId: string) => void
): ColumnDef<Company>[] => [
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
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "registrationNumber",
        header: "Reg. Number",
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
        id: "actions",
        cell: ({ row }) => <CellActions company={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
