import { bucket } from './firebase-admin';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFileToStorage(fileBuffer: Buffer, originalName: string): Promise<string> {
  try {
    // Verify bucket exists first
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error('Firebase Storage bucket has not been created. Please create it in the Firebase Console.');
    }

    const filename = `fit-files/${uuidv4()}-${originalName}`;
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
      },
      resumable: false
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Error uploading to Firebase Storage:', error);
        reject(new Error(`Failed to upload file: ${error.message}`));
      });

      stream.on('finish', () => {
        console.log('Successfully uploaded file to Firebase Storage:', filename);
        resolve(filename);
      });

      const readable = new Readable();
      readable._read = () => {}; // _read is required but you can noop it
      readable.push(fileBuffer);
      readable.push(null);
      readable.pipe(stream);
    });
  } catch (error: any) {
    console.error('Error in uploadFileToStorage:', error);
    throw new Error(`Storage error: ${error.message}`);
  }
}

export async function getFileFromStorage(filePath: string): Promise<Buffer> {
  try {
    // Verify bucket exists first
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error('Firebase Storage bucket has not been created. Please create it in the Firebase Console.');
    }

    console.log('Fetching file from Firebase Storage:', filePath);
    const file = bucket.file(filePath);

    const [fileExists] = await file.exists();
    if (!fileExists) {
      throw new Error('File not found in Firebase Storage');
    }

    const [fileContents] = await file.download();
    console.log('Successfully downloaded file from Firebase Storage:', filePath);
    return fileContents;
  } catch (error: any) {
    console.error('Error in getFileFromStorage:', error);
    throw new Error(`Storage error: ${error.message}`);
  }
}