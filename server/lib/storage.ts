import { storage } from './firebase-admin';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFileToStorage(fileBuffer: Buffer, originalName: string): Promise<string> {
  const bucket = storage.bucket();
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
      reject(error);
    });

    stream.on('finish', () => {
      resolve(filename);
    });

    const readable = new Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

export async function getFileFromStorage(filePath: string): Promise<Buffer> {
  const bucket = storage.bucket();
  const file = bucket.file(filePath);
  
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error('File not found');
  }

  const [fileContents] = await file.download();
  return fileContents;
}
