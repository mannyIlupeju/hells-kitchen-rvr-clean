"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriberUserSchema = void 0;
const zod_1 = require("zod");
exports.SubscriberUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),
    email: zod_1.z.string().email("Invalid email"),
    termsAgreed: zod_1.z.union([zod_1.z.literal(true), zod_1.z.literal("true")]),
    requestUpdate: zod_1.z.union([zod_1.z.literal(true), zod_1.z.literal("true"), zod_1.z.literal(false), zod_1.z.literal("false")]).optional(),
});
