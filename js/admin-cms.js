import { auth } from './firebase-init.js';
import { contentService } from './services/content.service.js?v=3';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { localAssets } from './data/local-assets.js?v=3';

class CMSStudio {
    constructor() {
        this.currentVertical = 'bts';
        this.techCards = [];
        this.cases = [];
        this.users = [];
        this.assetCurrentPath = 'multimedia';
        this.mediaCurrentPath = 'multimedia';
        this.activeImageInput = null;

        this.initAuth();
        this.bindEvents();
        this.bindGlobalCases();
        this.initDragAndDrop();
        this.initSortable();
        this.bindGlobalProducts();
    }

    initSortable() {
        const gridSections = document.getElementById('grid-sections');
        const gridTech = document.getElementById('grid-tech');
        const gridCases = document.getElementById('grid-cases');

        // Destroy existing instances to avoid duplicates if re-called
        if (this.sortableSections) this.sortableSections.destroy();
        if (this.sortableTech) this.sortableTech.destroy();
        if (this.sortableCases) this.sortableCases.destroy();

        if (gridSections) {
            this.sortableSections = new Sortable(gridSections, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async () => {
                    const items = Array.from(gridSections.querySelectorAll('.data-card'));
                    for (let i = 0; i < items.length; i++) {
                        const id = items[i].dataset.id;
                        if (id) await contentService.updateSectionOrder(this.currentVertical, id, i);
                    }
                }
            });
        }

        if (gridTech) {
            this.sortableTech = new Sortable(gridTech, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async () => {
                    const items = Array.from(gridTech.querySelectorAll('.data-card'));
                    for (let i = 0; i < items.length; i++) {
                        const id = items[i].dataset.id;
                        if (id) await contentService.updateTechCardOrder(this.currentVertical, id, i);
                    }
                }
            });
        }

        if (gridCases) {
            this.sortableCases = new Sortable(gridCases, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async () => {
                    const items = Array.from(gridCases.querySelectorAll('.data-card'));
                    for (let i = 0; i < items.length; i++) {
                        const id = items[i].dataset.id;
                        if (id) await contentService.updateCaseOrder(this.currentVertical, id, i);
                    }
                }
            });
        }
    }

    initAuth() {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = 'login.html';
            } else {
                this.loadVerticalData();
            }
        });
    }

    bindEvents() {
        // Vertical Selector
        document.querySelectorAll('.vertical-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.vertical-pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.currentVertical = e.target.dataset.id;
                this.loadVerticalData();
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            signOut(auth);
        });

        // Sidebar Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget;
                if (target.id === 'logout-btn') return;
                
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.cms-view').forEach(v => {
                    v.classList.remove('active');
                    v.style.display = 'none';
                });
                
                target.classList.add('active');
                const viewId = target.dataset.view;
                const view = document.getElementById('view-' + viewId);
                if(view) {
                    view.classList.add('active');
                    view.style.display = viewId === 'media' ? 'flex' : 'block';
                    if(viewId === 'media') {
                        this.mediaCurrentPath = 'multimedia';
                        this.renderMediaView();
                    }
                    if(viewId === 'users') {
                        this.loadUsers();
                    }
                    if(viewId === 'global-cases') {
                        this.loadGlobalCases();
                    }
                    if(viewId === 'global-products') {
                        this.loadGlobalProducts();
                    }
                }
            });
        });

        // Users
        document.getElementById('btn-add-user').addEventListener('click', () => {
            document.getElementById('user-id').value = '';
            document.getElementById('user-name').value = '';
            document.getElementById('user-email').value = '';
            document.getElementById('user-role').value = 'prescriptor';
            document.getElementById('user-modal-title').textContent = 'Anadir Usuario';
            document.getElementById('modal-user').classList.add('active');
        });
        document.getElementById('save-user-btn').addEventListener('click', () => this.saveUser());

        // Modals - Robust closing support
        document.querySelectorAll('.close-modal, .btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cms-modal-overlay').forEach(m => m.classList.remove('active'));
            });
        });
        // Close on backdrop click
        document.querySelectorAll('.cms-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Save Meta
        document.getElementById('save-hero').addEventListener('click', () => this.saveMetadata());
        document.getElementById('save-intro').addEventListener('click', () => this.saveMetadata());

        // Modals Openers
        this.setupIconPicker();
        document.getElementById('btn-add-tech').addEventListener('click', () => {
            document.getElementById('tech-id').value = '';
            document.getElementById('tech-label').value = '';
            document.getElementById('tech-name').value = '';
            document.getElementById('tech-desc').value = '';
            document.getElementById('tech-tags').value = '';
            document.getElementById('tech-image').value = '';
            document.getElementById('tech-modal-title').textContent = 'Añadir Dispositivo';
            document.getElementById('modal-tech').classList.add('active');
        });

        document.getElementById('btn-add-case').addEventListener('click', () => {
            document.getElementById('case-id').value = '';
            document.getElementById('case-name').value = '';
            document.getElementById('case-icon').value = 'fa-building';
            document.getElementById('case-items').value = '';
            document.getElementById('case-modal-title').textContent = 'Añadir Caso de Éxito';
            document.getElementById('modal-case').classList.add('active');
        });

        document.getElementById('btn-add-section').addEventListener('click', () => {
            document.getElementById('section-id').value = '';
            document.getElementById('section-eyebrow').value = '';
            document.getElementById('section-layout').value = 'left';
            document.getElementById('section-title').value = '';
            document.getElementById('section-text').value = '';
            document.getElementById('section-tags').value = '';
            document.getElementById('section-image').value = '';
            document.getElementById('section-modal-title').textContent = 'Añadir Bloque Destacado';
            document.getElementById('modal-section').classList.add('active');
        });

        document.getElementById('save-tech-btn').addEventListener('click', () => this.saveTech());
        document.getElementById('save-case-btn').addEventListener('click', () => this.saveCase());
        document.getElementById('save-section-btn').addEventListener('click', () => this.saveSection());

        // Asset Browser
        document.getElementById('btn-browse-assets').addEventListener('click', () => {
            this.activeImageInput = 'section-image';
            this.openAssetBrowser();
        });

        document.getElementById('btn-browse-tech-assets').addEventListener('click', () => {
            this.activeImageInput = 'tech-image';
            this.openAssetBrowser();
        });
        
        document.querySelector('.close-assets').addEventListener('click', () => {
            document.getElementById('modal-assets').classList.remove('active');
        });

        document.getElementById('asset-search').addEventListener('input', (e) => {
            this.renderAssetGrid(e.target.value);
        });

        document.getElementById('asset-btn-up').addEventListener('click', () => {
            if(this.assetCurrentPath) {
                const parts = this.assetCurrentPath.split('/').filter(p => p);
                parts.pop();
                this.assetCurrentPath = parts.length ? parts.join('/') + '/' : '';
                this.renderAssetGrid(document.getElementById('asset-search').value);
            }
        });

        document.getElementById('media-search').addEventListener('input', (e) => {
            this.renderMediaView(e.target.value);
        });

        document.getElementById('media-btn-up').addEventListener('click', () => {
            if(this.mediaCurrentPath) {
                const parts = this.mediaCurrentPath.split('/').filter(p => p);
                parts.pop();
                this.mediaCurrentPath = parts.length ? parts.join('/') + '/' : '';
                this.renderMediaView(document.getElementById('media-search').value);
            }
        });
        
        document.getElementById('upload-files').addEventListener('change', (e) => this.processUpload(e.target.files));
        document.getElementById('upload-folder').addEventListener('change', (e) => this.processUpload(e.target.files));

        // Global Previews
        const previewFieldIds = ['tech-image', 'section-image', 'global-case-image', 'global-product-image'];
        previewFieldIds.forEach(id => {
            const input = document.getElementById(id);
            if(input) {
                input.addEventListener('input', (e) => this.updateImagePreview(id, e.target.value));
            }
        });
    }

    updateImagePreview(inputId, url) {
        const preview = document.getElementById(`preview-${inputId}`);
        if (!preview) return;

        if (!url) {
            preview.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Sin imagen seleccionada</span>';
            return;
        }

        preview.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<span style=\'color:var(--danger); font-size:0.8rem;\'>Error al cargar imagen</span>'">`;
    }

    initDragAndDrop() {
        const dropZones = ['media-grid', 'asset-grid'];
        dropZones.forEach(id => {
            const zone = document.getElementById(id);
            if (!zone) return;

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            zone.addEventListener('dragover', () => zone.style.background = 'rgba(37,99,235,0.05)');
            zone.addEventListener('dragleave', () => zone.style.background = 'transparent');
            
            zone.addEventListener('drop', async (e) => {
                zone.style.background = 'transparent';
                const items = e.dataTransfer.items;
                const path = id === 'media-grid' ? this.mediaCurrentPath : this.assetCurrentPath;
                
                const filesToUpload = [];
                for (let i = 0; i < items.length; i++) {
                    const entry = items[i].webkitGetAsEntry();
                    if (entry) {
                        await this.traverseFileTree(entry, path, filesToUpload);
                    }
                }
                
                if (filesToUpload.length > 0) {
                    await this.uploadFilesSerial(filesToUpload, id === 'media-grid' ? 'media' : 'asset');
                }
            });
        });
    }

    async traverseFileTree(entry, path, filesToUpload) {
        if (entry.isFile) {
            return new Promise((resolve) => {
                entry.file((file) => {
                    // Prepend the path but keep the file name
                    filesToUpload.push({ file, path });
                    resolve();
                });
            });
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const entries = await new Promise((resolve) => {
                dirReader.readEntries((entries) => resolve(entries));
            });
            for (let i = 0; i < entries.length; i++) {
                await this.traverseFileTree(entries[i], path + '/' + entry.name, filesToUpload);
            }
        }
    }

    async uploadFilesSerial(filesToUpload, context) {
        const total = filesToUpload.length;
        console.log(`Uploading ${total} files to ${context}...`);
        
        for (let i = 0; i < total; i++) {
            const { file, path } = filesToUpload[i];
            try {
                // Update UI state maybe?
                await contentService.uploadFile(file, path);
            } catch (e) {
                console.error(`Error uploading ${file.name}:`, e);
            }
        }
        
        alert(`Se han subido ${total} archivo(s) correctamente.`);
        if (context === 'media') this.renderMediaView();
        else this.renderAssetGrid();
    }

    async processUpload(files) {
        if(!files || files.length === 0) return;
        const targetPath = document.querySelector('.cms-view.active').id === 'view-media' ? this.mediaCurrentPath : this.assetCurrentPath;
        
        const filesToUpload = Array.from(files).map(file => ({ file, path: targetPath }));
        await this.uploadFilesSerial(filesToUpload, document.querySelector('.cms-view.active').id === 'view-media' ? 'media' : 'asset');
    }

    async loadVerticalData() {
        try {
            console.log("Loading", this.currentVertical);
            const meta = await contentService.getVerticalMeta(this.currentVertical);
            this.fillMeta(meta);

            await this.loadTech();
            await this.loadCases();
            await this.loadSections();
            
            // Re-sync sortable after data is rendered into DOM
            this.initSortable();
        } catch (e) {
            console.error("Error loading vertical:", e);
        }
    }

    fillMeta(meta) {
        if (!meta) return;
        document.getElementById('meta-heroTitle').value = meta.heroTitle || '';
        document.getElementById('meta-heroSubtitle').value = meta.heroSubtitle || '';
        document.getElementById('meta-badgeText').value = meta.badgeText || '';
        
        document.getElementById('meta-introTitle').value = meta.introTitle || '';
        document.getElementById('meta-introText').value = meta.introText || '';
        document.getElementById('meta-introQuote').value = meta.introQuote || '';
        document.getElementById('meta-benefits').value = (meta.benefits || []).join('\n');
    }

    async saveMetadata() {
        try {
            const data = {
                heroTitle: document.getElementById('meta-heroTitle').value,
                heroSubtitle: document.getElementById('meta-heroSubtitle').value,
                badgeText: document.getElementById('meta-badgeText').value,
                introTitle: document.getElementById('meta-introTitle').value,
                introText: document.getElementById('meta-introText').value,
                introQuote: document.getElementById('meta-introQuote').value,
                benefits: document.getElementById('meta-benefits').value.split('\n').filter(b => b.trim().length > 0)
            };
            await contentService.updateVerticalMeta(this.currentVertical, data);
            alert("Campos de texto guardados en Firebase correctamente.");
        } catch (e) {
            alert("Error al guardar: " + e.message);
        }
    }

    // ============================
    // TECH CARDS
    // ============================
    async loadTech() {
        return;
    }

    async saveTech() {
        return;
    }

    editTech(id) {
        return;
    }

    async deleteTech(id) {
        return;
    }

    // ============================
    // CASOS DE ÉXITO
    // ============================
    async loadCases() {
        const grid = document.getElementById('grid-cases');
        grid.innerHTML = '<div style="color:var(--text-secondary); padding: 20px;">Cargando...</div>';
        try {
            this.cases = await contentService.getCases(this.currentVertical);
            grid.innerHTML = '';
            if (this.cases.length === 0) {
                grid.innerHTML = '<p style="color:var(--text-secondary)">No hay casos añadidos.</p>';
                return;
            }

            this.cases.forEach(c => {
                const items = (c.items || []).map(i => `<li style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:4px;">• ${i}</li>`).join('');
                
                grid.innerHTML += `
                    <div class="data-card" data-id="${c.id}" style="position:relative;">
                        <div class="drag-handle" style="position:absolute; top:15px; left:12px; cursor:grab; color:var(--accent); font-size:1.1rem; opacity:0.9; z-index:10;">
                            <i class="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div class="data-card-header">
                            <div class="data-card-title" style="margin-left:20px;"><i class="fa-solid ${c.icon}" style="color:var(--accent);margin-right:8px;"></i>${c.name}</div>
                            <div style="display:flex;gap:8px;">
                                <button class="btn-edit-case" data-id="${c.id}" style="background:none;border:none;color:var(--accent);cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-delete-case" data-id="${c.id}" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <ul style="margin:10px 0 0 20px; padding-left:10px; list-style:none;">${items}</ul>
                    </div>
                `;
            });

            document.querySelectorAll('.btn-edit-case').forEach(b => b.addEventListener('click', (e) => this.editCase(e.currentTarget.dataset.id)));
            document.querySelectorAll('.btn-delete-case').forEach(b => b.addEventListener('click', (e) => this.deleteCase(e.currentTarget.dataset.id)));
        } catch (e) {
            console.error(e);
        }
    }

    async saveCase() {
        const id = document.getElementById('case-id').value;
        const data = {
            name: document.getElementById('case-name').value,
            icon: document.getElementById('case-icon').value || 'fa-building',
            items: document.getElementById('case-items').value.split('\n').map(t => t.trim()).filter(Boolean)
        };

        try {
            if (id) await contentService.updateCase(this.currentVertical, id, data);
            else await contentService.addCase(this.currentVertical, data);
            
            document.getElementById('modal-case').classList.remove('active');
            this.loadCases();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    editCase(id) {
        const c = this.cases.find(x => x.id === id);
        if (!c) return;
        document.getElementById('case-id').value = c.id;
        document.getElementById('case-name').value = c.name;
        document.getElementById('case-icon').value = c.icon;
        document.getElementById('case-items').value = (c.items || []).join('\n');
        document.getElementById('case-modal-title').textContent = 'Editar Caso';
        document.getElementById('modal-case').classList.add('active');
    }

    async deleteCase(id) {
        if (!confirm('¿Seguro que quieres borrar este proyecto?')) return;
        await contentService.deleteCase(this.currentVertical, id);
        this.loadCases();
    }

    // ============================
    // SECTIONS (FEATURE SHOWCASE)
    // ============================
    async loadSections() {
        const grid = document.getElementById('grid-sections');
        grid.innerHTML = '<div style="color:var(--text-secondary); padding: 20px;">Cargando...</div>';
        try {
            this.sections = await contentService.getSections(this.currentVertical);
            grid.innerHTML = '';
            if (this.sections.length === 0) {
                grid.innerHTML = '<p style="color:var(--text-secondary)">No hay bloques destacados añadidos.</p>';
                return;
            }

            this.sections.forEach(s => {
                const tags = (s.tags || []).map(t => `<span style="background:var(--accent); color:white; padding:2px 8px; border-radius:12px; font-size:11px;">${t}</span>`).join(' ');
                
                grid.innerHTML += `
                    <div class="data-card" data-id="${s.id}" style="flex-direction: row; align-items:flex-start; gap: 20px; position:relative;">
                        <div class="drag-handle" style="cursor:grab; padding: 15px 10px; color:var(--accent); display:flex; align-items:center; font-size:1.1rem; opacity:0.9;">
                            <i class="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div style="width:140px; aspect-ratio:16/9; border-radius:6px; overflow:hidden; background:#111; flex-shrink:0;">
                            <img src="${s.imageUrl || ''}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                        <div style="flex:1;">
                            <div class="data-card-header">
                                <div>
                                    <div class="data-card-subtitle" style="color:var(--text-secondary)">${s.eyebrow || 'Sin etiqueta superior'} | ${s.layout === 'right' ? 'Invertido' : 'Normal'}</div>
                                    <div class="data-card-title" style="color:var(--text-primary); font-size:1.1rem; margin-top:4px;">${s.title}</div>
                                </div>
                                <div style="display:flex;gap:8px;">
                                    <button class="btn-edit-section" data-id="${s.id}" style="background:none;border:none;color:var(--accent);cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn-delete-section" data-id="${s.id}" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="data-card-desc" style="margin-top:8px;">${(s.text || '').substring(0, 150)}...</div>
                            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">${tags}</div>
                        </div>
                    </div>
                `;
            });

            document.querySelectorAll('.btn-edit-section').forEach(b => b.addEventListener('click', (e) => this.editSection(e.currentTarget.dataset.id)));
            document.querySelectorAll('.btn-delete-section').forEach(b => b.addEventListener('click', (e) => this.deleteSection(e.currentTarget.dataset.id)));
        } catch (e) {
            console.error(e);
        }
    }
    async saveSection() {
        const id = document.getElementById('section-id').value;
        const data = {
            eyebrow: document.getElementById('section-eyebrow').value,
            layout: document.getElementById('section-layout').value,
            title: document.getElementById('section-title').value,
            text: document.getElementById('section-text').value,
            imageUrl: document.getElementById('section-image').value,
            tags: document.getElementById('section-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            isVisible: true,
            isActive: true
        };

        try {
            if (id) await contentService.updateSection(this.currentVertical, id, data);
            else await contentService.addSection(this.currentVertical, data);
            
            document.getElementById('modal-section').classList.remove('active');
            this.loadSections();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    editSection(id) {
        const s = this.sections.find(x => x.id === id);
        if (!s) return;
        document.getElementById('section-id').value = s.id;
        document.getElementById('section-eyebrow').value = s.eyebrow || '';
        document.getElementById('section-layout').value = s.layout || 'left';
        document.getElementById('section-title').value = s.title || '';
        document.getElementById('section-text').value = s.text || '';
        document.getElementById('section-image').value = s.imageUrl || '';
        document.getElementById('section-tags').value = (s.tags || []).join(', ');
        
        this.updateImagePreview('section-image', s.imageUrl);
        
        document.getElementById('section-modal-title').textContent = 'Editar Bloque';
        document.getElementById('modal-section').classList.add('active');
    }

    async deleteSection(id) {
        if (!confirm('¿Seguro que quieres borrar este bloque?')) return;
        await contentService.deleteSection(this.currentVertical, id);
        this.loadSections();
    }
    
    // ============================
    // ASSET BROWSER (MEDIA DATABASE) - CLOUD VERSION
    // ============================
    generateGridDOM(gridElement, folders, files, totalMatches, type = 'modal') {
        gridElement.innerHTML = '';
        
        if (folders.length === 0 && files.length === 0) {
            gridElement.innerHTML = '<div style="grid-column: 1 / -1; color:var(--text-secondary); text-align:center; padding: 40px;">No se encontraron resultados en esta carpeta.</div>';
            return;
        }

        folders.forEach(folder => {
            const card = document.createElement('div');
            card.className = 'asset-card gallery-folder';
            card.style.cssText = 'background: linear-gradient(145deg, var(--bg-card), var(--bg-input)); border-radius:8px; overflow:hidden; border:1px solid var(--border-light); cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:160px; height:160px; padding:20px;';
            card.innerHTML = `
                <i class="fa-solid fa-folder" style="font-size:3.5rem; color:var(--primary); margin-bottom:15px; opacity:0.8;"></i>
                <div style="font-size:0.9rem; font-weight:600; color:var(--text-primary); text-align:center; word-break:break-all;">
                    ${folder.name}
                </div>
                <button class="btn-delete-asset" data-path="${folder.fullPath}" data-type="folder" style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:4px; width:28px; height:28px; cursor:pointer; display:none; align-items:center; justify-content:center; z-index:20;">
                    <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                </button>
            `;
            const delBtn = card.querySelector('.btn-delete-asset');
            card.onmouseover = () => { card.style.borderColor = 'var(--accent)'; card.style.transform = 'translateY(-2px)'; delBtn.style.display = 'flex'; }
            card.onmouseout = () => { card.style.borderColor = 'var(--border-light)'; card.style.transform = 'translateY(0)'; delBtn.style.display = 'none'; }
            
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteAsset(folder.fullPath, 'folder', type);
            });

            card.addEventListener('click', () => {
                if (type === 'modal') {
                    this.assetCurrentPath = folder.fullPath;
                    this.renderAssetGrid();
                } else {
                    this.mediaCurrentPath = folder.fullPath;
                    this.renderMediaView();
                }
            });
            gridElement.appendChild(card);
        });

        files.forEach(file => {
            const cleanName = file.name;
            const fullUrl = file.url;
            const ext = cleanName.split('.').pop().toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'asset-card';
            card.style.cssText = 'background:var(--bg-card); border-radius:8px; overflow:hidden; border:1px solid var(--border-light); cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; min-height:160px; height:160px; position:relative;';
            card.innerHTML = `
                <div style="flex:1; height: 0; padding-bottom: 56.25%; background:#111; overflow:hidden; position:relative;">
                    <img src="${fullUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity: 0.85; transition: opacity 0.2s;" loading="lazy">
                    <div style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.7); padding:2px 6px; border-radius:4px; font-size:0.7rem; color:#fff;">${ext}</div>
                    <button class="btn-delete-asset" data-path="${file.fullPath}" data-type="file" style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:4px; width:28px; height:28px; cursor:pointer; display:none; align-items:center; justify-content:center; z-index:20;">
                        <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
                    </button>
                </div>
                <div style="padding:10px; font-size:0.8rem; height:40px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${cleanName}">
                    ${cleanName}
                </div>
            `;
            const img = card.querySelector('img');
            const delBtn = card.querySelector('.btn-delete-asset');
            card.onmouseover = () => { card.style.borderColor = 'var(--accent)'; img.style.opacity = '1'; card.style.transform = 'translateY(-2px)'; delBtn.style.display = 'flex'; }
            card.onmouseout = () => { card.style.borderColor = 'var(--border-light)'; img.style.opacity = '0.85'; card.style.transform = 'translateY(0)'; delBtn.style.display = 'none'; }
            
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteAsset(file.fullPath, 'file', type);
            });

            card.addEventListener('click', () => {
                if (type === 'modal') {
                    if (this.activeImageInput) {
                        const input = document.getElementById(this.activeImageInput);
                        if (input) {
                            input.value = fullUrl;
                            this.updateImagePreview(this.activeImageInput, fullUrl);
                        }
                    }
                    document.getElementById('modal-assets').classList.remove('active');
                } else {
                    window.open(fullUrl, '_blank');
                }
            });
            gridElement.appendChild(card);
        });
    }

    openAssetBrowser() {
        document.getElementById('modal-assets').classList.add('active');
        document.getElementById('asset-search').value = '';
        this.assetCurrentPath = 'multimedia';
        this.renderAssetGrid();
    }

    async renderAssetGrid(filterStr = '') {
        const grid = document.getElementById('asset-grid');
        const count = document.getElementById('asset-count');
        const upBtn = document.getElementById('asset-btn-up');
        
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:40px;">Conectando con Cloud Storage...</div>';
        
        const { folders, files } = await contentService.listMultimediaContents(this.assetCurrentPath);
        
        // Filter client-side if needed (Storage doesn't support server-side search well)
        const finalFiles = filterStr ? files.filter(f => f.name.toLowerCase().includes(filterStr.toLowerCase())) : files;
        const finalFolders = filterStr ? folders.filter(f => f.name.toLowerCase().includes(filterStr.toLowerCase())) : folders;

        upBtn.style.display = this.assetCurrentPath !== 'multimedia' ? 'block' : 'none';
        count.textContent = filterStr ? `${finalFiles.length + finalFolders.length} resultados` : `Propiedades de Cloud Storage`;
        
        this.generateGridDOM(grid, finalFolders, finalFiles, 0, 'modal');
    }

    async handleDeleteAsset(fullPath, assetType, contextType) {
        const msg = assetType === 'folder' 
            ? '¿Estás seguro de que quieres eliminar esta CARPETA y todo su contenido? Esta acción no se puede deshacer.' 
            : '¿Estás seguro de que quieres eliminar este ARCHIVO?';
        
        if (!confirm(msg)) return;

        try {
            if (assetType === 'folder') {
                await contentService.deleteFolder(fullPath);
            } else {
                await contentService.deleteFile(fullPath);
            }
            
            if (contextType === 'modal') this.renderAssetGrid();
            else this.renderMediaView();
        } catch (e) {
            alert('Error al eliminar: ' + e.message);
        }
    }

    async renderMediaView(filterStr = '') {
        const grid = document.getElementById('media-grid');
        const count = document.getElementById('media-count');
        const upBtn = document.getElementById('media-btn-up');
        const breadcrumbs = document.getElementById('media-breadcrumbs');
        
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:40px;">Sincronizando con la nube...</div>';
        
        const { folders, files } = await contentService.listMultimediaContents(this.mediaCurrentPath);

        const finalFiles = filterStr ? files.filter(f => f.name.toLowerCase().includes(filterStr.toLowerCase())) : files;
        const finalFolders = filterStr ? folders.filter(f => f.name.toLowerCase().includes(filterStr.toLowerCase())) : folders;
        
        upBtn.style.display = this.mediaCurrentPath !== 'multimedia' ? 'block' : 'none';
        count.textContent = `${finalFolders.length} carpetas, ${finalFiles.length} archivos`;
        breadcrumbs.innerHTML = 'Nube / ' + this.mediaCurrentPath.split('/').filter(p=>p && p!=='multimedia').map(p => `<strong>${p}</strong>`).join(' / ');
        
        this.generateGridDOM(grid, finalFolders, finalFiles, 0, 'media');
    }

    // ========================
    // USER MANAGEMENT LOGIC
    // ========================

    async loadUsers() {
        try {
            this.users = await contentService.getUsers();
            this.renderUsers();
        } catch (e) {
            console.error(e);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:40px; text-align:center; color:var(--text-secondary);">No hay usuarios registrados.</td></tr>';
            return;
        }

        this.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            
            const roleBadge = u.role === 'admin' 
                ? `<span style="background:rgba(37,99,235,0.1); color:var(--accent); padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Admin</span>`
                : `<span style="background:rgba(148,163,184,0.1); color:var(--text-secondary); padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">Prescriptor</span>`;

            tr.innerHTML = `
                <td style="padding:15px;">
                    <div style="font-weight:600; color:var(--text-primary);">${u.name || 'Sin nombre'}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">${u.email}</div>
                </td>
                <td style="padding:15px;">${roleBadge}</td>
                <td style="padding:15px;"><span style="color:var(--success); font-size:0.85rem;"><i class="fa-solid fa-circle" style="font-size:0.5rem; margin-right:5px;"></i> Activo</span></td>
                <td style="padding:15px; text-align:right;">
                    <button class="btn-edit-user" data-id="${u.id}" style="background:none; border:none; color:var(--accent); cursor:pointer; margin-right:10px;"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete-user" data-id="${u.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-user').forEach(b => b.addEventListener('click', (e) => this.editUser(e.currentTarget.dataset.id)));
        document.querySelectorAll('.btn-delete-user').forEach(b => b.addEventListener('click', (e) => this.deleteUser(e.currentTarget.dataset.id)));
    }

    async saveUser() {
        const id = document.getElementById('user-id').value;
        const data = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value
        };

        if (!data.email) return alert('El email es obligatorio');

        try {
            if (id) await contentService.updateUser(id, data);
            else await contentService.addUser(data);
            
            document.getElementById('modal-user').classList.remove('active');
            this.loadUsers();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    editUser(id) {
        const u = this.users.find(x => x.id === id);
        if (!u) return;
        document.getElementById('user-id').value = u.id;
        document.getElementById('user-name').value = u.name || '';
        document.getElementById('user-email').value = u.email || '';
        document.getElementById('user-role').value = u.role || 'prescriptor';
        document.getElementById('user-modal-title').textContent = 'Editar Usuario';
        document.getElementById('modal-user').classList.add('active');
    }

    async deleteUser(id) {
        if (!confirm('¿Seguro que quieres eliminar este usuario? No podrá volver a entrar.')) return;
        try {
            await contentService.deleteUser(id);
            this.loadUsers();
        } catch (e) {
            alert(e.message);
        }
    }

    // ========================
    // GLOBAL CASES LOGIC
    // ========================

    bindGlobalCases() {
        document.getElementById('btn-add-global-case').addEventListener('click', () => {
            this.editGlobalCase(null);
        });

        document.getElementById('btn-save-global-case').addEventListener('click', () => {
            this.saveGlobalCase();
        });
    }

    async loadGlobalCases() {
        const grid = document.getElementById('grid-global-cases');
        grid.innerHTML = '<div style="color:var(--text-secondary); padding: 20px;">Cargando biblioteca...</div>';
        
        try {
            const cases = await contentService.getAllGlobalCases();
            this.globalCases = cases;
            this.renderGlobalCases();
        } catch (e) {
            grid.innerHTML = `<div style="color:var(--danger); padding: 20px;">Error al cargar: ${e.message}</div>`;
        }
    }

    renderGlobalCases() {
        const grid = document.getElementById('grid-global-cases');
        grid.innerHTML = '';

        if (this.globalCases.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-secondary); padding: 20px;">No hay casos en la biblioteca. Crea el primero.</div>';
            return;
        }

        this.globalCases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'data-card';
            
            const verts = (c.verticals || []).map(v => `<span style="font-size:0.65rem; background:rgba(37,99,235,0.1); color:var(--accent); padding:2px 6px; border-radius:3px; margin-right:4px; text-transform:uppercase;">${v}</span>`).join('');
            
            card.innerHTML = `
                <div class="data-card-info" style="flex:1;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid ${c.icon || 'fa-building'}" style="color:var(--accent)"></i>
                        <span style="font-weight:600; color:var(--text-primary); font-size:1.1rem;">${c.name}</span>
                    </div>
                    <div style="margin:8px 0;">${verts}</div>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin:5px 0;">${c.description?.substring(0, 100) || 'Sin descripción'}...</p>
                </div>
                <div class="data-card-actions">
                    <button class="cms-btn cms-btn-secondary btn-edit-global-case" data-id="${c.id}"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="cms-btn cms-btn-secondary btn-delete-global-case" data-id="${c.id}" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-global-case').forEach(b => b.addEventListener('click', (e) => this.editGlobalCase(e.currentTarget.dataset.id)));
        document.querySelectorAll('.btn-delete-global-case').forEach(b => b.addEventListener('click', (e) => this.deleteGlobalCase(e.currentTarget.dataset.id)));
    }

    editGlobalCase(id) {
        const modal = document.getElementById('modal-global-case');
        const title = document.getElementById('global-case-modal-title');
        
        // Reset form
        document.getElementById('global-case-id').value = id || '';
        document.getElementById('global-case-name').value = '';
        document.getElementById('global-case-icon').value = 'fa-building';
        document.getElementById('global-case-image').value = '';
        document.getElementById('global-case-description').value = '';
        document.getElementById('global-case-items').value = '';
        
        // Reset checkboxes
        document.querySelectorAll('#global-case-verticals input').forEach(i => i.checked = false);

        if (id) {
            const c = this.globalCases.find(x => x.id === id);
            if (c) {
                title.textContent = 'Editar Caso Global';
                document.getElementById('global-case-name').value = c.name || '';
                document.getElementById('global-case-icon').value = c.icon || 'fa-building';
                document.getElementById('global-case-image').value = c.imageUrl || '';
                document.getElementById('global-case-description').value = c.description || '';
                document.getElementById('global-case-items').value = (c.items || []).join('\n');
                
                (c.verticals || []).forEach(v => {
                    const ck = document.querySelector(`#global-case-verticals input[value="${v}"]`);
                    if (ck) ck.checked = true;
                });
            }
        } else {
            title.textContent = 'Nuevo Caso Global';
        }

        // Update visual picker
        this.updateIconPickerUI(document.getElementById('global-case-icon').value);
        this.updateImagePreview('global-case-image', id ? this.globalCases.find(x => x.id === id)?.imageUrl : '');

        modal.classList.add('active');
    }

    async saveGlobalCase() {
        const id = document.getElementById('global-case-id').value;
        const selectedVerts = Array.from(document.querySelectorAll('#global-case-verticals input:checked')).map(i => i.value);
        
        const data = {
            name: document.getElementById('global-case-name').value,
            icon: document.getElementById('global-case-icon').value,
            imageUrl: document.getElementById('global-case-image').value,
            description: document.getElementById('global-case-description').value,
            items: document.getElementById('global-case-items').value.split('\n').filter(x => x.trim().length > 0),
            verticals: selectedVerts,
            order: 0 // For now default to 0
        };

        if (!data.name) return alert('El nombre es obligatorio');
        if (selectedVerts.length === 0) return alert('Selecciona al menos una vertical');

        try {
            if (id) await contentService.updateGlobalCase(id, data);
            else await contentService.addGlobalCase(data);
            
            document.getElementById('modal-global-case').classList.remove('active');
            this.loadGlobalCases();
        } catch (e) {
            alert('Error al guardar: ' + e.message);
        }
    }

    async deleteGlobalCase(id) {
        if (!confirm('¿Eliminar este caso de la biblioteca? Desaparecerá de todas las verticales.')) return;
        try {
            await contentService.deleteGlobalCase(id);
            this.loadGlobalCases();
        } catch (e) {
            alert(e.message);
        }
    }

    setupIconPicker() {
        document.querySelectorAll('#global-case-icon-picker .icon-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('#global-case-icon-picker .icon-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                document.getElementById('global-case-icon').value = opt.dataset.icon;
            });
        });
    }

    updateIconPickerUI(selectedIcon) {
        const icon = selectedIcon || 'fa-building';
        document.querySelectorAll('#global-case-icon-picker .icon-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.icon === icon);
        });
    }

    // ============================
    // GLOBAL PRODUCTS MANAGEMENT
    // ============================
    bindGlobalProducts() {
        document.getElementById('btn-add-global-product').addEventListener('click', () => {
            document.getElementById('global-product-id').value = '';
            document.getElementById('global-product-name').value = '';
            document.getElementById('global-product-category').value = 'intercom';
            document.getElementById('global-product-verticals').querySelectorAll('input').forEach(chk => chk.checked = false);
            document.getElementById('global-product-image').value = '';
            document.getElementById('global-product-description').value = '';
            document.getElementById('global-product-specs').value = '';
            document.getElementById('global-product-tags').value = '';
            document.getElementById('global-product-modal-title').textContent = 'Añadir Nuevo Producto';
            document.getElementById('modal-global-product').classList.add('active');
        });

        document.getElementById('btn-save-global-product').addEventListener('click', () => this.saveGlobalProduct());
    }

    async loadGlobalProducts() {
        const grid = document.getElementById('grid-global-products');
        grid.innerHTML = '<div style="color:var(--text-secondary); padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando portfolio...</div>';
        
        try {
            this.products = await contentService.getAllProducts();
            grid.innerHTML = '';
            
            if (this.products.length === 0) {
                grid.innerHTML = '<p style="color:var(--text-secondary); padding:20px;">No hay productos en el catálogo comercial.</p>';
                return;
            }

            this.products.forEach(p => {
                grid.innerHTML += `
                    <div class="data-card" data-id="${p.id}" style="display:flex; align-items:center; gap:20px;">
                        <div style="width:100px; height:100px; background:#111; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
                            ${p.imageUrl ? `<img src="${p.imageUrl}" style="max-width:100%; max-height:100%; object-fit:contain;">` : `<i class="fa-solid fa-box-open" style="opacity:0.2;"></i>`}
                        </div>
                        <div style="flex:1;">
                            <div class="data-card-header" style="margin-bottom:5px;">
                                <div class="data-card-title">${p.name}</div>
                                <div style="display:flex; gap:10px;">
                                    <button class="btn-edit-product" data-id="${p.id}" style="background:none; border:none; color:var(--accent); cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn-delete-product" data-id="${p.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            <div style="font-size:0.7rem; color:var(--primary-light); text-transform:uppercase; font-weight:700; margin-bottom:5px;">${p.category}</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.description || ''}</div>
                        </div>
                    </div>
                `;
            });

            document.querySelectorAll('.btn-edit-product').forEach(btn => {
                btn.addEventListener('click', (e) => this.editGlobalProduct(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-delete-product').forEach(btn => {
                btn.addEventListener('click', (e) => this.deleteGlobalProduct(e.currentTarget.dataset.id));
            });

        } catch (error) {
            console.error('Error loading global products:', error);
            grid.innerHTML = '<div style="color:var(--danger); padding:20px;">Error al conectar con la base de datos.</div>';
        }
    }

    editGlobalProduct(id) {
        const p = this.products.find(x => x.id === id);
        if (!p) return;
        
        document.getElementById('global-product-id').value = p.id;
        document.getElementById('global-product-name').value = p.name;
        document.getElementById('global-product-category').value = p.category;
        
        const verticalList = p.verticals || [];
        document.getElementById('global-product-verticals').querySelectorAll('input').forEach(chk => {
            chk.checked = verticalList.includes(chk.value);
        });

        document.getElementById('global-product-image').value = p.imageUrl || '';
        
        const specsText = (p.specs || []).map(s => `${s.label}: ${s.value}`).join('\n');
        document.getElementById('global-product-specs').value = specsText;
        document.getElementById('global-product-tags').value = (p.tags || []).join('\n');
        
        this.updateImagePreview('global-product-image', p.imageUrl);
        
        document.getElementById('global-product-modal-title').textContent = 'Editar Producto';
        document.getElementById('modal-global-product').classList.add('active');
    }



    async saveGlobalProduct() {
        const id = document.getElementById('global-product-id').value;
        const selectedVerts = Array.from(document.querySelectorAll('#global-product-verticals input:checked')).map(i => i.value);
        const specsLines = document.getElementById('global-product-specs').value.split('\n').filter(x => x.trim().length > 0);
        const specsArray = specsLines.map(line => {
            const parts = line.split(':');
            return {
                label: parts[0] ? parts[0].trim() : '',
                value: parts.slice(1).join(':').trim() || ''
            };
        }).filter(s => s.label);

        const data = {
            name: document.getElementById('global-product-name').value,
            category: document.getElementById('global-product-category').value,
            verticals: selectedVerts,
            imageUrl: document.getElementById('global-product-image').value,
            description: document.getElementById('global-product-description').value,
            tags: document.getElementById('global-product-tags').value.split('\n').map(t => t.trim()).filter(Boolean),
            specs: specsArray 
        };

        if (!data.name) return alert('El nombre es obligatorio');

        try {
            if (id) await contentService.updateProduct(id, data);
            else await contentService.addProduct(data);
            
            document.getElementById('modal-global-product').classList.remove('active');
            this.loadGlobalProducts();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    }

    async deleteGlobalProduct(id) {
        if (!confirm('¿Seguro que quieres borrar este producto del catálogo?')) return;
        try {
            await contentService.deleteProduct(id);
            this.loadGlobalProducts();
        } catch (error) {
            alert('Error al borrar: ' + error.message);
        }
    }
}

// Inicializar el controlador general y exponerlo para acciones globales
let cmsInstance;
document.addEventListener('DOMContentLoaded', () => {
    cmsInstance = new CMSStudio();
    
    // Función global para que los botones de los formularios puedan abrir el explorador de archivos
    window.openMediaFor = (inputId) => {
        if (cmsInstance) {
            cmsInstance.activeImageInput = inputId;
            cmsInstance.openAssetBrowser();
        }
    };
});
