import { INewsLetterService } from "../../domain/interfaces/INewsletterService";
import { NewsletterSubscriber } from "../../domain/entities/Newsletters/Subscribers";
import { KlaviyoNewsletterService } from "../../infrastructure/services/klaviyo/KlaviyoNewsletterService";

interface SubscriberDTO {
    id: string;
    fullName: string;
    email: string;
    termsAgreed: boolean;
    requestUpdate: boolean;
}

export class SubscriberService {
    constructor(
        private readonly subscriberRepo: INewsLetterService,
        private readonly klaviyoRepo: INewsLetterService = new KlaviyoNewsletterService()
    ) {}
  
    async registerSubscriber(subscriberData: SubscriberDTO): Promise<NewsletterSubscriber> {
      const {
        id,
        fullName,
        email,
        termsAgreed,
        requestUpdate,
      } = subscriberData;
  
      const user = new NewsletterSubscriber({
        id,
        fullName, 
        email,
        termsAgreed,
        requestUpdate,
      })
  
      try {
        await this.subscriberRepo.subscribeUser(email, fullName, termsAgreed, requestUpdate);
      } catch (firebaseErr) {
        console.error("Error saving to Firebase:", firebaseErr);
        // Optionally, throw or handle as needed
      }
      try {
        await this.klaviyoRepo.subscribeUser(user.email, user.fullName, user.termsAgreed, user.requestUpdate);
      } catch (klaviyoErr) {
        console.error("Error syncing to Klaviyo:", klaviyoErr);
        // Optionally, throw or handle as needed
      }
      return user;
    }
  
   
}