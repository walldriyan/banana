// src/app/dashboard/products/data-table.tsx
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { PlusCircle, ArchiveX } from "lucide-react"
import { AuthorizationGuard } from "@/components/auth/AuthorizationGuard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  onAddProduct: () => void; // Callback to open the add master product drawer
  hideZeroStock: boolean;
  onHideZeroStockChange: (checked: boolean) => void;
}

export function ProductsDataTable<TData, TValue>({
  columns,
  data,
  onAddProduct,
  hideZeroStock,
  onHideZeroStockChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState({})
    const [grouping, setGrouping] = useState<string[]>(['product.name']) // Group by master product name
    const [expanded, setExpanded] = useState<ExpandedState>({})


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    getGroupedRowModel: getGroupedRowModel(),
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    autoResetAll: false, // Prevents table from resetting on data change
    state: {
      sorting,
      columnFilters,
      rowSelection,
      grouping,
      expanded,
    },
  })

  return (
    <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between py-4 gap-4 flex-shrink-0">
            <Input
                placeholder="Filter by product name..."
                value={(table.getColumn("product.name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("product.name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="hide-zero-stock" 
                        checked={hideZeroStock}
                        onCheckedChange={onHideZeroStockChange}
                    />
                    <Label htmlFor="hide-zero-stock" className="whitespace-nowrap">
                        <ArchiveX className="inline-block mr-2 h-4 w-4" />
                        Hide Zero Stock
                    </Label>
                </div>
                <AuthorizationGuard permissionKey="products.create">
                    <Button onClick={onAddProduct}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Master Product
                    </Button>
                </AuthorizationGuard>
            </div>
        </div>
        <div className="rounded-md border flex-grow overflow-y-auto">
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                                )}
                        </TableHead>
                        )
                    })}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ paddingLeft: `${row.depth * 1.5 + (cell.getIsGrouped() ? 0 : 1.5)}rem` }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
         <div className="flex items-center justify-end space-x-2 py-4 flex-shrink-0">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                >
                Next
            </Button>
        </div>
        <div className="text-sm text-muted-foreground flex-shrink-0">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
    </div>
  )
}
