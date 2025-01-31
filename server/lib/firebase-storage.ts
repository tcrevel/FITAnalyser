import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
});

export const storage = getStorage(app);
export const bucket = storage.bucket();

export async function uploadFitFile(file: Express.Multer.File, userId: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `fit-files/${userId}/${timestamp}-${file.originalname}`;
  const blob = bucket.file(fileName);
  
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: 'application/octet-stream',
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      // Make the file public
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
}

export async function deleteFitFile(filePath: string): Promise<void> {
  // Extract filename from the public URL
  const fileName = filePath.split(`${bucket.name}/`)[1];
  if (!fileName) {
    throw new Error('Invalid file path');
  }
  
  const file = bucket.file(fileName);
  await file.delete();
}
