import { z } from "zod";

export const SubscriberUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format, e.g. +12125551234").optional().or(z.literal("")),
  smsConsent: z.union([z.literal(true), z.literal("true"), z.literal(false), z.literal("false")]).optional(),
  termsAgreed: z.union([z.literal(true), z.literal("true")]),
  requestUpdate: z.union([z.literal(true), z.literal("true"), z.literal(false), z.literal("false")]).optional(),
}).refine(
  (data) => !(data.smsConsent === true || data.smsConsent === "true") || !!data.phone,
  { message: "Phone number is required to opt into SMS", path: ["phone"] }
);