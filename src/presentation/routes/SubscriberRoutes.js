"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const FirebaseNewsletterRepository_1 = require("../../infrastructure/db/firebase/FirebaseNewsletterRepository");
const SubscriberService_1 = require("../../application/services/SubscriberService");
const uuid_1 = require("uuid");
const SubscriberUserSchema_1 = require("../../application/validators/SubscriberUserSchema");
const router = express_1.default.Router();
const userService = new SubscriberService_1.SubscriberService(new FirebaseNewsletterRepository_1.FirebaseNewsletterRepository());
router.post("/registerSubscriber", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("=== SUBSCRIBER REGISTER ROUTE HIT ===");
    console.log("Request body:", req.body);
    try {
        const result = SubscriberUserSchema_1.SubscriberUserSchema.safeParse(req.body);
        if (!result.success) {
            const formatted = result.error.format();
            return res.status(400).json({ error: "Validation failed", details: formatted });
        }
        const { fullName, email, termsAgreed, requestUpdate } = result.data;
        // Ensure the DTO matches the service definition
        const user = yield userService.registerSubscriber({
            id: (0, uuid_1.v4)(),
            fullName,
            email,
            termsAgreed: termsAgreed === true || termsAgreed === 'true',
            requestUpdate: requestUpdate === true || requestUpdate === 'true', // match service DTO
        });
        return res.status(201).json(user);
    }
    catch (error) {
        console.error("=== ERROR IN SUBSCRIBER ROUTE ===", error);
        return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
}));
exports.default = router;
