import { bucket } from './firebase-admin';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFileToStorage(fileBuffer: Buffer, originalName: string): Promise<string> {
  try {
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
        reject(error);
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
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    throw error;
  }
}

export async function getFileFromStorage(filePath: string): Promise<Buffer> {
  try {
    console.log('Fetching file from Firebase Storage:', filePath);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found in Firebase Storage');
    }

    const [fileContents] = await file.download();
    console.log('Successfully downloaded file from Firebase Storage:', filePath);
    return fileContents;
  } catch (error) {
    console.error('Error in getFileFromStorage:', error);
    throw error;
  }
}