"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterSubscriber = void 0;
const isEmail_1 = __importDefault(require("validator/lib/isEmail"));
class NewsletterSubscriber {
    constructor({ id, fullName, email, termsAgreed, requestUpdate, }) {
        this.requestUpdate = true;
        this.termsAgreed = false;
        this.createdAt = new Date();
        const trimmedEmail = email.trim();
        if (!(0, isEmail_1.default)(trimmedEmail)) {
            throw new Error("Invalid email format");
        }
        this.id = id;
        this.fullName = fullName;
        this.email = trimmedEmail;
        this.termsAgreed = termsAgreed;
        this.requestUpdate = requestUpdate;
    }
}
exports.NewsletterSubscriber = NewsletterSubscriber;
