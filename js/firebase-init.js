/**
 * 2N Presenter - Firebase Initialization
 * BD unificada: crm-obras-prod (colecciones web_* con lectura pública).
 * El hosting sigue en nsoluciones-68554 (site specifications-solutions-2n);
 * los assets multimedia antiguos siguen en el bucket de nsoluciones vía URLs absolutas.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBdTl2XXdo9ks-qqhBqDdXk8uLb65qyD-I",
    authDomain: "crm-obras-prod.firebaseapp.com",
    projectId: "crm-obras-prod",
    storageBucket: "crm-obras-prod.firebasestorage.app",
    messagingSenderId: "147718681002",
    appId: "1:147718681002:web:6702ee35645e40c90e7bd3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence not available:", err.code || err);
});

// Firestore with offline persistence
const db = getFirestore(app);

// Enable persistence to reduce reads and allow offline access
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser doesn't support all of the features required to enable persistence
        console.warn('Firestore persistence is not supported by this browser');
    }
});

// Storage
const storage = getStorage(app);

// Export Firebase services
export { app, auth, db, storage };
export default app;
