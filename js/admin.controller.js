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
                assetModal.classList.add('active');
            });
        }

        // Create Folder Header Button
        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => this.handleCreateFolder());
        }

        // ... existing listeners ...

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

            // New Folder Card
            const newFolderItem = document.createElement('div');
            newFolderItem.className = 'asset-card gallery-folder new-folder';
            newFolderItem.innerHTML = `
                <div class="folder-icon"><i class="fa-solid fa-folder-plus"></i></div>
                <div class="folder-name">Nueva Carpeta</div>
            `;
            newFolderItem.addEventListener('click', () => this.handleCreateFolder());
            grid.appendChild(newFolderItem);

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

        // Basic validation
        if (!name.match(/^[a-zA-Z0-9_\-\.]+$/)) {
            alert('Nombre inválido. Usa solo letras, números, guiones y puntos.');
            return;
        }

        try {
            await contentService.createFolder(this.currentMediaPath, name);
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

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressText.textContent = `Subiendo ${i + 1} de ${files.length}: ${file.name}`;

                try {
                    // Compress/Optimize Logic
                    let fileToUpload = file;
                    if (file.type.startsWith('image/')) {
                        fileToUpload = await this.compressImage(file);
                    } else if (file.type.startsWith('video/')) {
                        // Basic size check for videos (e.g., 50MB warning)
                        if (file.size > 50 * 1024 * 1024) {
                            console.warn(`Video grande omitido/advertencia: ${file.name}`);
                            // We allow it but ideally show warning. In loop, confirmation is annoying.
                            // Let's just create a toast or console log for now.
                        }
                    }

                    // Upload to Current Explorer Path
                    // Fix filename for safety
                    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const fileName = `${Date.now()}_${safeName}`;
                    const storagePath = `${this.currentMediaPath}/${fileName}`;
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

            // Finished
            document.getElementById('asset-modal').classList.remove('active');
            progressEl.classList.add('hidden');
            this.navigateAssets(this.currentMediaPath);

            if (errors > 0) {
                alert(`Subida completada con ${errors} errores.`);
            } else {
                // Success feedback?
            }

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
            sections.forEach(section => {
                const card = document.createElement('div');
                card.className = `section-card layout-${section.layout || 'left'}`; // Apply saved layout class

                // For list view, we might want to keep it consistent or show mini-layout. 
                // Let's keep consistent left-image structure but maybe add an icon indicating layout?
                // OR actually respect the layout if CSS supports it (our CSS for section-card is flex).
                // If we add layout-right, it reverses. Top/Bottom changes flex-direction.
                // admin.css logic: .section-card is flex row. 
                // We need to add specific layout support for these cards in the list too if we want them to reflect reality.
                // Let's rely on the classes we added to css/admin.css targetting .preview-card, but maybe we should generalize them?
                // Actually the preview-card rules target `.preview-card.layout-*`. 
                // Let's check if we can make them apply to `.section-card.layout-*`.

                // Re-using the structure for admin list view:
                card.innerHTML = `
                    <div class="section-image">
                        ${section.imageUrl
                        ? (section.imageUrl.match(/\.(mp4|webm)$/i) ? '<video src="' + section.imageUrl + '" muted></video>' : '<img src="' + section.imageUrl + '">')
                        : '<div class="placeholder">No img</div>'}
                    </div>
                    <div class="section-content">
                        <div class="section-info">
                            <p class="section-text">${section.text}</p>
                            <span class="layout-badge"><i class="fa-solid fa-${section.layout === 'right' ? 'arrow-right' : (section.layout === 'top' ? 'arrow-up' : (section.layout === 'bottom' ? 'arrow-down' : 'arrow-left'))}"></i> ${section.layout || 'left'}</span>
                        </div>
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
            const text = document.getElementById('section-text').value;
            const layout = document.querySelector('input[name="section-layout"]:checked')?.value || 'left';
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

            await contentService.addSection(this.currentVertical, imageUrl, text, storagePath, layout);

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
