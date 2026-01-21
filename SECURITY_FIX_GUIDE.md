# SECURITY FIX GUIDE - GYORS JAVÍTÁSOK A PREZENTÁCIÓ ELŐTT

## ⚠️ KRITIKUS: EZEKET HOLNAP REGGEL CSINÁLD MEG!

---

## 1. FIREBASE SECURITY RULES (15 perc)

### Lépések:

1. **Menj a Firebase Console-ba:**
   - https://console.firebase.google.com
   - Válaszd ki a `black-beauty-1e366` projektet

2. **Firestore Database → Rules**
   - Kattints a "Rules" fülre

3. **Másold be ezt a kódot:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Felhasználók
    match /users/{userId} {
      // Csak a saját adatát olvashatja, és admin minden user-t
      allow read: if request.auth.uid == userId || isAdmin(request.auth.uid);
      // Csak admin írhat user adatokat (isAdmin field módosítás védelem)
      allow write: if isAdmin(request.auth.uid);
    }

    // Foglalások
    match /bookings/{bookingId} {
      // Olvasás: Saját foglalás VAGY admin
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.userId ||
                      isAdmin(request.auth.uid));

      // Létrehozás: Bejelentkezett user, validált adatok
      allow create: if request.auth != null &&
                       validBooking(request.resource.data) &&
                       request.resource.data.userId == request.auth.uid;

      // Módosítás, törlés: Csak admin
      allow update, delete: if isAdmin(request.auth.uid);
    }

    // Szolgáltatások
    match /services/{serviceId} {
      // Olvasás: Mindenki (publikus)
      allow read: if true;
      // Írás: Csak admin
      allow write: if isAdmin(request.auth.uid);
    }

    // Helper funkciók
    function isAdmin(userId) {
      return exists(/databases/$(database)/documents/users/$(userId)) &&
             get(/databases/$(database)/documents/users/$(userId)).data.isAdmin == true;
    }

    function validBooking(data) {
      return data.name != null &&
             data.name is string &&
             data.email != null &&
             data.email is string &&
             data.phone != null &&
             data.phone is string &&
             data.date != null &&
             data.date is string &&
             data.time != null &&
             data.time is string &&
             data.service != null &&
             data.service is list;
    }
  }
}
```

4. **Kattints "Publish"**

5. **Teszteld:**
   - Próbálj meg kijelentkezve foglalást létrehozni (hibát kell dobjon)
   - Próbálj meg bejelentkezve a saját foglalásaidat olvasni (működnie kell)
   - Próbálj meg admin nélkül szolgáltatást módosítani (hibát kell dobjon)

---

## 2. ENV FÁJL VÉDELEM (5 perc)

### Lépések:

1. **Ellenőrizd a .gitignore fájlt:**

```bash
# .gitignore
.env
.env.local
.env.*.local
node_modules/
dist/
.firebase/
.firebaserc
```

2. **Távolítsd el a .env-t a Git history-ból (ha benne van):**

```bash
git rm --cached .env
git commit -m "Remove .env from repository"
git push origin main --force
```

3. **Hozz létre .env.example fájlt:**

```bash
# .env.example
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

**FONTOS:** A valódi `.env` fájl maradjon lokálisan, de ne kerüljön Git-be!

---

## 3. EMAILJS VÉDELEM (10 perc)

### Lépések:

1. **Mozgasd az EmailJS kulcsokat .env-be:**

**Fájl: `.env`**
```bash
# Hozzáadni ezeket a sorokat:
VITE_EMAILJS_SERVICE_ID=service_i1g2a4k
VITE_EMAILJS_TEMPLATE_ID_APPROVAL=template_wp7hf2m
VITE_EMAILJS_TEMPLATE_ID_REJECTION=template_axjeb1g
VITE_EMAILJS_PUBLIC_KEY=Ux5hnhgW8MuaNaa5q
```

2. **Módosítsd az emailService.js fájlt:**

**Fájl: `src/lib/emailService.js`**

```javascript
import emailjs from "@emailjs/browser";

const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

const TEMPLATE_IDS = {
  approval: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_APPROVAL,
  rejection: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_REJECTION,
};

export async function sendApprovalEmail(booking) {
  try {
    const userEmail = booking.userEmail || booking.email;
    if (!userEmail) {
      console.warn("⚠️ Nincs email cím, email nem kerül kiküldésre.");
      return { success: false, error: "No email address" };
    }

    const templateParams = {
      to_email: userEmail,
      to_name: booking.name || booking.userName,
      booking_date: booking.date,
      booking_time: booking.time,
      services: booking.servicesMeta?.map((s) => s.label).join(", ") || "Nincs megadva",
      total_price: booking.totalPrice || 0,
      total_duration: booking.totalDuration || 0,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      TEMPLATE_IDS.approval,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Jóváhagyó email elküldve:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Hiba a jóváhagyó email küldése közben:", error);
    return { success: false, error };
  }
}

export async function sendRejectionEmail(booking) {
  try {
    const userEmail = booking.userEmail || booking.email;
    if (!userEmail) {
      console.warn("⚠️ Nincs email cím, email nem kerül kiküldésre.");
      return { success: false, error: "No email address" };
    }

    const templateParams = {
      email: userEmail,
      to_name: booking.name || booking.userName,
      booking_date: booking.date,
      booking_time: booking.time,
      services: booking.servicesMeta?.map((s) => s.label).join(", ") || "Nincs megadva",
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      TEMPLATE_IDS.rejection,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Visszamondó email elküldve:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Hiba a visszamondó email küldése közben:", error);
    return { success: false, error };
  }
}
```

3. **Újraindítás szükséges:**
```bash
# Állítsd le a dev servert (Ctrl+C)
npm run dev
```

---

## 4. XSS VÉDELEM (5 perc)

### Telepítsd a DOMPurify-t:

```bash
npm install dompurify
```

### Használd a megjegyzésekben:

**Fájl: `src/pages/AdminDashboard.jsx`**

```javascript
import DOMPurify from 'dompurify';

// ...

// A 356. sor környékén:
<div className="summary-notes">
  <strong>Megjegyzés</strong>
  <p dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(form.notes || "Nincs megjegyzés")
  }} />
</div>
```

**FONTOS:** Ez csak akkor kell, ha HTML-t is akarsz megengedni. Ha csak plain text kell, akkor a React automatikusan escapel, nem kell DOMPurify.

---

## 5. CONSOLE.LOG TAKARÍTÁS (10 perc)

### Hozz létre egy logger utility-t:

**Fájl: `src/lib/logger.js` (ÚJ FÁJL)**

```javascript
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
};
```

### Cseréld le a console.log-okat:

**Példa: `src/lib/firebase.js`**

```javascript
import { logger } from './logger';

// Régi:
console.error("Hiba a foglalás mentése közben:", err);

// Új:
logger.error("Hiba a foglalás mentése közben:", err);
```

**Gyors replace az összes fájlban:**
- VS Code-ban: `Ctrl+Shift+H` (Find and Replace in Files)
- Find: `console.log`
- Replace: `logger.log`
- Find: `console.error`
- Replace: `logger.error`
- Find: `console.warn`
- Replace: `logger.warn`

**Ne felejtsd el importálni:**
```javascript
import { logger } from '../lib/logger';
```

---

## 6. ERROR HANDLING JAVÍTÁS (5 perc)

### localStorage parse védelem:

**Fájl: `src/pages/Booking.jsx` (154-157. sorok)**

```javascript
useEffect(() => {
  try {
    const raw = localStorage.getItem("preselectedServices");
    if (!raw) return;

    const arr = JSON.parse(raw);

    // Validáció: Array-e?
    if (!Array.isArray(arr)) {
      throw new Error("Invalid preselected services format");
    }

    // Validáció: Van-e olyan service?
    const validServices = arr.filter((slug) => services[slug]);

    setForm((prev) => ({
      ...prev,
      service: validServices,
    }));

    localStorage.removeItem("preselectedServices");
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn("Corrupt preselected services in localStorage");
    } else {
      logger.error("Unexpected error loading preselected services:", error);
    }
    // Tisztítás, hogy legközelebb ne legyen probléma
    localStorage.removeItem("preselectedServices");
  }
}, [services]);
```

---

## 7. ADMIN ELLENŐRZÉS BACKEND-EN (OPCIONÁLIS, 20 perc)

**Ez már bonyolultabb, de ha van időd:**

### Firebase Cloud Functions telepítése:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

### Admin ellenőrzés Cloud Function:

**Fájl: `functions/index.js`**

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.checkAdmin = functions.https.onCall(async (data, context) => {
  // Ellenőrzés: Be van-e jelentkezve?
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = context.auth.uid;

  try {
    // Firestore-ból olvasás
    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return { isAdmin: false };
    }

    return { isAdmin: userDoc.data().isAdmin === true };
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Error checking admin status");
  }
});
```

### Deploy:

```bash
firebase deploy --only functions
```

**Ez már opcionális, csak ha van időd!**

---

## ELLENŐRZŐ LISTA (Checklist)

Prezentáció előtt menj végig ezeken:

- [ ] Firebase Security Rules publikálva
- [ ] .env fájl nincs Git-ben (git status)
- [ ] .gitignore tartalmazza a .env-t
- [ ] EmailJS kulcsok .env-ben vannak
- [ ] DOMPurify telepítve (XSS védelem)
- [ ] console.log-ok lecserélve logger-re
- [ ] localStorage parse try-catch-el védve
- [ ] `npm run dev` működik, nincs error
- [ ] Tesztelted az alkalmazást (booking, admin)
- [ ] Git commit: "security: Implement security fixes"
- [ ] Git push

---

## HA VALAMI NEM MŰKÖDIK

### Firebase Security Rules hiba:
**Hibaüzenet:** "Missing or insufficient permissions"

**Megoldás:**
- Ellenőrizd, hogy a Rules tényleg publikálva vannak-e
- Próbáld meg kijelentkezni és újra bejelentkezni
- Nézd meg a Firebase Console-ban a "Rules playground"-ot

### EmailJS nem működik:
**Hibaüzenet:** "service_i1g2a4k is not a string"

**Megoldás:**
- Ellenőrizd a .env fájlt, minden kulcs megvan-e
- Újraindítottad-e a dev servert?
- `console.log(import.meta.env.VITE_EMAILJS_SERVICE_ID)` látható-e?

### Git force push hiba:
**Hibaüzenet:** "Updates were rejected"

**Megoldás:**
- Figyelj! Force push törli a remote történetet!
- Mentsd el a kódot előtte
- `git push origin main --force-with-lease` (biztonságosabb)

---

## GYORS SECURITY CHECKLIST A PREZENTÁCIÓHOZ

Ha rákérdeznek a security-re:

✅ **Amit már megcsináltál:**
- Firebase Authentication (Google OAuth)
- Firestore Security Rules
- Admin route védelem (Context API)
- Frontend validáció (HTML5 + JS)
- React automatikus XSS escape

✅ **Amit holnap megcsinálsz:**
- .env védelem
- EmailJS kulcsok kihelyezése
- DOMPurify XSS védelem
- Logger utility (console.log production-ban)

⏳ **Jövőbeli fejlesztések:**
- Backend input validáció (Cloud Functions)
- Rate limiting (email spam védelem)
- HTTPS enforcement (production)
- Audit logging (GDPR compliance)

---

## PRODUKCIÓS DEPLOYMENT (OPCIONÁLIS)

Ha időd van és ki akarod tenni a webre:

```bash
# Build
npm run build

# Firebase Hosting
firebase init hosting
firebase deploy --only hosting
```

**Vagy egyszerűbben:**
- Vercel: `vercel --prod`
- Netlify: Drag & drop a `dist` mappa

---

Sok sikert! Ha bármi probléma van, ne izgulj - a legfontosabb az, hogy működjön és tudj róla beszélni! 🚀
