// src/components/roles/AddRoleForm.tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleSchema, type RoleFormValues } from "@/lib/validation/role.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addRoleAction, updateRoleAction } from "@/lib/actions/role.actions";
import { useState, useEffect } from "react";
import type { Role, Permission } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";
import { Badge } from "../ui/badge";

interface AddRoleFormProps {
  role?: Role & { permissions: Permission[] };
  permissions: Permission[];
  onSuccess: () => void;
}

export function AddRoleForm({ role, permissions, onSuccess }: AddRoleFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (isEditMode && role) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
        permissionIds: role.permissions.map(p => p.id),
      });
    }
  }, [role, form, isEditMode]);

  async function onSubmit(data: RoleFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateRoleAction(role!.id, data)
      : addRoleAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `Role ${isEditMode ? 'Updated' : 'Added'}!`,
      });
      onSuccess();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  }

  const permissionGroups = permissions.reduce((acc, p) => {
    const group = p.key.split('.')[0];
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Role Name</FormLabel><FormControl><Input placeholder="e.g., Cashier" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of this role's responsibilities." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField
          control={form.control}
          name="permissionIds"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Permissions</FormLabel>
                <FormDescription>
                  Select the permissions for this role.
                </FormDescription>
              </div>
              <div className="space-y-4">
              {Object.entries(permissionGroups).map(([group, perms]) => (
                <div key={group} className="p-4 border rounded-lg">
                    <h4 className="text-sm font-semibold capitalize mb-2">{group}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {perms.map((p) => (
                            <FormItem key={p.id} className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(p.id)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...(field.value || []), p.id])
                                        : field.onChange(field.value?.filter((value) => value !== p.id))
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">{p.key}</FormLabel>
                            </FormItem>
                        ))}
                    </div>
                </div>
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update Role" : "Save Role")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
