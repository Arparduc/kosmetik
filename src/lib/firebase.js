import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";

console.log("FIREBASE ENV CHECK:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// 🔥 IDE KELL a .env-ből jönnie mindennek
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ Debug: ezt fogjuk nézni
console.log("FIREBASE ENV CHECK:", {
  apiKey: firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// ❗ Ha nincs env, itt álljon meg egyből (ne lógjon)
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("FIREBASE CONFIG HIÁNYZIK! .env fájl nincs jól beállítva.");
  throw new Error("Firebase config missing (check .env variables)");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function saveBooking(booking) {
  console.log("saveBooking() START", booking);

  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...booking,
      createdAt: serverTimestamp(),
    });

    console.log("saveBooking() DONE id=", docRef.id);
    return { id: docRef.id };
  } catch (err) {
    console.error("saveBooking() ERROR", err);
    throw err;
  }
}

export async function getBookingsByDate(dateString) {
  const q = query(
    collection(db, "bookings"),
    where("date", "==", dateString),
    orderBy("time")
  );
  const snap = await getDocs(q);
  const items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items;
}
