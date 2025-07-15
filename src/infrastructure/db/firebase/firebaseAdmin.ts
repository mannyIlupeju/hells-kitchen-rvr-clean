import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

declare global {
  // Prevent re-initialization in serverless environments
  var _firebaseAdminInitialized: boolean | undefined;
}

if (!global._firebaseAdminInitialized) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  global._firebaseAdminInitialized = true;
}

export const dbAdmin = admin.firestore();
export default admin;