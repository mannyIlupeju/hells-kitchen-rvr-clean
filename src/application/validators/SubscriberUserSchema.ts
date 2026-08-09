import { z } from "zod";
import { normalizePhone } from "./normalizePhone";

export const SubscriberUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Invalid email"),
  phone: z.preprocess(
    (val) => typeof val === "string" ? normalizePhone(val) : val,
    z.string().regex(/^\+[1-9]\d{7,14}$/, "That doesn't look like a valid phone number").optional().or(z.literal(""))
  ),
  smsConsent: z.union([z.literal(true), z.literal("true"), z.literal(false), z.literal("false")]).optional(),
  termsAgreed: z.union([z.literal(true), z.literal("true")]),
  requestUpdate: z.union([z.literal(true), z.literal("true"), z.literal(false), z.literal("false")]).optional(),
}).refine(
  (data) => !(data.smsConsent === true || data.smsConsent === "true") || !!data.phone,
  { message: "Phone number is required to opt into SMS", path: ["phone"] }
);