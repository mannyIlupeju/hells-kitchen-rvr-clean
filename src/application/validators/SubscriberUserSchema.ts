import { z } from "zod";

export const SubscriberUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),  
  email: z.string().email("Invalid email"),
  termsAgreed: z.union([z.literal(true), z.literal("true")]),
  requestUpdate: z.union([z.literal(true), z.literal("true"), z.literal(false), z.literal("false")]).optional(),
});