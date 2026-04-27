import { z } from "zod";

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "dashboard",
  "login",
  "signup",
  "signout",
  "logout",
  "settings",
  "billing",
  "pricing",
  "privacy",
  "terms",
  "support",
  "help",
  "about",
  "contact",
  "_next",
  "public",
  "static",
  "www",
  "mail",
  "ftp",
]);

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(
    /^[a-z0-9_]+$/,
    "Use lowercase letters, numbers, and underscores only",
  )
  .refine((v) => !RESERVED_USERNAMES.has(v), {
    message: "That username is reserved",
  });

export const linkSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  url: z.string().url("Enter a valid URL"),
  thumbnail_url: z.string().url().nullable().optional(),
  is_enabled: z.boolean().default(true),
  scheduled_start: z.string().datetime().nullable().optional(),
  scheduled_end: z.string().datetime().nullable().optional(),
});

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().min(1).max(60).nullable(),
  bio: z.string().max(240).nullable(),
});

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: usernameSchema,
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LinkInput = z.infer<typeof linkSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
