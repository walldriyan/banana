// src/lib/validation/role.schema.ts
import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters."),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, "At least one permission must be selected."),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
