/**
 * 2N Presenter - Admin Controller
 * Handles user management, asset uploads, and content editing
 */

import { auth, db, storage } from './firebase-init.js';
import { contentService } from './services/content.service.js';
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
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import {
    createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import authController from './auth.controller.js';
import i18n from './i18n.js';

class AdminController {
    constructor() {
        this.currentSection = 'users';
        this.currentVertical = 'bts';
        this.editingUserId = null;
        this.currentMediaPath = 'multimedia'; // Initialize explorer root
        this.init();
    }

    async init() {
        // Require admin role
        try {
            await authController.requireAdmin();
            console.log('Admin check passed');
        } catch (e) {
            console.error('Admin check failed', e);
            document.body.innerHTML = '<h1>No autorizado</h1>';
            return; // Will redirect
        }

        try {
            // Update UI with current user email
            const userEmailEl = document.getElementById('current-user-email');
            if (userEmailEl && auth.currentUser) {
                userEmailEl.textContent = auth.currentUser.email;
            } else {
                console.warn('Could not set email', { userEmailEl, user: auth.currentUser });
            }

            this.bindNavigation();
            this.bindModals();
            this.bindForms();
            this.loadUsers();
        } catch (err) {
            console.error('Init error', err);
            alert('Error iniciando admin: ' + err.message);
        }
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

        // Section Modal
        const addSectionBtn = document.getElementById('add-section-btn');
        const sectionModal = document.getElementById('section-modal');

        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => {
                this.resetSectionModal();
                sectionModal.classList.add('active');
            });
        }

        // Close modals
        document.querySelectorAll('.modal-close, .modal-cancel, .modal-backdrop').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
            });
        });

        // Tab Switching in Section Modal
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.image-tab-content').forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

                if (btn.dataset.tab === 'gallery') {
                    this.loadMultimediaGallery();
                }
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

        const sectionFile = document.getElementById('section-file');
        if (sectionFile) {
            sectionFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) document.getElementById('section-file-info').textContent = file.name;
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

        // Section form
        const sectionForm = document.getElementById('section-form');
        if (sectionForm) {
            sectionForm.addEventListener('submit', (e) => this.handleSaveSection(e));
        }

        // Filter
        const filterVertical = document.getElementById('filter-vertical');
        if (filterVertical) {
            filterVertical.addEventListener('change', () => this.loadAssets());
        }
    }

    resetSectionModal() {
        document.getElementById('section-form').reset();
        this.selectedGalleryImage = null;
        document.getElementById('section-file-info').textContent = '';
        if (document.querySelector('.tab-btn[data-tab="upload"]')) {
            document.querySelector('.tab-btn[data-tab="upload"]').click();
        }
        const grid = document.getElementById('multimedia-grid');
        if (grid) grid.innerHTML = '<p>Cargando imágenes...</p>';
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
    // ASSETS MANAGEMENT (EXPLORER)
    // ============================
    async loadAssets() {
        this.navigateAssets(this.currentMediaPath);
    }

    async navigateAssets(path) {
        this.currentMediaPath = path;
        const grid = document.getElementById('assets-grid');
        grid.innerHTML = '<div class="loader">Cargando...</div>';

        try {
            const { folders, files } = await contentService.listMultimediaContents(path);

            grid.innerHTML = '';

            // "Up" button if not at root
            if (path !== 'multimedia') {
                const upItem = document.createElement('div');
                upItem.className = 'asset-card gallery-folder up-folder';
                upItem.innerHTML = `
                    <div class="folder-icon"><i class="fa-solid fa-arrow-turn-up"></i></div>
                    <div class="folder-name">..</div>
                `;
                upItem.addEventListener('click', () => {
                    const parts = path.split('/');
                    parts.pop();
                    this.navigateAssets(parts.join('/'));
                });
                grid.appendChild(upItem);
            }

            // Render Folders
            if (folders.length > 0) {
                folders.forEach(folder => {
                    const item = document.createElement('div');
                    item.className = 'asset-card gallery-folder';
                    item.innerHTML = `
                        <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                        <div class="folder-name">${folder.name}</div>
                    `;
                    item.addEventListener('click', () => {
                        this.navigateAssets(folder.fullPath);
                    });
                    grid.appendChild(item);
                });
            }

            // Render Files
            if (files.length > 0) {
                files.forEach(asset => {
                    const card = document.createElement('div');
                    card.className = 'asset-card';
                    card.innerHTML = `
                        <div class="asset-thumbnail">
                            <img src="${asset.url}" alt="${asset.name}" loading="lazy">
                        </div>
                        <div class="asset-info">
                            <div class="asset-name">${asset.name}</div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }

            if (folders.length === 0 && files.length === 0) {
                grid.innerHTML += '<p style="width:100%; text-align:center;">Carpeta vacía</p>';
            }

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

        const progressEl = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        progressEl.classList.remove('hidden');

        try {
            // Compress image before upload (client-side)
            const compressedFile = await this.compressImage(file);

            // Upload to Current Explorer Path
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storagePath = `${this.currentMediaPath}/${fileName}`;
            const storageRef = ref(storage, storagePath);
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
                    document.getElementById('asset-modal').classList.remove('active');
                    progressEl.classList.add('hidden');
                    // Refresh current view
                    this.navigateAssets(this.currentMediaPath);
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
            const sections = await contentService.getSections(this.currentVertical);

            if (sections.length === 0) {
                list.innerHTML = '<p class="text-center">No hay secciones para esta vertical</p>';
                return;
            }

            list.innerHTML = '';
            sections.forEach(section => {
                const card = document.createElement('div');
                card.className = 'section-card';
                card.innerHTML = `
                    <div class="section-image">
                        <img src="${section.imageUrl}" alt="Section Image">
                    </div>
                    <div class="section-content">
                        <p class="section-text">${section.text}</p>
                        <div class="section-actions">
                            <button class="btn-icon delete" onclick="adminController.deleteSection('${section.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading sections:', error);
            list.innerHTML = '<p class="text-center error">Error al cargar secciones</p>';
        }
    }

    async loadMultimediaGallery() {
        this.navigateMultimedia(this.currentMediaPath);
    }

    async navigateMultimedia(path) {
        this.currentMediaPath = path;
        const grid = document.getElementById('multimedia-grid');
        grid.innerHTML = '<div class="loader">Loading...</div>';

        // Update breadcrumb (simple version)
        // You could add a visible breadcrumb element here if the UI supports it

        try {
            const { folders, files } = await contentService.listMultimediaContents(path);

            grid.innerHTML = '';

            // "Up" button if not at root
            if (path !== 'multimedia') {
                const upItem = document.createElement('div');
                upItem.className = 'gallery-folder up-folder';
                upItem.innerHTML = `
                    <div class="folder-icon"><i class="fa-solid fa-arrow-turn-up"></i></div>
                    <div class="folder-name">..</div>
                `;
                upItem.addEventListener('click', () => {
                    const parts = path.split('/');
                    parts.pop();
                    this.navigateMultimedia(parts.join('/'));
                });
                grid.appendChild(upItem);
            }

            // Render Folders
            if (folders.length > 0) {
                folders.forEach(folder => {
                    const item = document.createElement('div');
                    item.className = 'gallery-folder';
                    item.innerHTML = `
                        <div class="folder-icon"><i class="fa-solid fa-folder"></i></div>
                        <div class="folder-name">${folder.name}</div>
                    `;
                    item.addEventListener('click', () => {
                        this.navigateMultimedia(folder.fullPath);
                    });
                    grid.appendChild(item);
                });
            }

            // Render Files
            if (files.length > 0) {
                files.forEach(img => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    item.innerHTML = `<img src="${img.url}" loading="lazy" title="${img.name}">`;

                    item.addEventListener('click', () => {
                        document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
                        item.classList.add('selected');
                        this.selectedGalleryImage = img.url;
                    });
                    grid.appendChild(item);
                });
            }

            if (folders.length === 0 && files.length === 0) {
                grid.innerHTML += '<p style="width:100%">Carpeta vacía</p>';
            }

        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p class="error">Error cargando galería</p>';
        }
    }

    async handleSaveSection(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
            const text = document.getElementById('section-text').value;
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

            let imageUrl = null;
            let storagePath = null;

            if (activeTab === 'upload') {
                const fileInput = document.getElementById('section-file');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];

                    // Upload to current explorer path
                    // If user wants a new folder, we could prompt, but for now let's use the current path
                    // This allows "Navigate to 2n -> Upload"

                    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    storagePath = `${this.currentMediaPath}/${fileName}`;

                    const storageRef = ref(storage, storagePath);
                    const uploadTask = await uploadBytesResumable(storageRef, file);
                    imageUrl = await getDownloadURL(uploadTask.ref);
                } else {
                    throw new Error('Por favor selecciona una imagen para subir');
                }
            } else {
                // Gallery
                if (!this.selectedGalleryImage) {
                    throw new Error('Por favor selecciona una imagen de la galería');
                }
                imageUrl = this.selectedGalleryImage;
            }

            await contentService.addSection(this.currentVertical, imageUrl, text, storagePath);

            document.getElementById('section-modal').classList.remove('active');

            // Reload sections list
            this.loadSections();

            // Refresh gallery to show new upload (if we were in that mode, though modal closes)
            this.loadMultimediaGallery();

        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async deleteSection(sectionId) {
        if (!confirm('¿Eliminar esta sección?')) return;

        try {
            await contentService.deleteSection(this.currentVertical, sectionId);
            this.loadSections();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    }
}

// Crear instancia única y exponer globalmente
const adminController = new AdminController();
window.adminController = adminController;

export default adminController;
