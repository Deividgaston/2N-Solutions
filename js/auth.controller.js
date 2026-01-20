/**
 * 2N Presenter - Authentication Controller
 * Handles login, logout, and session management
 */

import { auth, db } from './firebase-init.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import i18n from './i18n.js';

class AuthController {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.isRedirecting = false;
        this.initialized = false;
    }

    /**
     * Initialize auth state listener and form bindings
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole(user.uid);

                // Only redirect from login page
                const currentPage = window.location.pathname;
                if (currentPage.endsWith('login.html') || currentPage === '/' || currentPage.endsWith('/')) {
                    this.redirectByRole();
                }
            } else {
                this.currentUser = null;
                this.userRole = null;

                // Redirect to login if on protected page
                const currentPage = window.location.pathname;
                if (currentPage.includes('admin.html') || currentPage.includes('presenter.html')) {
                    window.location.href = 'login.html';
                }
            }
        });

        // Bind login form if present
        const googleLoginBtn = document.getElementById('google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        }
    }

    /**
     * Load user role from Firestore
     */
    async loadUserRole(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                this.userRole = userDoc.data().role || 'prescriptor';
            } else {
                this.userRole = 'prescriptor';
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = 'prescriptor';
        }
    }

    /**
     * Redirect user based on their role (only called from login page)
     */
    redirectByRole() {
        if (this.isRedirecting) return;
        this.isRedirecting = true;

        if (this.userRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'presenter.html';
        }
    }

    /**
     * Handle Google Login
     */
    async handleGoogleLogin() {
        const provider = new GoogleAuthProvider();
        const errorEl = document.getElementById('error-message');
        const googleLoginBtn = document.getElementById('google-login-btn');

        if (errorEl) {
            errorEl.classList.add('hidden');
            errorEl.textContent = '';
        }

        if (googleLoginBtn) {
            googleLoginBtn.disabled = true;
            googleLoginBtn.classList.add('loading');
        }

        try {
            await signInWithPopup(auth, provider);
            // Auth state listener handles redirect
        } catch (error) {
            console.error('Google Login error:', error);
            if (errorEl) {
                errorEl.textContent = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';
                errorEl.classList.remove('hidden');
            }
        } finally {
            if (googleLoginBtn) {
                googleLoginBtn.disabled = false;
                googleLoginBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Sign out current user
     */
    async logout() {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Check if user is authenticated (for protected pages)
     */
    requireAuth() {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                } else {
                    window.location.href = 'login.html';
                    reject(new Error('Not authenticated'));
                }
            });
        });
    }

    /**
     * Check if user has admin role
     */
    async requireAdmin() {
        await this.requireAuth();
        await this.loadUserRole(auth.currentUser.uid);
        if (this.userRole !== 'admin') {
            window.location.href = 'presenter.html';
            throw new Error('Not authorized');
        }
    }
}

// Create singleton
const authController = new AuthController();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authController.init());
} else {
    authController.init();
}

export default authController;

// Expose logout function globally for easy access from HTML
window.logout = () => authController.logout();
