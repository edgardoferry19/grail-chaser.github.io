import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// Watch operations
export const addWatch = async (watchData: {
  model: string;
  purchaseLink: string;
  pricePhp: number;
  grailLevel: string;
  imageUrl?: string;
}) => {
  const watchesCollection = collection(db, 'watches');
  const docRef = await addDoc(watchesCollection, {
    ...watchData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const fetchWatches = (
  callback: (watches: Record<string, any>) => void,
  onError?: (error: unknown) => void
) => {
  const watchesCollection = collection(db, 'watches');
  const unsubscribe = onSnapshot(
    watchesCollection,
    (snapshot) => {
      const data: Record<string, any> = {};
      snapshot.forEach((doc) => {
        data[doc.id] = { ...doc.data(), id: doc.id };
      });
      callback(data);
    },
    (error) => {
      onError?.(error);
    }
  );
  return unsubscribe;
};

export const fetchSavings = (
  callback: (savings: Record<string, any>) => void,
  onError?: (error: unknown) => void
) => {
  const savingsCollection = collection(db, 'savings');
  const unsubscribe = onSnapshot(
    savingsCollection,
    (snapshot) => {
      const data: Record<string, any> = {};
      snapshot.forEach((doc) => {
        data[doc.id] = { ...doc.data(), id: doc.id };
      });
      callback(data);
    },
    (error) => {
      onError?.(error);
    }
  );
  return unsubscribe;
};

export const deleteWatch = async (watchId: string) => {
  const watchDoc = doc(db, 'watches', watchId);
  await deleteDoc(watchDoc);
};

export const updateWatch = async (watchId: string, updates: Record<string, any>) => {
  const watchDoc = doc(db, 'watches', watchId);
  await updateDoc(watchDoc, updates);
};

// Savings operations
export const addSavingsEntry = async (entry: {
  date: string;
  amount: number;
  type: '+' | '-';
  description: string;
}) => {
  const savingsCollection = collection(db, 'savings');
  await addDoc(savingsCollection, {
    ...entry,
    createdAt: new Date().toISOString(),
  });
};

