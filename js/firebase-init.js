/**
 * 2N Presenter - Firebase Initialization
 * BD unificada: crm-obras-prod (colecciones web_* con lectura pública).
 * Hosting: site soluciones-2n en crm-obras-prod (todo unificado).
 * 
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// Auth y Storage NO se cargan aquí (regla de rendimiento): las páginas
// públicas solo necesitan Firestore. login/presenter usan firebase-auth-init.js.
export { app, db };
export default app;
