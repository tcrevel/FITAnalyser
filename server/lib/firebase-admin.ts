import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin with service account
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

// Export the auth instance
export const auth = getAuth(app);

// Initialize storage with explicit bucket
const storageBucket = 'fit-analyser.firebasestorage.app';
console.log('Initializing Firebase Storage with bucket:', storageBucket);
export const storage = getStorage(app);
export const bucket = storage.bucket(storageBucket);