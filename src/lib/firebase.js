import { initializeApp, getApps } from "firebase/app";
import { logger } from "./logger";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};



if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("Firebase config missing (check .env variables)");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
export const auth = getAuth(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
// Development módban csak public_profile-t kérünk
facebookProvider.setCustomParameters({
  display: 'popup',
  auth_type: ''
});
// NE kérjünk email-t (development módban problémás)
facebookProvider.addScope('public_profile');

export async function saveBooking(booking) {
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...booking,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (err) {
    logger.error("Hiba a foglalás mentése közben:", err);
    throw err;
  }
}

export async function getBookingsByDate(dateString) {
  try {
    const q = query(
      collection(db, "bookings"),
      where("date", "==", dateString)
    );
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    // Kliens oldalon rendezés az idő alapján
    return items.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  } catch (err) {
    logger.error("Hiba a foglalások lekérdezése közben:", err);
    return [];
  }
}

export async function getUserBookings(userId) {
  try {
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    // Rendezés dátum és idő alapján (legújabb elől)
    return items.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
  } catch (err) {
    logger.error("Hiba a foglalások lekérdezése közben:", err);
    return [];
  }
}

export async function getAllBookings() {
  try {
    const snap = await getDocs(collection(db, "bookings"));
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    // Rendezés dátum és idő alapján (legújabb elől)
    return items.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      return (b.time || "").localeCompare(a.time || "");
    });
  } catch (err) {
    logger.error("Hiba az összes foglalás lekérdezése közben:", err);
    return [];
  }
}

export async function getUserData(userId) {
  try {
    const docRef = await getDocs(
      query(collection(db, "users"), where("__name__", "==", userId))
    );
    if (docRef.empty) return null;
    return docRef.docs[0].data();
  } catch (err) {
    logger.error("Hiba a felhasználó adatainak lekérdezése közben:", err);
    return null;
  }
}

// Auth helper functions
function getHungarianError(code) {
  const errors = {
    "auth/popup-closed-by-user": "A bejelentkezési ablak bezárásra került",
    "auth/account-exists-with-different-credential":
      "Ez az email már regisztrálva van másik szolgáltatóval",
    "auth/network-request-failed": "Hálózati hiba történt",
    "auth/popup-blocked": "A felugró ablak blokkolva lett",
    "auth/cancelled-popup-request": "A bejelentkezés megszakításra került",
  };
  return errors[code] || "Hiba történt a bejelentkezés során";
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    logger.error("Google bejelentkezési hiba:", error);
    return { user: null, error: getHungarianError(error.code) };
  }
}

export async function signInWithFacebook() {
  try {
    // Új provider példány minden bejelentkezéshez
    const fbProvider = new FacebookAuthProvider();
    fbProvider.addScope('public_profile'); // Csak public_profile, NE email
    fbProvider.setCustomParameters({
      display: 'popup'
    });

    const result = await signInWithPopup(auth, fbProvider);
    return { user: result.user, error: null };
  } catch (error) {
    logger.error("Facebook bejelentkezési hiba:", error);
    return { user: null, error: getHungarianError(error.code) };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    logger.error("Kijelentkezési hiba:", error);
    return { error: "Kijelentkezési hiba történt" };
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Booking status management
export async function approveBooking(bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    logger.error("Hiba a foglalás jóváhagyása közben:", err);
    throw err;
  }
}

export async function rejectBooking(bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: "rejected",
      rejectedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    logger.error("Hiba a foglalás elutasítása közben:", err);
    throw err;
  }
}

export async function deleteBooking(bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
    return { success: true };
  } catch (err) {
    logger.error("Hiba a foglalás törlése közben:", err);
    throw err;
  }
}

// Service management functions
export async function getAllServices() {
  try {
    const snap = await getDocs(collection(db, "services"));
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    // Rendezés kategória és label alapján
    return items.sort((a, b) => {
      const catCompare = (a.category || "").localeCompare(b.category || "");
      if (catCompare !== 0) return catCompare;
      return (a.label || "").localeCompare(b.label || "");
    });
  } catch (err) {
    logger.error("Hiba a szolgáltatások lekérdezése közben:", err);
    return [];
  }
}

export async function saveService(service) {
  try {
    const docRef = await addDoc(collection(db, "services"), {
      ...service,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (err) {
    logger.error("Hiba a szolgáltatás mentése közben:", err);
    throw err;
  }
}

export async function updateService(serviceId, updates) {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    logger.error("Hiba a szolgáltatás frissítése közben:", err);
    throw err;
  }
}

export async function deleteService(serviceId) {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await updateDoc(serviceRef, {
      active: false,
      deletedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    logger.error("Hiba a szolgáltatás törlése közben:", err);
    throw err;
  }
}

export async function permanentlyDeleteService(serviceId) {
  try {
    const serviceRef = doc(db, "services", serviceId);
    await deleteDoc(serviceRef);
    return { success: true };
  } catch (err) {
    logger.error("Hiba a szolgáltatás végleges törlése közben:", err);
    throw err;
  }
}
