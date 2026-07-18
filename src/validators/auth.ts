import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Invalid email address").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "doctor"]).optional().default("user"),
  avatar: z.string().url("Invalid avatar URL").optional(),
  profile: z
    .object({
      bloodGroup: z.string().optional(),
      dateOfBirth: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional().default("system"),
      notifications: z.boolean().optional().default(true),
    })
    .optional(),
  healthData: z
    .object({
      chronicConditions: z.array(z.string()).optional().default([]),
      allergies: z.array(z.string()).optional().default([]),
      healthScore: z.number().min(0).max(100).optional().default(0),
    })
    .optional(),
});

export const LoginSchema = z.object({
  email: z.email("Invalid email address").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  profile: z
    .object({
      bloodGroup: z.string().optional(),
      dateOfBirth: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      notifications: z.boolean().optional(),
    })
    .optional(),
  healthData: z
    .object({
      chronicConditions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      healthScore: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
