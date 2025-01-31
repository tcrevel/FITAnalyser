import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin with service account
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com` // Use project ID for bucket name
});

// Export the auth instance
export const auth = getAuth(app);

// Initialize storage
console.log('Initializing Firebase Storage with bucket:', `${process.env.FIREBASE_PROJECT_ID}.appspot.com`);
export const storage = getStorage(app);
export const bucket = storage.bucket();