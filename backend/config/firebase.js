import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

// Prevent re-initialization if nodemon restarts
const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

export const auth = getAuth(app);
export default app;