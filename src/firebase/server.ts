
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function initializeFirebaseServer(): { app: FirebaseApp; firestore: any; auth: any; } {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { app, firestore, auth };
  } else {
    const app = getApp();
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { app, firestore, auth };
  }
}

const { firestore, auth } = initializeFirebaseServer();

export { firestore, auth };
