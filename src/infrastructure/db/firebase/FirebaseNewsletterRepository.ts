import { INewsLetterService } from "../../../domain/interfaces/INewsletterService";
import { NewsletterSubscriber } from "../../../domain/entities/Newsletters/Subscribers";
import { dbAdmin } from "./firebaseAdmin"; // Uses firebase-admin SDK
import isEmail from "validator/lib/isEmail";

export class FirebaseNewsletterRepository implements INewsLetterService {
  private newsletterSubscriberRef = dbAdmin.collection("newsletterSubscribers");

  async subscribeUser(email: string, name: string, termsAgreed:boolean, requestUpdate:boolean): Promise<void> {
    if (!isEmail(email)) {
      throw new Error("Invalid email format");
    }

    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const now = new Date().toISOString();

    await this.newsletterSubscriberRef.doc(docId).set(
      {
        fullName: name.toLowerCase().trim(),
        email: email,
        termsAgreed: termsAgreed,
        requestUpdate: requestUpdate,
        createdAt: now,
      },
      { merge: true }
    );
  }

  async unsubscribeUser(email: string): Promise<void> {
    if (!isEmail(email)) {
      throw new Error("Invalid email format");
    }

    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const doc = await this.newsletterSubscriberRef.doc(docId).get();
    if (!doc.exists) {
      throw new Error("User not subscribed");
    }

    await this.newsletterSubscriberRef.doc(docId).update({
      requestUpdate: false,
      unsubscribedAt: new Date().toISOString(),
    });

    console.log(`🛑 Unsubscribed user: ${email}`);
  }


  async findById(id: string): Promise<NewsletterSubscriber | null> {
    const doc = await this.newsletterSubscriberRef.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return new NewsletterSubscriber({
      id,
      fullName: data.fullName,
      email: data.email,
      termsAgreed: data.termsAgreed ?? false,
      requestUpdate: data.requestUpdate ?? false,
    });
  }
}