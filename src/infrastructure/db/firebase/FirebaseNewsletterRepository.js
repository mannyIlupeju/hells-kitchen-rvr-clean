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
exports.FirebaseNewsletterRepository = void 0;
const Subscribers_1 = require("../../../domain/entities/Newsletters/Subscribers");
const firebaseAdmin_1 = require("./firebaseAdmin"); // Uses firebase-admin SDK
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
class FirebaseNewsletterRepository {
    constructor() {
        this.newsletterSubscriberRef = firebaseAdmin_1.dbAdmin.collection("newsletterSubscribers");
    }
    subscribeUser(email, name, termsAgreed, requestUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, isEmail_1.default)(email)) {
                throw new Error("Invalid email format");
            }
            const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const now = new Date().toISOString();
            yield this.newsletterSubscriberRef.doc(docId).set({
                fullName: name.toLowerCase().trim(),
                email: email,
                termsAgreed: termsAgreed,
                requestUpdate: requestUpdate,
                createdAt: now,
            }, { merge: true });
        });
    }
    unsubscribeUser(email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, isEmail_1.default)(email)) {
                throw new Error("Invalid email format");
            }
            const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
            const doc = yield this.newsletterSubscriberRef.doc(docId).get();
            if (!doc.exists) {
                throw new Error("User not subscribed");
            }
            yield this.newsletterSubscriberRef.doc(docId).update({
                requestUpdate: false,
                unsubscribedAt: new Date().toISOString(),
            });
            console.log(`🛑 Unsubscribed user: ${email}`);
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const doc = yield this.newsletterSubscriberRef.doc(id).get();
            if (!doc.exists)
                return null;
            const data = doc.data();
            if (!data)
                return null;
            return new Subscribers_1.NewsletterSubscriber({
                id,
                fullName: data.fullName,
                email: data.email,
                termsAgreed: (_a = data.termsAgreed) !== null && _a !== void 0 ? _a : false,
                requestUpdate: (_b = data.requestUpdate) !== null && _b !== void 0 ? _b : false,
            });
        });
    }
}
exports.FirebaseNewsletterRepository = FirebaseNewsletterRepository;
