/**
 * Auth de Firebase SOLO para las páginas privadas (login/presenter).
 * Separado de firebase-init.js para que las páginas públicas no carguen el SDK de auth.
 */
import { app } from './firebase-init.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence not available:', err.code || err);
});

export { auth };
