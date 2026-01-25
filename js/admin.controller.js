/**
 * 2N Presenter - Admin Controller
 * Handles user management, asset uploads, and content editing
 */

import { auth, db, storage } from './firebase-init.js';
import { contentService } from './services/content.service.js';
import { pptService } from './services/ppt.service.js?v=dark15';
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
import { compressImage } from './utils/image.utils.js';
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

        // Global PPT Button
        const pptBtn = document.getElementById('global-ppt-btn');
        if (pptBtn) {
            pptBtn.addEventListener('click', async () => {
                const btnContent = pptBtn.innerHTML;
                try {
                    pptBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

                    // Fetch all sections for current vertical
                    const sections = await contentService.getSections(this.currentVertical);

                    // Format Vertical Name properly
                    const verticalName = this.currentVertical.charAt(0).toUpperCase() + this.currentVertical.slice(1);

                    // Fetch Meta
                    const meta = await contentService.getVerticalMeta(this.currentVertical);

                    await pptService.exportFullPresentation(verticalName, sections, meta || {});

                } catch (error) {
                    console.error('PPT Export Error:', error);
                    alert('Error al generar la presentación.');
                } finally {
                    pptBtn.innerHTML = btnContent;
                }
            });
        }
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
        if (!vertical) return; // Prevent crash if button has no data-vertical
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

        // Section form - Submit logic
        const sectionFormEl = document.getElementById('section-form');
        if (sectionFormEl) {
            sectionFormEl.addEventListener('submit', (e) => this.handleSaveSection(e));
        }

        // Section Save Button (External to form)
        const saveSectionBtn = document.getElementById('save-section-btn');
        if (saveSectionBtn) {
            saveSectionBtn.addEventListener('click', (e) => this.handleSaveSection(e));
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

        // Alignment radio buttons
        document.querySelectorAll('input[name="section-align"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });

        // Intro Editor Bindings
        const addBenefitBtn = document.getElementById('add-benefit-btn');
        if (addBenefitBtn) {
            addBenefitBtn.addEventListener('click', () => this.addBenefitInput());
        }

        const saveIntroBtn = document.getElementById('save-intro-btn');
        if (saveIntroBtn) {
            saveIntroBtn.addEventListener('click', () => this.handleSaveIntro());
        }

        const saveHeroBtn = document.getElementById('save-hero-btn');
        if (saveHeroBtn) {
            saveHeroBtn.addEventListener('click', () => this.handleSaveHero());
        }

        const heroFile = document.getElementById('hero-file');
        const heroPosX = document.getElementById('hero-pos-x'); // Hidden inputs
        const heroPosY = document.getElementById('hero-pos-y');
        const openLibraryBtn = document.getElementById('open-library-btn');

        // Live Preview Bindings (Text)
        const bindPreview = (inputId, previewId, isBadge = false) => {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            if (input && preview) {
                input.addEventListener('input', () => {
                    preview.textContent = input.value || (isBadge ? 'Badge' : (inputId.includes('subtitle') ? 'Subtítulo' : 'Título'));
                });
            }
        };
        bindPreview('hero-title', 'preview-title');
        bindPreview('hero-subtitle', 'preview-subtitle');
        bindPreview('hero-badge', 'preview-badge', true);

        // Badge Color
        document.querySelectorAll('input[name="hero-color"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const badge = document.getElementById('preview-badge');
                if (badge) {
                    badge.className = 'hero-preview-badge ' + e.target.value;
                }
            });
        });

        // Initialize Drag Logic
        this.initHeroDrag(heroPosX, heroPosY);

        if (heroFile) {
            heroFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    document.getElementById('hero-file-info').textContent = file.name;
                    // Preview local file
                    const reader = new FileReader();
                    reader.onload = (e) => this.updateHeroPreview(e.target.result);
                    reader.readAsDataURL(file);
                }
            });
        }

        if (heroPosX && heroPosY) {
            // If values change programmatically or manually
            // Not strictly needed if drag updates style directly, but good for sync
        }

        if (openLibraryBtn) {
            openLibraryBtn.addEventListener('click', () => this.openAssetPicker('hero'));
        }

        // Picker Modal Close
        document.getElementById('close-asset-picker')?.addEventListener('click', () => {
            document.getElementById('asset-picker-modal').classList.remove('active');
        });
    }

    initHeroDrag(inputX, inputY) {
        const container = document.getElementById('hero-preview-container');
        if (!container) return;

        let isDragging = false;
        let startX, startY;
        let initialPosX = 50, initialPosY = 50;

        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Get current percentage values
            initialPosX = parseFloat(inputX.value) || 50;
            initialPosY = parseFloat(inputY.value) || 50;

            container.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const rect = container.getBoundingClientRect();
            // Calculate delta as percentage of container dimensions
            // Movement sensitivity: 1px = 0.5% change? or 1 to 1 mapping with container pixels?
            // To make it feel like "dragging the image", moving mouse RIGHT should move background position RIGHT (increasing %).
            // Sensitivity factor helps control speed




            // Re-calc: standard behavior is usually inverted for "pan", but consistent for "position".
            // Let's try direct mapping. Use sensitivity based on container width to be precise.
            const pxToPercentX = (1 / rect.width) * 100;
            const pxToPercentY = (1 / rect.height) * 100;

            // Invert logic: Dragging Left (negative delta) reveals right side (position increases?)
            // background-position: 0% = left edge. 100% = right edge.
            // If I see left edge (0%) and drag Left... I want to see right part... so position moves to 100%.
            // So Drag Left (-delta) -> Increase Position (+).

            let newX = initialPosX - ((e.clientX - startX) * pxToPercentX);
            let newY = initialPosY - ((e.clientY - startY) * pxToPercentY);

            // Clamp 0-100
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));

            inputX.value = newX;
            inputY.value = newY;

            this.updateHeroPreview(null, newX, newY);
        });

        const stopDrag = () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'move';
            }
        };

        window.addEventListener('mouseup', stopDrag);
    }

    updateHeroPreview(imageUrl = null, x = null, y = null) {
        const bgDiv = document.getElementById('hero-preview-bg');
        if (!bgDiv) return; // Might be old element if HTML didn't update yet (but it should have)

        if (imageUrl) {
            bgDiv.style.backgroundImage = `url('${imageUrl}')`;
        }

        if (x !== null && y !== null) {
            bgDiv.style.backgroundPosition = `${x}% ${y}%`;
        }
    }

    // ============================
    // HERO & INTRO LOGIC
    // ============================
    async handleSaveHero() {
        const btn = document.getElementById('save-hero-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const heroTitle = document.getElementById('hero-title').value.trim();
            const heroSubtitle = document.getElementById('hero-subtitle').value.trim();
            const badgeText = document.getElementById('hero-badge').value.trim();
            const badgeColor = document.querySelector('input[name="hero-color"]:checked')?.value || 'blue';

            let heroImageUrl = null;
            let heroImagePath = null;

            const fileInput = document.getElementById('hero-file');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];

                // Validate Type
                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    throw new Error('Formato no soportado. Usa JPG, PNG o WEBP.');
                }

                const fileName = `hero_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                heroImagePath = `${this.currentMediaPath}/${fileName}`;

                // Compress (Hero: 1920px, 0.8 quality)
                const compressedBlob = await compressImage(file, 1920, 0.8);

                const storageRef = ref(storage, heroImagePath);
                const uploadTask = await uploadBytesResumable(storageRef, compressedBlob);
                heroImageUrl = await getDownloadURL(uploadTask.ref);
            }

            const data = {
                heroTitle,
                heroSubtitle,
                badgeText,
                badgeColor
            };

            if (heroImageUrl) {
                data.heroImageUrl = heroImageUrl;
                data.heroImagePath = heroImagePath;
            }

            await contentService.updateVerticalMeta(this.currentVertical, data);
            alert('Portada actualizada correctamente');

        } catch (error) {
            console.error('Save Hero Error:', error);
            const msg = error.message || error.code || 'Error desconocido';
            alert('Error al guardar portada: ' + msg);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
    addBenefitInput(value = '') {
        const container = document.getElementById('benefits-container');
        const div = document.createElement('div');
        div.className = 'benefit-item';
        div.style.display = 'flex';
        div.style.gap = '10px';

        div.innerHTML = `
            <input type="text" value="${value}" placeholder="Beneficio/Capacidad" style="flex:1;">
            <button class="btn-icon delete" title="Eliminar" style="color:var(--text-error);" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    }

    async handleSaveIntro() {
        const btn = document.getElementById('save-intro-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const title = document.getElementById('intro-title').value.trim();
            const subtitle = document.getElementById('intro-subtitle').value.trim();
            const text = document.getElementById('intro-text').value.trim();

            // Collect benefits
            const benefitInputs = document.querySelectorAll('#benefits-container input');
            const benefits = Array.from(benefitInputs).map(input => input.value.trim()).filter(v => v.length > 0);

            await contentService.updateVerticalMeta(this.currentVertical, {
                introTitle: title,
                introSubtitle: subtitle,
                introText: text,
                benefits: benefits
            });

            alert('Introducción actualizada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al guardar: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    updatePreview() {
        const text = document.getElementById('section-text').value;
        const layout = document.querySelector('input[name="section-layout"]:checked')?.value || 'left';
        const textAlign = document.querySelector('input[name="section-align"]:checked')?.value || 'left';
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
        previewText.style.textAlign = textAlign; // Apply alignment

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

        // Default align left
        const defaultAlign = document.querySelector('input[name="section-align"][value="left"]');
        if (defaultAlign) defaultAlign.checked = true;

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

                // Note: This only works if logged in as admin AND using secondary auth app or cloud function
                // Client side creation logs you in as the new user immediately, booting the admin.
                // For this demo, we assume it works or we use a workaround (create secondary app).
                // Or simply: 
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
        if (this.currentSection !== 'content') return; // Only load if active

        const container = document.getElementById('sections-list');
        container.innerHTML = '<div class="loader">Cargando contenido...</div>';

        try {
            // Load Metadata (Intro & Hero)
            await this._loadVerticalMetadata();

            // Load Sections
            const sections = await contentService.getSections(this.currentVertical);
            this.sections = sections; // Store for local lookup in Edit Mode

            if (sections.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-layer-group"></i>
                        <h3>Sin secciones</h3>
                        <p>Añade la primera sección para esta vertical.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            sections.forEach(section => {
                const card = this.createSectionCard(section);
                container.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading sections:', error);
            container.innerHTML = '<div class="error-state">Error al cargar contenido</div>';
        }
    }

    async _loadVerticalMetadata() {
        try {
            const meta = await contentService.getVerticalMeta(this.currentVertical);

            // Helper to safe set value
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            // Helper to check radio
            const checkRadio = (name, val) => {
                const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
                if (el) el.checked = true;
            };

            if (meta) {
                // Intro Fields
                setVal('intro-title', meta.introTitle);
                setVal('intro-subtitle', meta.introSubtitle);
                setVal('intro-text', meta.introText);

                // Benefits
                const benefitsContainer = document.getElementById('benefits-container');
                if (benefitsContainer) {
                    benefitsContainer.innerHTML = '';
                    if (meta.benefits && Array.isArray(meta.benefits)) {
                        meta.benefits.forEach(b => this.addBenefitInput(b));
                    }
                    if (!meta.benefits || meta.benefits.length === 0) {
                        this.addBenefitInput(); // Add one empty by default
                    }
                }

                // Hero Fields
                setVal('hero-title', meta.heroTitle);
                setVal('hero-subtitle', meta.heroSubtitle);
                setVal('hero-badge', meta.badgeText);
                checkRadio('hero-color', meta.badgeColor || 'blue');

                // Hero Preview logic
                this.updateHeroPreview(meta.heroImageUrl, meta.heroPosX || 50, meta.heroPosY || 50);

                // Update Badge Preview Class
                const badge = document.getElementById('preview-badge');
                if (badge) badge.className = 'hero-preview-badge ' + (meta.badgeColor || 'blue');
                if (badge) badge.textContent = meta.badgeText || 'Badge';

                // Update text previews
                const previewTitle = document.getElementById('preview-title');
                if (previewTitle) previewTitle.textContent = meta.heroTitle || 'Título Héroe';

                const previewSubtitle = document.getElementById('preview-subtitle');
                if (previewSubtitle) previewSubtitle.textContent = meta.heroSubtitle || 'Subtítulo o Lead';


            } else {
                // Reset fields if no meta exists
                setVal('intro-title', '');
                setVal('intro-text', '');
                document.getElementById('benefits-container').innerHTML = '';
                this.addBenefitInput();

                setVal('hero-title', '');
                setVal('hero-subtitle', '');
                setVal('hero-badge', '');
                checkRadio('hero-color', 'blue');
                this.updateHeroPreview(null, 50, 50);
            }

        } catch (e) {
            console.error("Error loading vertical metadata", e);
        }
    }

    createSectionCard(section) {
        const card = document.createElement('div');
        card.className = `section-card layout-${section.layout || 'left'}`;
        card.draggable = true;
        card.dataset.id = section.id;
        card.dataset.order = section.order;

        // Tags HTML
        const tagsHtml = (section.tags || []).map(t => `<span class="role-badge prescriptor">${t}</span>`).join(' ');

        card.innerHTML = `
            <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
            
            <!-- Image Thumbnail -->
            <div class="section-image">
                ${section.imageUrl
                ? (section.imageUrl.match(/\.(mp4|webm)$/i) ? '<video src="' + section.imageUrl + '" muted></video>' : '<img src="' + section.imageUrl + '">')
                : '<div class="placeholder" style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;color:#666;font-size:10px;">IMG</div>'}
            </div>
            
            <!-- Content -->
            <div class="section-content">
                <div class="section-info">
                    <h4 class="section-title">
                        ${section.title || '(Sin título)'}
                        ${section.isVisible === false ? '<span style="font-size: 0.7em; background: #444; color: #ccc; padding: 2px 6px; border-radius: 4px; margin-left: 5px;"><i class="fa-solid fa-eye-slash"></i> Oculto</span>' : ''}
                    </h4>
                    <div class="section-tags">${tagsHtml}</div>
                    <p class="section-text">${section.text || ''}</p>
                </div>

                <!-- Actions Right Aligned -->
                <div class="section-actions" style="display: flex; gap: 8px; align-items: center;">
                    <!-- Visibility Toggle (Incluir) -->
                    <button class="btn-icon" 
                            onclick="adminController.toggleSectionVisibility('${section.id}', ${section.isVisible !== false}, this)" 
                            title="${section.isVisible !== false ? 'Publicar (Incluir)' : 'Ocultar (No incluir)'}"
                            style="color: ${section.isVisible !== false ? 'var(--primary)' : 'var(--text-muted)'}; border: 1px solid var(--border-color);">
                        <i class="fa-solid ${section.isVisible !== false ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    </button>

                    <button class="btn-icon clone" onclick="adminController.handleCloneSection('${section.id}')" title="Clonar">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button class="btn-icon edit" onclick="adminController.openEditSectionModal('${section.id}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" onclick="adminController.deleteSection('${section.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Click to Select
        card.addEventListener('click', (e) => {
            // Ignore if clicked on actions
            if (e.target.closest('.section-actions') || e.target.closest('.drag-handle')) return;

            // Deselect previous
            document.querySelectorAll('.section-card.selected').forEach(c => c.classList.remove('selected'));

            // Select current
            card.classList.add('selected');
            this.selectedSectionId = section.id;

            // Enable global button
            const btn = document.getElementById('global-ppt-btn');
            if (btn) {
                btn.disabled = false;
                btn.classList.add('active-ppt'); // Enable visual style
                btn.onclick = () => this.handleExportPPT(section.id);
            }
        });

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

            // The actual order update is handled by the 'drop' event listener on the container.
        });

        return card;
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

    resetSectionModal() {
        this.openCreateModal();
    }

    openCreateModal() {
        this.currentEditId = null;
        document.getElementById('modal-title').textContent = 'Nueva Sección';
        document.getElementById('section-form').reset();

        // Reset specific fields
        document.getElementById('section-title').value = '';
        document.getElementById('section-tags').value = '';
        document.getElementById('section-text').value = '';
        document.getElementById('section-layout').value = 'left';
        document.getElementById('section-text-align').value = 'left';

        // Reset visibility to true (checked) by default
        const isVisibleCheck = document.getElementById('section-visible');
        if (isVisibleCheck) isVisibleCheck.checked = true;

        // Reset Tabs
        this.resetInternalState();
        document.getElementById('section-modal').classList.add('active');
    }

    resetInternalState() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.image-tab-content').forEach(c => c.classList.remove('active'));

        // Default to Upload tab
        document.querySelector('.tab-btn[data-tab="upload"]').classList.add('active');
        document.getElementById('tab-upload').classList.add('active');

        // Clear file input
        document.getElementById('section-file').value = '';
        document.getElementById('section-file-info').textContent = '';
        this.selectedGalleryImage = null;

        // Reset Preview
        const preview = document.getElementById('image-preview'); // Note: Preview elements might need ID check in HTML
        // actually looking at HTML, preview logic in admin.html is in right column 'section-preview'
        // But openEditSectionModal refers to 'image-preview' which might not exist in HTML?
        // Let's fix that too.
    }

    openEditSectionModal(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;

        this.currentEditId = sectionId;
        document.getElementById('modal-title').textContent = 'Editar Sección';

        document.getElementById('section-title').value = section.title || '';
        document.getElementById('section-tags').value = section.tags ? section.tags.join(', ') : '';
        document.getElementById('section-text').value = section.text || '';

        // Radio Buttons (Layout)
        const layoutVal = section.layout || 'left';
        const layoutRadio = document.querySelector(`input[name="section-layout"][value="${layoutVal}"]`);
        if (layoutRadio) layoutRadio.checked = true;

        // Radio Buttons (Align)
        const alignVal = section.textAlign || 'left';
        const alignRadio = document.querySelector(`input[name="section-align"][value="${alignVal}"]`);
        if (alignRadio) alignRadio.checked = true;

        // Handle Visibility
        const isVisibleCheck = document.getElementById('section-visible');
        if (isVisibleCheck) {
            isVisibleCheck.checked = section.isVisible !== false;
        }

        // Handle Image Tab logic
        // Reset to Upload tab by default or maintain state if desired
        if (document.querySelector('.tab-btn[data-tab="upload"]')) {
            document.querySelector('.tab-btn[data-tab="upload"]').click();
        }

        // Update the Live Preview
        this.updatePreview();

        document.getElementById('section-modal').classList.add('active');
    }

    async toggleSectionVisibility(sectionId, currentStatus, btnElement) {
        try {
            // Optimistic Update
            const newStatus = !currentStatus;

            // Allow passing button directly or finding it
            const btn = btnElement || document.querySelector(`button[onclick*="'${sectionId}'"]`);
            if (btn) {
                const icon = btn.querySelector('i');
                if (newStatus) {
                    btn.title = 'Publicar (Incluir)';
                    btn.style.color = 'var(--primary)';
                    if (icon) {
                        icon.classList.remove('fa-toggle-off');
                        icon.classList.add('fa-toggle-on');
                    }
                } else {
                    btn.title = 'Ocultar (No incluir)';
                    btn.style.color = 'var(--text-muted)';
                    if (icon) {
                        icon.classList.remove('fa-toggle-on');
                        icon.classList.add('fa-toggle-off');
                    }
                }
                // Update onclick attribute to reflect new status for next click
                btn.setAttribute('onclick', `adminController.toggleSectionVisibility('${sectionId}', ${newStatus}, this)`);
            }

            const sectionRef = doc(db, 'verticals', this.currentVertical, 'sections', sectionId);
            await updateDoc(sectionRef, {
                isVisible: newStatus,
                updatedAt: serverTimestamp()
            });

            // Update local state without full reload if possible, otherwise reload
            const localSection = this.sections.find(s => s.id === sectionId);
            if (localSection) localSection.isVisible = newStatus;

            // Optional: Reload to be safe about other UI elements (like "Oculto" label)
            this.loadSections();
        } catch (error) {
            console.error('Error toggling visibility:', error);
            // Revert UI if needed or just alert
            alert('Error al cambiar visibilidad');
            this.loadSections(); // Revert to source of truth
        }
    }

    async handleExportPPT(sectionId) {
        if (!confirm('¿Generar slide PPT para esta sección?')) return;

        try {
            // Find section data
            // Path: verticals/{verticalId}/sections/{sectionId}
            const sectionRef = doc(db, 'verticals', this.currentVertical, 'sections', sectionId);
            const sectionDoc = await getDoc(sectionRef);

            if (!sectionDoc.exists()) {
                alert('Error: La sección no se encuentra en la base de datos.');
                return;
            }

            const sectionData = sectionDoc.data();

            // Show loading state?
            // pptService calls PptxGenJS which is usually fast for 1 slide.

            await pptService.exportSection(sectionData);

        } catch (error) {
            console.error('Error exporting PPT:', error);
            alert('Error al generar PPT');
        }
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
            `Escribe el ID de la vertical destino(o varias separadas por coma): \n\nOpciones: ${verticals.map(v => v.id).join(', ')} `
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
            alert(`Sección clonada exitosamente a: ${finalTargets.join(', ')} `);
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
                    < div class="folder-icon" > <i class="fa-solid fa-arrow-turn-up"></i></div >
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
                    < div class="folder-icon" > <i class="fa-solid fa-folder"></i></div >
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
                    item.innerHTML = `< img src = "${img.url}" loading = "lazy" title = "${img.name}" > `;

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
            grid.innerHTML = `< p class="error" > Error cargando galería: ${e.message}</p > `;
        }
    }

    resetSectionModal() {
        document.getElementById('section-form').reset();
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.image-tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="upload"]').classList.add('active');
        document.getElementById('tab-upload').classList.add('active');
        document.getElementById('section-file-info').textContent = '';
        this.selectedGalleryImage = null;
        this.updatePreview();
    }

    async handleSaveSection(e) {
        e.preventDefault();
        console.log('handleSaveSection Triggered', e.type); // DEBUG LOG

        // Determine submit button based on event type
        let submitBtn;
        if (e.target.tagName === 'BUTTON') {
            submitBtn = e.target;
        } else {
            // It was a form submit
            submitBtn = document.getElementById('save-section-btn') || e.target.querySelector('button[type="submit"]');
        }

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
            const title = document.getElementById('section-title').value.trim();
            const tagsStr = document.getElementById('section-tags').value.trim();
            const text = document.getElementById('section-text').value;
            const layout = document.querySelector('input[name="section-layout"]:checked')?.value || 'left';
            const textAlign = document.querySelector('input[name="section-align"]:checked')?.value || 'left';
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

            // Validate tags
            if (!tagsStr) throw new Error('Las etiquetas son obligatorias');
            const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

            let imageUrl = null;
            let storagePath = null;

            // ... (image upload logic remains) ...
            if (activeTab === 'upload') {
                const fileInput = document.getElementById('section-file');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];

                    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
                    if (!validTypes.includes(file.type)) {
                        throw new Error('Formato no soportado. Usa JPG, PNG, WEBP o MP4.');
                    }

                    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')} `;
                    storagePath = `${this.currentMediaPath}/${fileName}`;

                    // If Image, Compress. If Video, Upload direct.
                    let uploadData = file;
                    if (file.type.startsWith('image/')) {
                        uploadData = await compressImage(file, 1200, 0.75);
                    }

                    const storageRef = ref(storage, storagePath);
                    const uploadTask = await uploadBytesResumable(storageRef, uploadData);
                    imageUrl = await getDownloadURL(uploadTask.ref);
                }
            } else if (this.selectedGalleryImage) {
                imageUrl = this.selectedGalleryImage;
            }

            const data = {
                title,
                tags,
                text,
                imageUrl,
                imagePath: storagePath,
                layout,
                imagePath: storagePath,
                layout,
                textAlign,
                isVisible: document.getElementById('section-visible').checked
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

    // ============================
    // ASSET PICKER
    // ============================
    openAssetPicker(mode) {
        this.pickerMode = mode; // 'hero' or other
        this.pickerCurrentPath = this.currentMediaPath || 'multimedia';
        document.getElementById('asset-picker-modal').classList.add('active');
        this.loadPickerAssets(this.pickerCurrentPath);
    }

    async loadPickerAssets(path) {
        const grid = document.getElementById('picker-grid');
        grid.innerHTML = '<div class="loader">Cargando...</div>';

        try {
            const { folders, files } = await contentService.listMultimediaContents(path);
            grid.innerHTML = '';

            // Up Button
            if (path !== 'multimedia') {
                const upItem = document.createElement('div');
                upItem.className = 'asset-card gallery-folder up-folder';
                upItem.innerHTML = `<div class="folder-icon"><i class="fa-solid fa-arrow-turn-up"></i></div><div class="folder-name">..</div>`;
                upItem.addEventListener('click', () => {
                    const parts = path.split('/');
                    parts.pop();
                    this.loadPickerAssets(parts.join('/'));
                });
                grid.appendChild(upItem);
            }

            // Folders
            if (folders.length > 0) {
                folders.forEach(folder => {
                    const item = document.createElement('div');
                    item.className = 'asset-card gallery-folder';
                    item.innerHTML = `<div class="folder-icon"><i class="fa-solid fa-folder"></i></div><div class="folder-name">${folder.name}</div>`;
                    item.addEventListener('click', () => this.loadPickerAssets(folder.fullPath));
                    grid.appendChild(item);
                });
            }

            // Files (Images only for now if Hero)
            if (files.length > 0) {
                files.forEach(file => {
                    // Filter images by extension since contentType is not available without extra fetch
                    const isImage = file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                    const isVideo = file.name.match(/\.(mp4|webm)$/i);

                    // If mode is 'hero', only show images
                    if (this.pickerMode === 'hero' && !isImage) return;

                    const item = document.createElement('div');
                    item.className = 'asset-card gallery-image';
                    item.innerHTML = `
                        <div class="image-preview" style="background-image: url('${file.url}'); height: 120px;">
                            ${isVideo ? '<i class="fa-solid fa-video" style="position:absolute;top:5px;right:5px;color:white;text-shadow:0 0 3px black"></i>' : ''}
                        </div>
                        <div class="file-name">${file.name}</div>
                    `;
                    item.addEventListener('click', () => this.handleAssetSelected(file));
                    grid.appendChild(item);
                });
            }

        } catch (error) {
            console.error(error);
            grid.innerHTML = '<div class="error">Error al cargar librería</div>';
        }
    }

    handleAssetSelected(file) {
        if (this.pickerMode === 'hero') {
            this.pendingHeroImage = { url: file.url, path: file.fullPath };
            this.updateHeroPreview(file.url);
            document.getElementById('hero-file-info').textContent = "Seleccionado: " + file.name;
            // Clear file input so it doesn't override
            document.getElementById('hero-file').value = '';
        }
        document.getElementById('asset-picker-modal').classList.remove('active');
    }
}

// Crear instancia única y exponer globalmente
const adminController = new AdminController();
window.adminController = adminController;

export default adminController;
