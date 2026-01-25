/**
 * 2N Presenter - Firebase Initialization
 * Project: nsoluciones-68554
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD9XyKSJrZuJgex0eLvoaJ9nzy_9YZbFgc",
    authDomain: "nsoluciones-68554.firebaseapp.com",
    projectId: "nsoluciones-68554",
    storageBucket: "nsoluciones-68554.firebasestorage.app",
    messagingSenderId: "492017983963",
    appId: "1:492017983963:web:646417ff575251b57847fe"
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
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.info("Firestore persistence disabled (multiple tabs open)");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore persistence not supported");
    } else {
        // Ignore "already started" errors or others non-critical
        console.log("Firestore persistence status:", err.code);
    }
});

// Storage
const storage = getStorage(app);

// Export Firebase services
export { app, auth, db, storage };
export default app;
