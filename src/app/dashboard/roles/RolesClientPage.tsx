// src/app/dashboard/roles/RolesClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Role, Permission } from '@prisma/client';
import { getRolesAction, deleteRoleAction, getPermissionsAction } from '@/lib/actions/role.actions';
import { RolesDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddRoleForm } from '@/components/roles/AddRoleForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RoleWithRelations = Role & { permissions: Permission[], _count: { users: number } };

export function RolesClientPage() {
  const [roles, setRoles] = useState<RoleWithRelations[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [rolesResult, permissionsResult] = await Promise.all([
        getRolesAction(),
        getPermissionsAction()
    ]);
    if (rolesResult.success && rolesResult.data) {
      setRoles(rolesResult.data as RoleWithRelations[]);
    } else {
      toast({ variant: 'destructive', title: 'Error fetching roles', description: rolesResult.error });
    }
     if (permissionsResult.success && permissionsResult.data) {
      setPermissions(permissionsResult.data);
    } else {
      toast({ variant: 'destructive', title: 'Error fetching permissions', description: permissionsResult.error });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchData();
  };

  const openAddRoleDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Role',
      content: <AddRoleForm permissions={permissions} onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-2xl'
    });
  };

  const openEditRoleDrawer = useCallback((role: RoleWithRelations) => {
    drawer.openDrawer({
        title: 'Edit Role',
        description: `Editing details for ${role.name}`,
        content: <AddRoleForm role={role} permissions={permissions} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-2xl'
    });
  }, [drawer, permissions]);

  const handleDeleteRequest = (roleId: string) => {
    setRoleToDelete(roleId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    
    const result = await deleteRoleAction(roleToDelete);

    if (result.success) {
        toast({ title: "Role Deleted", description: "The role has been deleted." });
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditRoleDrawer, handleDeleteRequest), [openEditRoleDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <RolesDataTable
        columns={columns}
        data={roles}
        onAddRole={openAddRoleDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the role. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteRole} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
