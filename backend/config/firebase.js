import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

let serviceAccount = null;

// 1. Production: Read from Railway environment variable
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
  } catch (err) {
    console.error('[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
  }
}

// 2. Development: Fall back to local file if env variable is missing
if (!serviceAccount) {
  try {
    serviceAccount = JSON.parse(
      await readFile(new URL('./serviceAccountKey.json', import.meta.url))
    );
  } catch (err) {
    console.warn('[FIREBASE] Local serviceAccountKey.json not found:', err.message);
  }
}

// 3. Initialize Firebase safely
const app = !getApps().length && serviceAccount
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

export const auth = app ? getAuth(app) : null;
export default app;