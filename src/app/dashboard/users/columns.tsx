// src/app/dashboard/users/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { User, Role } from "@prisma/client"
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

type UserWithRole = User & { role: Role };

interface CellActionsProps {
  user: UserWithRole;
  onEdit: (user: UserWithRole) => void;
  onDelete: (userId: string) => void;
}

const CellActions = ({ user, onEdit, onDelete }: CellActionsProps) => {
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
                 <AuthorizationGuard permissionKey="users.manage">
                    <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-red-500">Delete</DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const getColumns = (
  onEdit: (user: UserWithRole) => void,
  onDelete: (userId: string) => void
): ColumnDef<UserWithRole>[] => [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "username",
        header: "Username",
    },
    {
        accessorKey: "role.name",
        header: "Role",
        cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.role.name}</Badge>
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
        cell: ({ row }) => <CellActions user={row.original} onEdit={onEdit} onDelete={onDelete} />,
    },
]
