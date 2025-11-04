// src/app/dashboard/products/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { ProductBatch } from "@/types"
import { MoreHorizontal, ArrowUpDown, ChevronsRight, ChevronsDownUp, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Badge } from "@/components/ui/badge"

// Define a new interface for the component props
interface CellActionsProps {
  batch: ProductBatch;
  onEdit: (batch: ProductBatch) => void;
  onDelete: (batchId: string) => void;
  onViewDetails: (batch: ProductBatch) => void;
}

const CellActions = ({ batch, onEdit, onDelete, onViewDetails }: CellActionsProps) => {
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
                <DropdownMenuItem onClick={() => onViewDetails(batch)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(batch.id)}>
                    Copy Batch ID
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <AuthorizationGuard permissionKey="products.update">
                    <DropdownMenuItem onClick={() => onEdit(batch)}>
                      Edit Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
                 <AuthorizationGuard permissionKey="products.delete">
                    <DropdownMenuItem onClick={() => onDelete(batch.id)} className="text-red-500">
                        Delete Batch
                    </DropdownMenuItem>
                </AuthorizationGuard>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// Update the type definition for the columns factory
export const getColumns = (
  onEdit: (batch: ProductBatch) => void,
  onDelete: (batchId: string) => void,
  onViewDetails: (batch: ProductBatch) => void,
): ColumnDef<ProductBatch>[] => [
    {
        id: "product.name", // Give a stable ID
        accessorFn: (row) => row.product.name, // Use accessor function
        header: "Name",
        cell: ({ row, getValue }) => {
            const isGrouped = row.getIsGrouped();
            const value = getValue() as string;

            if (isGrouped) {
                return (
                <div className="flex items-center gap-2">
                    <Button
                    variant="ghost"
                    size="icon"
                    onClick={row.getToggleExpandedHandler()}
                    className="h-6 w-6"
                    >
                    {row.getIsExpanded() ? (
                        <ChevronsDownUp className="h-4 w-4" />
                    ) : (
                        <ChevronsRight className="h-4 w-4" />
                    )}
                    </Button>
                    <span className="font-bold">{value} ({row.subRows.length})</span>
                </div>
                );
            }
            return <div className="font-bold">{value}</div>;
        },
    },
     {
        accessorKey: "batchNumber",
        header: "Batch Number",
        cell: ({ row }) => {
            return <Badge variant="secondary">{row.getValue("batchNumber")}</Badge>
        }
    },
    {
        accessorKey: "sellingPrice",
        header: () => <div className="text-right">Selling Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("sellingPrice"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "LKR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
            const batch = row.original;
            const stock = row.getValue("stock") as number;
            const units = typeof batch.product.units === 'string' ? JSON.parse(batch.product.units) : batch.product.units;
            return <div className="text-right">{stock} {units.baseUnit}</div>
        }
    },
     {
        accessorKey: "product.category",
        header: "Category",
         cell: info => info.row.original.product.category,
    },
     {
        accessorKey: "product.brand",
        header: "Brand",
         cell: info => info.row.original.product.brand,
    },
    {
        accessorKey: "product.isActive",
        header: "Status",
        cell: ({ row }) => {
            return row.original.product.isActive ? "Active" : "Inactive";
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            if (row.getIsGrouped()) {
                return null; // No actions on grouped rows
            }
            return <CellActions batch={row.original} onEdit={onEdit} onDelete={onDelete} onViewDetails={onViewDetails} />
        },
    },
]
