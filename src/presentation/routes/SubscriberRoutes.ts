import express, { Request, Response } from 'express';
import { FirebaseNewsletterRepository } from '../../infrastructure/db/firebase/FirebaseNewsletterRepository';
import { SubscriberService } from '../../application/services/SubscriberService';
import { v4 as uuidv4 } from 'uuid';
import { SubscriberUserSchema } from '../../application/validators/SubscriberUserSchema';


const router = express.Router();
const userService = new SubscriberService(new FirebaseNewsletterRepository());

router.post("/registerSubscriber", async (req:any, res:any) => {
  console.log("=== SUBSCRIBER REGISTER ROUTE HIT ===");
  console.log("Request body:", req.body);

  try {
    const result = SubscriberUserSchema.safeParse(req.body);
    if (!result.success) {
      const formatted = result.error.format();
      return res.status(400).json({ error: "Validation failed", details: formatted });
    }

    const { fullName, email, termsAgreed, requestUpdate } = result.data;

    // Ensure the DTO matches the service definition
    const user = await userService.registerSubscriber({
      id: uuidv4(),
      fullName,
      email,
      termsAgreed: termsAgreed === true || termsAgreed === 'true',
      requestUpdate: requestUpdate === true || requestUpdate === 'true', // match service DTO
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("=== ERROR IN SUBSCRIBER ROUTE ===", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});



export default router;