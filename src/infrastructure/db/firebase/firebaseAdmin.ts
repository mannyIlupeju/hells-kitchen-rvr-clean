import admin from 'firebase-admin';
import serviceAccount from '../../../../serviceAccountkey.json';

declare global {
  var _firebaseAdminInitialized: boolean;
}

if (!global._firebaseAdminInitialized) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  global._firebaseAdminInitialized = true;
}

export const dbAdmin = admin.firestore();
export default admin;