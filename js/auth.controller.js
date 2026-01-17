/**
 * 2N Presenter - Authentication Controller
 * Handles login, logout, and session management
 */

import { auth, db } from './firebase-init.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import i18n from './i18n.js';

class AuthController {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    /**
     * Initialize auth state listener and form bindings
     */
    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole(user.uid);
                this.redirectByRole();
            } else {
                this.currentUser = null;
                this.userRole = null;
            }
        });

        // Bind login form if present
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
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
                // Create default user document if doesn't exist
                this.userRole = 'prescriptor';
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = 'prescriptor';
        }
    }

    /**
     * Redirect user based on their role
     */
    redirectByRole() {
        const currentPage = window.location.pathname;

        if (this.userRole === 'admin') {
            if (!currentPage.includes('admin.html') && !currentPage.includes('presenter.html')) {
                window.location.href = 'admin.html';
            }
        } else {
            if (!currentPage.includes('presenter.html')) {
                window.location.href = 'presenter.html';
            }
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const errorEl = document.getElementById('error-message');

        // Reset error state
        errorEl.classList.add('hidden');
        errorEl.textContent = '';

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Auth state listener will handle redirect
        } catch (error) {
            console.error('Login error:', error);

            let errorKey = 'login.errors.generic';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorKey = 'login.errors.userNotFound';
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorKey = 'login.errors.invalidCredentials';
                    break;
                case 'auth/network-request-failed':
                    errorKey = 'login.errors.networkError';
                    break;
            }

            errorEl.textContent = i18n.t(errorKey);
            errorEl.classList.remove('hidden');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    /**
     * Sign out current user
     */
    async logout() {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
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
                    window.location.href = 'index.html';
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
        if (this.userRole !== 'admin') {
            window.location.href = 'presenter.html';
            throw new Error('Not authorized');
        }
    }
}

// Create and export singleton
const authController = new AuthController();
export default authController;

// Expose logout function globally for easy access from HTML
window.logout = () => authController.logout();
