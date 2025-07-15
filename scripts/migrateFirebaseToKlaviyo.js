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
const FirebaseNewsletterRepository_1 = require("../src/infrastructure/db/firebase/FirebaseNewsletterRepository");
const KlaviyoNewsletterService_1 = require("../src/infrastructure/services/klaviyo/KlaviyoNewsletterService");
function migrateFirebaseToKlaviyo() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const firebaseRepo = new FirebaseNewsletterRepository_1.FirebaseNewsletterRepository();
        const klaviyoService = new KlaviyoNewsletterService_1.KlaviyoNewsletterService();
        // Fetch all subscribers from Firebase
        const snapshot = yield firebaseRepo["newsletterSubscriberRef"].get();
        if (snapshot.empty) {
            console.log("No subscribers found in Firebase.");
            return;
        }
        let successCount = 0;
        let failCount = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            try {
                yield klaviyoService.subscribeUser(data.email, data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(), (_a = data.termsAgreed) !== null && _a !== void 0 ? _a : false, (_b = data.requestUpdate) !== null && _b !== void 0 ? _b : false);
                console.log(`✅ Migrated: ${data.email}`);
                successCount++;
            }
            catch (err) {
                console.error(`❌ Failed to migrate ${data.email}:`, err);
                failCount++;
            }
        }
        console.log(`\nMigration complete. Success: ${successCount}, Failed: ${failCount}`);
    });
}
migrateFirebaseToKlaviyo().catch((err) => {
    console.error("Migration script error:", err);
});
