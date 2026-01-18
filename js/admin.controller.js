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
        this.currentTypeFilter = 'all';
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

                // Initialize upload path to current main path
                this.uploadModalPath = this.currentMediaPath || 'multimedia';
                this.navigateUploadModal(this.uploadModalPath);

                assetModal.classList.add('active');
            });
        }

        // Create Folder Header Button
        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => this.handleCreateFolder());
        }

        // Modal Navigation Buttons
        const modalUpBtn = document.getElementById('modal-up-btn');
        if (modalUpBtn) {
            modalUpBtn.addEventListener('click', () => {
                if (this.uploadModalPath !== 'multimedia') {
                    const parts = this.uploadModalPath.split('/');
                    parts.pop();
                    this.navigateUploadModal(parts.join('/'));
                }
            });
        }

        const modalNewFolderBtn = document.getElementById('modal-new-folder-btn');
        if (modalNewFolderBtn) {
            modalNewFolderBtn.addEventListener('click', () => this.handleModalCreateFolder());
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
                const files = e.target.files;
                if (files.length > 0) {
                    if (files.length === 1) {
                        document.getElementById('file-info').textContent = `${files[0].name} (${(files[0].size / 1024).toFixed(1)} KB)`;
                    } else {
                        document.getElementById('file-info').textContent = `${files.length} archivos seleccionados`;
                    }
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
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Set filter and reload
                this.currentTypeFilter = btn.dataset.filter;
                this.loadAssets();
            });
        });

        // Section Form Inputs (for Live Preview)
        const inputs = [
            'section-text',
            'section-file'
        ];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.updatePreview());
        });

        // Layout radio buttons
        document.querySelectorAll('input[name="section-layout"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
    }

    updatePreview() {
        const text = document.getElementById('section-text').value;
        const layout = document.querySelector('input[name="section-layout"]:checked')?.value || 'left';
        // Image logic: if file input has file, use local URL; if gallery selected, use that; else placeholder

        let imageUrl = '';
        const fileInput = document.getElementById('section-file');
        if (fileInput.files.length > 0) {
            imageUrl = URL.createObjectURL(fileInput.files[0]);
        } else if (this.selectedGalleryImage) {
            imageUrl = this.selectedGalleryImage;
        }

        const previewContainer = document.getElementById('section-preview');
        const previewImage = previewContainer.querySelector('.preview-image');
        const previewText = previewContainer.querySelector('.preview-text');

        // Update Text
        previewText.textContent = text || 'Tu texto aparecerá aquí...';

        // Update Image
        if (imageUrl) {
            const isVideo = imageUrl.match(/\.(mp4|webm|mov)$/i) || (fileInput.files[0]?.type.startsWith('video/'));
            if (isVideo) {
                previewImage.innerHTML = `<video src="${imageUrl}" autoplay muted loop playsinline></video>`;
            } else {
                previewImage.innerHTML = `<img src="${imageUrl}" alt="Preview">`;
            }
        } else {
            previewImage.innerHTML = '<div class="placeholder-image">Sin imagen</div>';
        }

        // Update Layout Class
        previewContainer.className = `section-card preview-card layout-${layout}`;
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

        // Default layout left
        const defaultLayout = document.querySelector('input[name="section-layout"][value="left"]');
        if (defaultLayout) defaultLayout.checked = true;

        this.updatePreview();
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
                        <div class="folder-actions">
                            <i class="fa-solid fa-trash delete-icon" title="Eliminar Carpeta"></i>
                        </div>
                    `;
                    // Navigate on click
                    item.addEventListener('click', (e) => {
                        if (e.target.classList.contains('delete-icon')) {
                            e.stopPropagation();
                            this.handleDeleteElement(folder.fullPath, 'folder');
                        } else {
                            this.navigateAssets(folder.fullPath);
                        }
                    });
                    grid.appendChild(item);
                });
            }

            // Render Files
            if (files.length > 0) {
                // Filter files logic
                const filteredFiles = files.filter(file => {
                    const isVideo = file.name.match(/\.(mp4|webm|mov)$/i);
                    if (this.currentTypeFilter === 'image') return !isVideo;
                    if (this.currentTypeFilter === 'video') return isVideo;
                    return true;
                });

                filteredFiles.forEach(asset => {
                    const card = document.createElement('div');
                    card.className = 'asset-card';
                    const isVideo = asset.name.match(/\.(mp4|webm|mov)$/i);
                    const icon = isVideo ? '<i class="fa-solid fa-video"></i>' : '';

                    card.innerHTML = `
                        <div class="asset-thumbnail">
                            ${icon ? `<div class="video-overlay"><i class="fa-solid fa-play"></i></div>` : ''}
                            <img src="${asset.url}" alt="${asset.name}" loading="lazy" style="${isVideo ? 'opacity:0.7' : ''}">
                        </div>
                        <div class="asset-info">
                            <div class="asset-name" title="${asset.name}">${asset.name}</div>
                            <i class="fa-solid fa-trash delete-icon" title="Eliminar Archivo"></i>
                        </div>
                    `;

                    // Handle delete
                    card.querySelector('.delete-icon').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleDeleteElement(asset.fullPath, 'file');
                    });

                    // Add click to preview or select if we were implementing selection here
                    // For assets tab, maybe just preview? Or nothing.

                    grid.appendChild(card);
                });
            }

            if (folders.length === 0 && files.length === 0) {
                grid.innerHTML += '<p style="width:100%; text-align:center; padding: 20px;">Carpeta vacía</p>';
            }

        } catch (error) {
            console.error('Error loading assets:', error);
            grid.innerHTML = '<p class="text-center error">Error al cargar archivos</p>';
        }
    }

    async handleCreateFolder() {
        const name = prompt('Nombre de la nueva carpeta:');
        if (!name) return;

        const cleanName = name.trim();
        if (cleanName.length === 0) return;

        if (cleanName.match(/[\/\\]/)) {
            alert('El nombre no puede contener barras "/" o "\\"');
            return;
        }

        try {
            await contentService.createFolder(this.currentMediaPath, cleanName);
            // Refresh
            this.navigateAssets(this.currentMediaPath);
        } catch (error) {
            alert('Error al crear carpeta: ' + error.message);
        }
    }

    async handleDeleteElement(path, type) {
        const msg = type === 'folder'
            ? '¿Estás seguro de eliminar esta carpeta y TODO su contenido? No se puede deshacer.'
            : '¿Eliminar este archivo?';

        if (!confirm(msg)) return;

        try {
            if (type === 'folder') {
                await contentService.deleteFolder(path);
            } else {
                await contentService.deleteFile(path);
            }
            // Refresh
            this.navigateAssets(this.currentMediaPath);
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    async navigateUploadModal(path) {
        this.uploadModalPath = path;
        const grid = document.getElementById('modal-folder-grid');
        const pathDisplay = document.getElementById('upload-current-path');
        const upBtn = document.getElementById('modal-up-btn');

        // Update display
        pathDisplay.textContent = path === 'multimedia' ? 'Raíz' : path.replace('multimedia/', '');

        // Update Up button state
        if (upBtn) {
            upBtn.disabled = path === 'multimedia';
            upBtn.style.opacity = path === 'multimedia' ? '0.5' : '1';
        }

        grid.innerHTML = '<div class="loader-small">Cargando...</div>';

        try {
            // Re-use service to list contents, but we essentially only care about folders
            const { folders } = await contentService.listMultimediaContents(path);

            grid.innerHTML = '';

            if (folders.length > 0) {
                folders.forEach(folder => {
                    const el = document.createElement('div');
                    el.className = 'modal-folder-card';
                    el.innerHTML = `
                        <i class="fa-solid fa-folder"></i>
                        <span class="folder-name">${folder.name}</span>
                    `;
                    el.addEventListener('click', () => {
                        this.navigateUploadModal(folder.fullPath);
                    });
                    grid.appendChild(el);
                });
            } else {
                grid.innerHTML = '<span style="font-size:12px; color:#aaa; grid-column:1/-1; text-align:center;">No hay subcarpetas</span>';
            }

        } catch (error) {
            console.error('Error navigating modal:', error);
            grid.innerHTML = '<p class="error">Error</p>';
        }
    }

    async handleModalCreateFolder() {
        const name = prompt('Nombre de nueva sub-carpeta:');
        if (!name) return;

        const cleanName = name.trim();
        if (cleanName.length === 0) return;

        if (cleanName.match(/[\/\\]/)) {
            alert('El nombre no puede contener barras "/" o "\\"');
            return;
        }

        try {
            await contentService.createFolder(this.uploadModalPath, cleanName);
            this.navigateUploadModal(this.uploadModalPath); // Refresh modal view
            // Also refresh main view if we are looking at the same place
            if (this.currentMediaPath === this.uploadModalPath) {
                this.navigateAssets(this.currentMediaPath);
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    async handleAssetUpload(e) {
        e.preventDefault();

        const fileInput = document.getElementById('asset-file');
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;

        const progressEl = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        progressEl.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Iniciando subida...';

        let completed = 0;
        let errors = 0;

        // Use the path selected inside the modal, NOT the background view path
        const uploadTarget = this.uploadModalPath || this.currentMediaPath;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressText.textContent = `Subiendo ${i + 1} de ${files.length}: ${file.name}`;

                try {
                    let fileToUpload = file;
                    if (file.type.startsWith('image/')) {
                        fileToUpload = await this.compressImage(file);
                    }

                    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const fileName = `${Date.now()}_${safeName}`;
                    const storagePath = `${uploadTarget}/${fileName}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytesResumable(storageRef, fileToUpload);

                    completed++;
                    const percent = (completed / files.length) * 100;
                    progressFill.style.width = `${percent}%`;

                } catch (err) {
                    console.error(`Error subiendo ${file.name}`, err);
                    errors++;
                }
            }

            document.getElementById('asset-modal').classList.remove('active');
            progressEl.classList.add('hidden');

            // Refresh main view if we uploaded to where we are currently looking
            if (this.currentMediaPath === uploadTarget) {
                this.navigateAssets(this.currentMediaPath);
            } else {
                // If we uploaded elsewhere, maybe we should ask to jump there? 
                // For now, just stay where we are, user knows they sent it elsewhere.
            }

            if (errors > 0) alert(`Subida completada con ${errors} errores.`);

        } catch (error) {
            console.error('Error general:', error);
            alert('Error: ' + error.message);
            progressEl.classList.add('hidden');
        }
    }

    /**
     * Compress image to WebP format. Returns original file if not an image.
     */
    async compressImage(file, maxWidth = 1920, quality = 0.8) {
        if (!file.type.startsWith('image/')) return file;

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
            sections.forEach((section, index) => {
                const card = document.createElement('div');
                card.className = `section-card layout-${section.layout || 'left'}`;
                card.draggable = true;
                card.dataset.id = section.id;
                card.dataset.order = section.order || index;

                // Tags HTML
                const tagsHtml = (section.tags || []).map(t => `<span class="role-badge prescriptor">${t}</span>`).join(' ');

                card.innerHTML = `
                    <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                    <div class="section-image">
                        ${section.imageUrl
                        ? (section.imageUrl.match(/\.(mp4|webm)$/i) ? '<video src="' + section.imageUrl + '" muted></video>' : '<img src="' + section.imageUrl + '">')
                        : '<div class="placeholder">No img</div>'}
                    </div>
                    <div class="section-content">
                        <div class="section-info">
                            <h4 class="section-title">${section.title || '(Sin título)'}</h4>
                            <div class="section-tags">${tagsHtml}</div>
                            <p class="section-text">${section.text}</p>
                            <span class="layout-badge"><i class="fa-solid fa-${section.layout === 'right' ? 'arrow-right' : (section.layout === 'top' ? 'arrow-up' : (section.layout === 'bottom' ? 'arrow-down' : 'arrow-left'))}"></i> ${section.layout || 'left'}</span>
                        </div>
                        <div class="section-actions">
                            <button class="btn-icon clone" onclick="adminController.handleCloneSection('${section.id}')" title="Clonar a otra vertical">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="btn-icon delete" onclick="adminController.deleteSection('${section.id}')" title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

                // Drag Events
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    card.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', section.id);
                });

                card.addEventListener('dragend', async (e) => {
                    card.classList.remove('dragging');
                    // Recalculate order based on new positions
                    const newOrder = Array.from(list.children).map(c => c.dataset.id);
                    // We only need to update if order changed significantly, but for simplicity we can just update all or smart update.
                    // For now, let's just log it. Real persistence happens in 'drop' or we can trigger a batch update here.
                    // Actually best practice is to update during drop or dragend.

                    await Promise.all(newOrder.map((id, idx) =>
                        contentService.updateSectionOrder(this.currentVertical, id, idx)
                    ));
                });

                list.appendChild(card);
            });

            // List Drag Over Event
            list.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
                const afterElement = this.getDragAfterElement(list, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (afterElement == null) {
                    list.appendChild(draggable);
                } else {
                    list.insertBefore(draggable, afterElement);
                }
            });

        } catch (error) {
            console.error('Error loading sections:', error);
            list.innerHTML = '<p class="text-center error">Error al cargar secciones</p>';
        }
    }

    // Helper for Drag and Drop
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.section-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async handleCloneSection(sectionId) {
        const verticals = [
            { id: 'bts', name: 'Residencial BTS' },
            { id: 'btr', name: 'Residencial BTR' },
            { id: 'office', name: 'Oficinas' },
            { id: 'hotel', name: 'Hoteles' },
            { id: 'retail', name: 'Retail' },
            { id: 'security', name: 'Seguridad' } // Adding security from context
        ].filter(v => v.id !== this.currentVertical);

        const target = prompt(
            `Escribe el ID de la vertical destino (o varias separadas por coma):\n\nOpciones: ${verticals.map(v => v.id).join(', ')}`
        );

        if (!target) return;

        const targets = target.split(',').map(t => t.trim().toLowerCase());
        const validTargets = verticals.map(v => v.id);
        const finalTargets = targets.filter(t => validTargets.includes(t));

        if (finalTargets.length === 0) {
            alert('Ninguna vertical válida seleccionada.');
            return;
        }

        try {
            await contentService.cloneSection(this.currentVertical, sectionId, finalTargets);
            alert(`Sección clonada exitosamente a: ${finalTargets.join(', ')}`);
        } catch (e) {
            alert('Error al clonar: ' + e.message);
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
                        this.updatePreview(); // Update preview when gallery item selected
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
            const title = document.getElementById('section-title').value.trim();
            const tagsStr = document.getElementById('section-tags').value.trim();
            const text = document.getElementById('section-text').value;
            const layout = document.querySelector('input[name="section-layout"]:checked')?.value || 'left';
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

            // Validate tags
            if (!tagsStr) throw new Error('Las etiquetas son obligatorias');
            const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

            let imageUrl = null;
            let storagePath = null;

            if (activeTab === 'upload') {
                const fileInput = document.getElementById('section-file');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];

                    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    storagePath = `${this.currentMediaPath}/${fileName}`;

                    const storageRef = ref(storage, storagePath);
                    const uploadTask = await uploadBytesResumable(storageRef, file);
                    imageUrl = await getDownloadURL(uploadTask.ref);
                } else {
                    // It's possible to create a text-only section or keep existing logic?
                    // For now, let's allow image to be optional if not strictly required, 
                    // BUT the original code threw error. Let's keep it strict for now unless user asked otherwise.
                    // But wait, user might just want to change text/title? No, this is ADD section. 
                    throw new Error('Por favor selecciona una imagen para subir');
                }
            } else {
                // Gallery
                if (!this.selectedGalleryImage) {
                    throw new Error('Por favor selecciona una imagen de la galería');
                }
                imageUrl = this.selectedGalleryImage;
            }

            const data = {
                title,
                tags,
                text,
                imageUrl,
                imagePath: storagePath,
                layout
            };

            await contentService.addSection(this.currentVertical, data);

            document.getElementById('section-modal').classList.remove('active');
            this.loadSections();
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
