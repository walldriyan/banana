// src/app/dashboard/users/UsersClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Role } from '@prisma/client';
import { getUsersAction, deleteUserAction } from '@/lib/actions/user.actions';
import { getRolesAction } from '@/lib/actions/role.actions';
import { UsersDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddUserForm } from '@/components/users/AddUserForm';
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

type UserWithRole = User & { role: Role };

export function UsersClientPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [usersResult, rolesResult] = await Promise.all([
        getUsersAction(),
        getRolesAction()
    ]);
    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data as UserWithRole[]);
    } else {
      toast({ variant: 'destructive', title: 'Error fetching users', description: usersResult.error });
    }
    if (rolesResult.success && rolesResult.data) {
      setRoles(rolesResult.data);
    } else {
      toast({ variant: 'destructive', title: 'Error fetching roles', description: rolesResult.error });
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

  const openAddUserDrawer = () => {
    drawer.openDrawer({
      title: 'Add New User',
      content: <AddUserForm roles={roles} onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEditUserDrawer = useCallback((user: UserWithRole) => {
    drawer.openDrawer({
        title: 'Edit User',
        description: `Editing details for ${user.name}`,
        content: <AddUserForm user={user} roles={roles} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-md'
    });
  }, [drawer, roles]);

  const handleDeleteRequest = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    const result = await deleteUserAction(userToDelete);

    if (result.success) {
        toast({ title: "User Deleted", description: "User account has been deleted." });
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditUserDrawer, handleDeleteRequest), [openEditUserDrawer]);

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
      <UsersDataTable
        columns={columns}
        data={users}
        onAddUser={openAddUserDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the user account. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
