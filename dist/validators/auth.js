"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileUpdateSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(100),
    email: zod_1.z.email("Invalid email address").transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    role: zod_1.z.enum(["user", "doctor"]).optional().default("user"),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
    profile: zod_1.z
        .object({
        bloodGroup: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    })
        .optional(),
    preferences: zod_1.z
        .object({
        theme: zod_1.z.enum(["light", "dark", "system"]).optional().default("system"),
        notifications: zod_1.z.boolean().optional().default(true),
    })
        .optional(),
    healthData: zod_1.z
        .object({
        chronicConditions: zod_1.z.array(zod_1.z.string()).optional().default([]),
        allergies: zod_1.z.array(zod_1.z.string()).optional().default([]),
        healthScore: zod_1.z.number().min(0).max(100).optional().default(0),
    })
        .optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.email("Invalid email address").transform((v) => v.toLowerCase()),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.ProfileUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
    profile: zod_1.z
        .object({
        bloodGroup: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    })
        .optional(),
    preferences: zod_1.z
        .object({
        theme: zod_1.z.enum(["light", "dark", "system"]).optional(),
        notifications: zod_1.z.boolean().optional(),
    })
        .optional(),
    healthData: zod_1.z
        .object({
        chronicConditions: zod_1.z.array(zod_1.z.string()).optional(),
        allergies: zod_1.z.array(zod_1.z.string()).optional(),
        healthScore: zod_1.z.number().min(0).max(100).optional(),
    })
        .optional(),
});
