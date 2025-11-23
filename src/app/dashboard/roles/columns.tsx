// src/app/dashboard/roles/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Role, Permission } from "@prisma/client"
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

type RoleWithRelations = Role & { permissions: Permission[], _count: { users: number } };

interface CellActionsProps {
  role: RoleWithRelations;
  onEdit: (role: RoleWithRelations) => void;
  onDelete: (roleId: string) => void;
}

const CellActions = ({ role, onEdit, onDelete }: CellActionsProps) => {
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
                 <AuthorizationGuard permissionKey="roles.manage">
                    <DropdownMenuItem onClick={() => onEdit(role)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(role.id)} className="text-red-500">Delete</DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (role: RoleWithRelations) => void,
  onDelete: (roleId: string) => void
): ColumnDef<RoleWithRelations>[] => [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "_count.users",
        header: "Users",
    },
    {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
            const permissions = row.original.permissions;
            if (!permissions || permissions.length === 0) {
                return <Badge variant="destructive">No Permissions</Badge>
            }
            if (permissions.find(p => p.key === 'access_all')) {
                return <Badge>All Permissions</Badge>
            }
            return <Badge variant="secondary">{permissions.length} Permissions</Badge>
        }
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <p className="truncate max-w-sm">{row.getValue("description")}</p>
    },
    {
        id: "actions",
        cell: ({ row }) => <CellActions role={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
