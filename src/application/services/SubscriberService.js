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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriberService = void 0;
const Subscribers_1 = require("../../domain/entities/Newsletters/Subscribers");
const KlaviyoNewsletterService_1 = require("../../infrastructure/services/klaviyo/KlaviyoNewsletterService");
class SubscriberService {
    constructor(subscriberRepo, klaviyoRepo = new KlaviyoNewsletterService_1.KlaviyoNewsletterService()) {
        this.subscriberRepo = subscriberRepo;
        this.klaviyoRepo = klaviyoRepo;
    }
    registerSubscriber(subscriberData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, fullName, email, termsAgreed, requestUpdate, } = subscriberData;
            const user = new Subscribers_1.NewsletterSubscriber({
                id,
                fullName,
                email,
                termsAgreed,
                requestUpdate,
            });
            try {
                yield this.subscriberRepo.subscribeUser(email, fullName, termsAgreed, requestUpdate);
            }
            catch (firebaseErr) {
                console.error("Error saving to Firebase:", firebaseErr);
                // Optionally, throw or handle as needed
            }
            try {
                yield this.klaviyoRepo.subscribeUser(user.email, user.fullName, user.termsAgreed, user.requestUpdate);
            }
            catch (klaviyoErr) {
                console.error("Error syncing to Klaviyo:", klaviyoErr);
                // Optionally, throw or handle as needed
            }
            return user;
        });
    }
}
exports.SubscriberService = SubscriberService;
