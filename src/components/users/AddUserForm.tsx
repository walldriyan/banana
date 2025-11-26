// src/components/users/AddUserForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormValues } from "@/lib/validation/user.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addUserAction, updateUserAction } from "@/lib/actions/user.actions";
import { useState, useEffect } from "react";
import type { User, Role } from "@prisma/client";
import { useDrawer } from "@/hooks/use-drawer";

interface AddUserFormProps {
  user?: User;
  roles: Role[];
  onSuccess: () => void;
}

export function AddUserForm({ user, roles, onSuccess }: AddUserFormProps) {
  const { toast } = useToast();
  const drawer = useDrawer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      name: "",
      password: "",
      roleId: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && user) {
      form.reset({
        username: user.username,
        name: user.name,
        password: "", // Don't pre-fill password
        roleId: (user as any).roleId,
        isActive: user.isActive,
      });
    }
  }, [user, form, isEditMode]);

  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    const action = isEditMode
      ? updateUserAction(user!.id, data)
      : addUserAction(data);

    const result = await action;
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: `User ${isEditMode ? 'Updated' : 'Added'}!`,
        description: `User "${data.name}" has been successfully saved.`,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="username" render={({ field }) => (
          <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., johndoe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={form.control} name="roleId" render={({ field }) => (
            <FormItem><FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>User Active</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
        )} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={drawer.closeDrawer}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (isEditMode ? "Update User" : "Save User")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
