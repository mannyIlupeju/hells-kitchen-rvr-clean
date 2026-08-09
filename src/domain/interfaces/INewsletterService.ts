import { NewsletterSubscriber } from "../entities/Newsletters/Subscribers";

export interface INewsLetterService{
 subscribeUser(email:string, name:string, termsAgreed:boolean, requestUpdate:boolean, phone?:string, smsConsent?:boolean):Promise<void>;
 unsubscribeUser(email: string):Promise<void>;
}