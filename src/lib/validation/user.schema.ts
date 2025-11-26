// src/lib/validation/user.schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  name: z.string().min(2, "Name must be at least 2 characters long."),
  password: z.string().min(6, "Password must be at least 6 characters long.").optional().or(z.literal('')),
  roleId: z.string().min(1, "A role must be selected."),
  isActive: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof userSchema>;
