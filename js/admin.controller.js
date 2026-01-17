/**
 * 2N Presenter - Admin Controller
 * Handles user management, asset uploads, and content editing
 */

import { auth, db, storage } from './firebase-init.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';
import {
    createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import authController from './auth.controller.js';
import i18n from './i18n.js';

class AdminController {
    constructor() {
        this.currentSection = 'users';
        this.currentVertical = 'bts';
        this.editingUserId = null;
        this.init();
    }

    async init() {
        // Require admin role
        try {
            await authController.requireAdmin();
        } catch (e) {
            return; // Will redirect
        }

        // Update UI with current user email
        const userEmailEl = document.getElementById('current-user-email');
        if (userEmailEl && auth.currentUser) {
            userEmailEl.textContent = auth.currentUser.email;
        }

        this.bindNavigation();
        this.bindModals();
        this.bindForms();
        this.loadUsers();
    }

    // ============================
    // NAVIGATION
    // ============================
    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        document.querySelectorAll('.vertical-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const vertical = tab.getAttribute('data-vertical');
                this.switchVertical(vertical);
            });
        });
    }

    switchSection(section) {
        this.currentSection = section;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === section);
        });

        // Update sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });

        // Load data for section
        switch (section) {
            case 'users':
                this.loadUsers();
                break;
            case 'assets':
                this.loadAssets();
                break;
            case 'content':
                this.loadSections();
                break;
        }
    }

    switchVertical(vertical) {
        this.currentVertical = vertical;
        document.querySelectorAll('.vertical-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-vertical') === vertical);
        });
        this.loadSections();
    }

    // ============================
    // MODALS
    // ============================
    bindModals() {
        // User modal
        const addUserBtn = document.getElementById('add-user-btn');
        const userModal = document.getElementById('user-modal');

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.editingUserId = null;
                document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
                document.getElementById('user-form').reset();
                userModal.classList.add('active');
            });
        }

        // Asset modal
        const uploadAssetBtn = document.getElementById('upload-asset-btn');
        const assetModal = document.getElementById('asset-modal');

        if (uploadAssetBtn) {
            uploadAssetBtn.addEventListener('click', () => {
                document.getElementById('asset-form').reset();
                document.getElementById('file-info').textContent = '';
                assetModal.classList.add('active');
            });
        }

        // Close modals
        document.querySelectorAll('.modal-close, .modal-cancel, .modal-backdrop').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            });
        });

        // File input display
        const fileInput = document.getElementById('asset-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    document.getElementById('file-info').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                }
            });
        }
    }

    // ============================
    // FORMS
    // ============================
    bindForms() {
        // User form
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        }

        // Asset form
        const assetForm = document.getElementById('asset-form');
        if (assetForm) {
            assetForm.addEventListener('submit', (e) => this.handleAssetUpload(e));
        }

        // Filter
        const filterVertical = document.getElementById('filter-vertical');
        if (filterVertical) {
            filterVertical.addEventListener('change', () => this.loadAssets());
        }
    }

    // ============================
    // USERS CRUD
    // ============================
    async loadUsers() {
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(query(usersRef, orderBy('createdAt', 'desc')));

            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay usuarios</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.email || '-'}</td>
                    <td>${user.displayName || '-'}</td>
                    <td><span class="role-badge ${user.role}">${user.role}</span></td>
                    <td>${user.language?.toUpperCase() || 'ES'}</td>
                    <td>
                        <div class="table-actions">
                            <button onclick="adminController.editUser('${doc.id}')" title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="delete" onclick="adminController.deleteUser('${doc.id}')" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center error">Error al cargar usuarios</td></tr>';
        }
    }

    async handleUserSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('user-email').value.trim();
        const displayName = document.getElementById('user-name').value.trim();
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;
        const language = document.getElementById('user-lang').value;

        try {
            if (this.editingUserId) {
                // Update existing user
                await updateDoc(doc(db, 'users', this.editingUserId), {
                    displayName,
                    role,
                    language,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new user (requires password)
                if (!password) {
                    alert('La contraseña es obligatoria para nuevos usuarios');
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email,
                    displayName,
                    role,
                    language,
                    createdAt: serverTimestamp()
                });
            }

            document.getElementById('user-modal').classList.remove('active');
            this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error: ' + error.message);
        }
    }

    async editUser(userId) {
        this.editingUserId = userId;

        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) {
                alert('Usuario no encontrado');
                return;
            }

            const user = userDoc.data();
            document.getElementById('user-modal-title').textContent = 'Editar Usuario';
            document.getElementById('user-email').value = user.email || '';
            document.getElementById('user-name').value = user.displayName || '';
            document.getElementById('user-password').value = '';
            document.getElementById('user-role').value = user.role || 'prescriptor';
            document.getElementById('user-lang').value = user.language || 'es';

            document.getElementById('user-modal').classList.add('active');
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }

    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar: ' + error.message);
        }
    }

    // ============================
    // ASSETS MANAGEMENT
    // ============================
    async loadAssets() {
        const grid = document.getElementById('assets-grid');
        if (!grid) return;

        grid.innerHTML = '<p class="text-center">Cargando...</p>';

        try {
            const assetsRef = collection(db, 'assets');
            let q = query(assetsRef, orderBy('uploadedAt', 'desc'));

            const filter = document.getElementById('filter-vertical')?.value;
            if (filter && filter !== 'all') {
                q = query(assetsRef, where('verticals', 'array-contains', filter), orderBy('uploadedAt', 'desc'));
            }

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                grid.innerHTML = '<p class="text-center">No hay archivos</p>';
                return;
            }

            grid.innerHTML = '';
            snapshot.forEach(doc => {
                const asset = doc.data();
                const card = document.createElement('div');
                card.className = 'asset-card';
                card.innerHTML = `
                    <div class="asset-thumbnail">
                        <img src="${asset.thumbnailUrl || asset.url}" alt="${asset.originalName}" loading="lazy">
                    </div>
                    <div class="asset-info">
                        <div class="asset-name">${asset.originalName}</div>
                        <div class="asset-meta">${asset.verticals?.join(', ') || 'Sin categoría'}</div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading assets:', error);
            grid.innerHTML = '<p class="text-center error">Error al cargar archivos</p>';
        }
    }

    async handleAssetUpload(e) {
        e.preventDefault();

        const fileInput = document.getElementById('asset-file');
        const file = fileInput.files[0];
        if (!file) return;

        const verticals = Array.from(document.querySelectorAll('input[name="verticals"]:checked'))
            .map(cb => cb.value);

        const progressEl = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        progressEl.classList.remove('hidden');

        try {
            // Compress image before upload (client-side)
            const compressedFile = await this.compressImage(file);

            // Upload to Storage
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = ref(storage, `assets/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressFill.style.width = `${progress}%`;
                    progressText.textContent = `${Math.round(progress)}%`;
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('Error al subir: ' + error.message);
                    progressEl.classList.add('hidden');
                },
                async () => {
                    // Get download URL
                    const url = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save metadata to Firestore
                    await setDoc(doc(collection(db, 'assets')), {
                        url,
                        thumbnailUrl: url, // For now, same as main (could generate separate)
                        originalName: file.name,
                        type: 'image',
                        verticals,
                        uploadedBy: auth.currentUser?.uid,
                        uploadedAt: serverTimestamp()
                    });

                    document.getElementById('asset-modal').classList.remove('active');
                    progressEl.classList.add('hidden');
                    this.loadAssets();
                }
            );
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
            progressEl.classList.add('hidden');
        }
    }

    /**
     * Compress image to WebP format with max 1920px width
     */
    async compressImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize if needed
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to WebP blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    }, 'image/webp', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // ============================
    // CONTENT SECTIONS
    // ============================
    async loadSections() {
        const list = document.getElementById('sections-list');
        if (!list) return;

        list.innerHTML = '<p class="text-center">Cargando...</p>';

        try {
            const sectionsRef = collection(db, 'sections');
            const q = query(
                sectionsRef,
                where('verticalId', '==', this.currentVertical),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                list.innerHTML = '<p class="text-center">No hay secciones para esta vertical</p>';
                return;
            }

            list.innerHTML = '';
            snapshot.forEach(doc => {
                const section = doc.data();
                const card = document.createElement('div');
                card.className = 'section-card';
                card.innerHTML = `
                    <h3>${section.title?.[i18n.currentLang] || section.title?.es || 'Sin título'}</h3>
                    <p>${section.content?.[i18n.currentLang] || section.content?.es || ''}</p>
                `;
                list.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
            list.innerHTML = '<p class="text-center error">Error al cargar secciones</p>';
        }
    }
}

// Create singleton and expose globally
const adminController = new AdminController();
window.adminController = adminController;

export default adminController;
