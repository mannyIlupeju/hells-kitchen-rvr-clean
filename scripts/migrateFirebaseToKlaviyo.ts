import { FirebaseNewsletterRepository } from "../src/infrastructure/db/firebase/FirebaseNewsletterRepository";
import { KlaviyoNewsletterService } from "../src/infrastructure/services/klaviyo/KlaviyoNewsletterService";

async function migrateFirebaseToKlaviyo() {
  const firebaseRepo = new FirebaseNewsletterRepository();
  const klaviyoService = new KlaviyoNewsletterService();

  // Fetch all subscribers from Firebase
  const snapshot = await firebaseRepo["newsletterSubscriberRef"].get();
  if (snapshot.empty) {
    console.log("No subscribers found in Firebase.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      await klaviyoService.subscribeUser(
        data.email,
        data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        data.termsAgreed ?? false,
        data.requestUpdate ?? false
      );
      console.log(`✅ Migrated: ${data.email}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to migrate ${data.email}:`, err);
      failCount++;
    }
  }

  console.log(`\nMigration complete. Success: ${successCount}, Failed: ${failCount}`);
}

migrateFirebaseToKlaviyo().catch((err) => {
  console.error("Migration script error:", err);
});
