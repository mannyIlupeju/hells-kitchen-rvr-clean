import isEmail from 'validator/lib/isEmail';

interface SubscriberProps {
    id: string;
    fullName: string;
    email: string;
    requestUpdate: boolean;
    termsAgreed: boolean;
  }

export class NewsletterSubscriber {
    public readonly id: string;
    public readonly fullName:string;
    public readonly email:string;
    public readonly requestUpdate: boolean = true;
    public readonly termsAgreed: boolean = false;
    public readonly createdAt: Date = new Date();

    constructor({
        id,
        fullName,
        email,
        termsAgreed,
        requestUpdate,
    }: SubscriberProps) {
        const trimmedEmail = email.trim();
        
        if (!isEmail(trimmedEmail)) {
            throw new Error("Invalid email format");
        }
        this.id = id;
        this.fullName = fullName;
        this.email = trimmedEmail;
        this.termsAgreed = termsAgreed;
        this.requestUpdate = requestUpdate;
    }
    

    
}