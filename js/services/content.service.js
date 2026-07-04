/**
 * 2N Presenter - Content Service
 * Handles Firestore operations for vertical content sections
 */

import { db, storage } from '../firebase-init.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

class ContentService {
    constructor() {
        this.collectionName = 'vertical_sections';
        this.CACHE_EXPIRY = 24 * 60 * 60 * 1000; // Increase to 24h as we have versioning now
    }

    /**
     * Get the global last update timestamp from Firestore
     * Optimized: only one read per page load session
     */
    async getRemoteVersion() {
        if (this.remoteVersionPromise) return this.remoteVersionPromise;
        
        this.remoteVersionPromise = (async () => {
            try {
                const docRef = doc(db, 'metadata', 'last_update');
                const snap = await getDoc(docRef);
                return snap.exists() ? snap.data().timestamp?.seconds || 0 : 0;
            } catch (e) {
                console.warn('Error getting remote version', e);
                return 0;
            }
        })();

        return this.remoteVersionPromise;
    }

    /**
     * Update the global last update timestamp in Firestore
     */
    async updateRemoteVersion() {
        this.remoteVersionPromise = null; // Clear local promise
        try {
            const docRef = doc(db, 'metadata', 'last_update');
            await setDoc(docRef, { timestamp: serverTimestamp() }, { merge: true });
        } catch (e) {
            console.warn('Error updating remote version', e);
        }
    }

    /**
     * Helper to handle localStorage cache
     */
    async _fetchCached(cacheKey, fetchFn) {
        const cached = localStorage.getItem(cacheKey);
        const remoteVersion = await this.getRemoteVersion();

        if (cached) {
            try {
                const { data, timestamp, version } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                
                // Use version comparison instead of just time
                if (version === remoteVersion && age < this.CACHE_EXPIRY) {
                    console.log(`Cache Hit (v${version}): ${cacheKey}`);
                    return data;
                }
            } catch (e) {
                console.warn('Cache parse error', e);
            }
        }

        console.log(`Cache Miss/New Version (${remoteVersion}): ${cacheKey}. Fetching...`);
        const data = await fetchFn();
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: Date.now(),
                version: remoteVersion
            }));
        } catch (e) {
            console.warn('Cache save error', e);
        }
        
        return data;
    }

    /**
     * Client-side image compression and resizing
     */
    async _compressImage(file, maxWidth = 1600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) return resolve(file);
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) return resolve(file);
                        // Return as a new File object in WebP format
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp',
                            lastModified: Date.now()
                        }));
                    }, 'image/webp', quality);
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = (error) => reject(error);
        });
    }

    _clearCache(verticalId = null) {
        if (verticalId) {
            const keys = [
                `sections_${verticalId}`,
                `meta_${verticalId}`,
                `products_${verticalId}`,
                `cases_${verticalId}`
            ];
            keys.forEach(k => localStorage.removeItem(k));
        } else {
            // Clear global keys
            const globalKeys = ['all_products', 'all_global_cases'];
            globalKeys.forEach(k => localStorage.removeItem(k));
        }
    }

    /**
     * Get all sections for a specific vertical
     * @param {string} verticalId - The ID of the vertical (e.g., 'bts', 'office')
     * @returns {Promise<Array>} Array of section objects
     */
    async getSections(verticalId) {
        return this._fetchCached(`sections_${verticalId}`, async () => {
            try {
                const sectionsRef = collection(db, 'verticals', verticalId, 'sections');
                const sectionsQuery = query(sectionsRef);

                const snapshot = await getDocs(sectionsQuery);
                const sections = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return sections.sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 9999;
                    const orderB = b.order !== undefined ? b.order : 9999;
                    if (orderA !== orderB) return orderA - orderB;
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeA - timeB;
                });
            } catch (error) {
                console.error(`Error getting sections for ${verticalId}:`, error);
                throw error;
            }
        });
    }

    /**
     * Get vertical metadata (Intro title, text, benefits)
     * @param {string} verticalId 
     */
    async getVerticalMeta(verticalId) {
        return this._fetchCached(`meta_${verticalId}`, async () => {
            try {
                const docRef = doc(db, 'verticals', verticalId);
                const snapshot = await getDoc(docRef);
                return snapshot.exists() ? snapshot.data() : null;
            } catch (error) {
                console.error('Error getting vertical meta:', error);
                return null;
            }
        });
    }

    /**
     * Update vertical metadata
     * @param {string} verticalId 
     * @param {Object} data { introTitle, introText, benefits }
     */
    async updateVerticalMeta(verticalId, data) {
        try {
            const docRef = doc(db, 'verticals', verticalId);
            await setDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            this._clearCache(verticalId); // Invalidate cache on update
            return true;
        } catch (error) {
            console.error('Error updating vertical meta:', error);
            throw error;
        }
    }

    /**
     * List all content (files and folders) in a specific storage path
     * @param {string} path - The full storage path (e.g., 'multimedia' or 'multimedia/bts')
     * @returns {Promise<{folders: Array, files: Array}>} Object containing folders and files
     */
    async listMultimediaContents(path = 'multimedia') {
        try {
            // Ensure path doesn't have leading/trailing slashes for listAll
            const cleanPath = path.replace(/^\/+|\/+$/g, '') || 'multimedia';
            const folderRef = ref(storage, cleanPath);
            const result = await listAll(folderRef);

            const folders = result.prefixes.map(folderRef => ({
                name: folderRef.name,
                fullPath: folderRef.fullPath
            }));

            const files = await Promise.all(result.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url
                };
            }));

            return { folders, files };
        } catch (error) {
            console.error('Error listing multimedia contents:', error);
            return { folders: [], files: [] };
        }
    }

    /**
     * Upload a file to a specific storage path
     * @param {File} file - The file object to upload
     * @param {string} path - The target path (e.g., 'multimedia/bts')
     */
    async uploadFile(file, path = 'multimedia') {
        try {
            // OPTIMIZATION: Compress before upload
            const optimizedFile = await this._compressImage(file);
            console.log(`Optimization: ${file.name} reduced from ${(file.size/1024/1024).toFixed(2)}MB to ${(optimizedFile.size/1024/1024).toFixed(2)}MB`);

            const cleanPath = path.replace(/\/+$/, '');
            const fileRef = ref(storage, `${cleanPath}/${optimizedFile.name}`);
            const snapshot = await uploadBytes(fileRef, optimizedFile);
            const url = await getDownloadURL(snapshot.ref);
            return {
                name: optimizedFile.name,
                fullPath: snapshot.ref.fullPath,
                url
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Add a new section to a vertical
     */
    async addSection(verticalId, data) {
        try {
            const sectionsRef = collection(db, 'verticals', verticalId, 'sections');

            // Get current max order
            const q = query(sectionsRef, orderBy('order', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let nextOrder = 0;
            if (!snapshot.empty) {
                nextOrder = (snapshot.docs[0].data().order || 0) + 1;
            }

            const docRef = await addDoc(sectionsRef, {
                imageUrl: data.imageUrl,
                imagePath: data.imagePath || null,
                text: data.text,
                title: data.title || '',
                tags: data.tags || [],
                layout: data.layout || 'left',
                textAlign: data.textAlign || 'left',
                order: nextOrder,
                createdAt: serverTimestamp()
            });

            this._clearCache(verticalId);
            return {
                id: docRef.id,
                ...data
            };
        } catch (error) {
            console.error('Error adding section:', error);
            throw error;
        }
    }

    /**
     * Update an existing section
     */
    async updateSection(verticalId, sectionId, data) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'sections', sectionId);

            // Clean undefined values
            const updateData = { ...data, updatedAt: serverTimestamp() };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating section:', error);
            throw error;
        }
    }


    /**
     * Update section order
     */
    async updateSectionOrder(verticalId, sectionId, newOrder) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'sections', sectionId);
            await updateDoc(docRef, { order: newOrder });
            this._clearCache(verticalId);
            await this.updateRemoteVersion();
            return true;
        } catch (error) {
            console.error('Error updating section order:', error);
            throw error;
        }
    }

    async updateTechCardOrder(verticalId, cardId, newOrder) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'tech_cards', cardId);
            await updateDoc(docRef, { order: newOrder });
            return true;
        } catch (error) {
            console.error('Error updating tech order:', error);
            throw error;
        }
    }

    async updateCaseOrder(verticalId, caseId, newOrder) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'cases', caseId);
            await updateDoc(docRef, { order: newOrder });
            return true;
        } catch (error) {
            console.error('Error updating case order:', error);
            throw error;
        }
    }

    /**
     * Clone a section to another vertical
     */
    async cloneSection(sourceVerticalId, sectionId, targetVerticalIds) {
        try {
            // 1. Get original section data
            const sourceDocRef = doc(db, 'verticals', sourceVerticalId, 'sections', sectionId);
            const sourceSnap = await getDoc(sourceDocRef);

            if (!sourceSnap.exists()) throw new Error('Source section not found');
            const sourceData = sourceSnap.data();

            // 2. Clone to each target vertical
            const promises = targetVerticalIds.map(async (targetId) => {
                if (targetId === sourceVerticalId) return; // Skip same vertical

                // Calculate next order for target vertical
                const targetRef = collection(db, 'verticals', targetId, 'sections');
                const q = query(targetRef, orderBy('order', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                let nextOrder = 0;
                if (!snapshot.empty) {
                    nextOrder = (snapshot.docs[0].data().order || 0) + 1;
                }

                // Add document
                await addDoc(targetRef, {
                    ...sourceData,
                    order: nextOrder,
                    createdAt: serverTimestamp()
                });
            });

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Error cloning section:', error);
            throw error;
        }
    }

    /**
     * Delete a section
     */
    async deleteSection(verticalId, sectionId, imagePath) {
        try {
            // 1. Delete image from Storage (ONLY if not used by others - naive check for now)
            // For cloning sake, we should NOT delete the image if it's cloned.
            // But since we copy imagePath string, multiple docs point to same storage object.
            // Ideally we'd refuse to delete image if other docs reference it.
            // For now, let's keep the image if it's potentially shared, OR alert user.
            // Simple approach: Only delete Firestore doc to avoid breaking clones. 
            // Manual cleanup or reference counting needed for robust image deletion.

            // Commenting out explicit image deletion for now to support cloning safety
            /*
            if (imagePath) {
                const storageRef = ref(storage, imagePath);
                await deleteObject(storageRef).catch(err => console.warn('Image delete error', err));
            }
            */

            // 2. Delete document from Firestore
            const docRef = doc(db, 'verticals', verticalId, 'sections', sectionId);
            await deleteDoc(docRef);
            this._clearCache(verticalId);

            return true;
        } catch (error) {
            console.error('Error deleting section:', error);
            throw error;
        }
    }

    // ========================
    // TECH CARDS (DISPOSITIVOS)
    // ========================

    async getTechCards(verticalId) {
        return this._fetchCached(`tech_${verticalId}`, async () => {
            try {
                const cardsRef = collection(db, 'verticals', verticalId, 'tech_cards');
                const snapshot = await getDocs(query(cardsRef, orderBy('order', 'asc')));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Error getting tech cards for ${verticalId}:`, error);
                throw error;
            }
        });
    }

    async addTechCard(verticalId, data) {
        try {
            const cardsRef = collection(db, 'verticals', verticalId, 'tech_cards');
            const q = query(cardsRef, orderBy('order', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let nextOrder = 0;
            if (!snapshot.empty) nextOrder = (snapshot.docs[0].data().order || 0) + 1;

            const docRef = await addDoc(cardsRef, {
                ...data,
                order: nextOrder,
                createdAt: serverTimestamp()
            });

            this._clearCache(verticalId);
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding tech card:', error);
            throw error;
        }
    }

    async updateTechCard(verticalId, cardId, data) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'tech_cards', cardId);
            const updateData = { ...data, updatedAt: serverTimestamp() };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            
            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating tech card:', error);
            throw error;
        }
    }

    async deleteTechCard(verticalId, cardId) {
        try {
            await deleteDoc(doc(db, 'verticals', verticalId, 'tech_cards', cardId));
            return true;
        } catch (error) {
            console.error('Error deleting tech card:', error);
            throw error;
        }
    }

    // ========================
    // CASOS DE ÉXITO
    // ========================

    async getCases(verticalId) {
        return this._fetchCached(`cases_legacy_${verticalId}`, async () => {
            try {
                const casesRef = collection(db, 'verticals', verticalId, 'cases');
                const snapshot = await getDocs(query(casesRef, orderBy('order', 'asc')));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Error getting cases for ${verticalId}:`, error);
                throw error;
            }
        });
    }

    async addCase(verticalId, data) {
        try {
            const casesRef = collection(db, 'verticals', verticalId, 'cases');
            const q = query(casesRef, orderBy('order', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let nextOrder = 0;
            if (!snapshot.empty) nextOrder = (snapshot.docs[0].data().order || 0) + 1;

            const docRef = await addDoc(casesRef, {
                ...data,
                order: nextOrder,
                createdAt: serverTimestamp()
            });

            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding case:', error);
            throw error;
        }
    }

    async updateCase(verticalId, caseId, data) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'cases', caseId);
            const updateData = { ...data, updatedAt: serverTimestamp() };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            
            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating case:', error);
            throw error;
        }
    }

    async deleteCase(verticalId, caseId) {
        try {
            await deleteDoc(doc(db, 'verticals', verticalId, 'cases', caseId));
            return true;
        } catch (error) {
            console.error('Error deleting case:', error);
            throw error;
        }
    }

    // ========================
    // GLOBAL SUCCESS CASES
    // ========================

    /**
     * Get cases for a specific vertical from the GLOBAL collection
     * Supports multi-vertical cases
     */
    async getGlobalCasesByVertical(verticalId) {
        return this._fetchCached(`cases_${verticalId}`, async () => {
            try {
                const { where, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                const casesRef = collection(db, 'cases');
                // Filter by vertical in the array
                const q = query(
                    casesRef, 
                    where('verticals', 'array-contains', verticalId)
                );
                const snapshot = await getDocs(q);
                const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Sort by order/date on client side to avoid index headache for user
                return cases.sort((a,b) => (a.order || 0) - (b.order || 0));
            } catch (error) {
                console.error(`Error getting global cases for ${verticalId}:`, error);
                return [];
            }
        });
    }

    async getAllGlobalCases() {
        return this._fetchCached('all_global_cases', async () => {
            try {
                const casesRef = collection(db, 'cases');
                const snapshot = await getDocs(query(casesRef, orderBy('createdAt', 'desc')));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error getting all global cases:', error);
                return [];
            }
        });
    }

    async addGlobalCase(data) {
        try {
            const casesRef = collection(db, 'cases');
            const docRef = await addDoc(casesRef, {
                ...data,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding global case:', error);
            throw error;
        }
    }

    async updateGlobalCase(caseId, data) {
        try {
            const docRef = doc(db, 'cases', caseId);
            const updateData = { ...data, updatedAt: serverTimestamp() };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating global case:', error);
            throw error;
        }
    }

    async deleteGlobalCase(caseId) {
        try {
            await deleteDoc(doc(db, 'cases', caseId));
            return true;
        } catch (error) {
            console.error('Error deleting global case:', error);
            throw error;
        }
    }

    // ========================
    // FOLDER MANAGEMENT
    // ========================


    /**
     * Create a folder by uploading a dummy file
     * @param {string} path - Parent path
     * @param {string} folderName - New folder name
     */
    async createFolder(path, folderName) {
        try {
            const fullPath = `${path}/${folderName}/.keep`;
            const storageRef = ref(storage, fullPath);
            const blob = new Blob([''], { type: 'application/octet-stream' });
            await uploadBytes(storageRef, blob);
            return true;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    /**
     * Delete a folder and all its contents recursively
     * @param {string} path - Full path to folder
     */
    async deleteFolder(path) {
        try {
            const folderRef = ref(storage, path);
            const result = await listAll(folderRef);

            // Delete files
            const filePromises = result.items.map(fileRef => deleteObject(fileRef));

            // Recurse for subfolders
            const folderPromises = result.prefixes.map(subFolderRef =>
                this.deleteFolder(subFolderRef.fullPath)
            );

            await Promise.all([...filePromises, ...folderPromises]);
            return true;
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    }

    /**
     * Delete a single file
     * @param {string} path 
     */
    async deleteFile(path) {
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // ========================
    // USER MANAGEMENT
    // ========================

    async getUsers() {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }

    async addUser(userData) {
        try {
            const usersRef = collection(db, 'users');
            const docRef = await addDoc(usersRef, {
                ...userData,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...userData };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            const docRef = doc(db, 'users', userId);
            await updateDoc(docRef, {
                ...userData,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // ========================
    // GLOBAL PRODUCTS
    // ========================

    async getAllProducts() {
        return this._fetchCached('all_products', async () => {
            try {
                const productsRef = collection(db, 'products');
                const snapshot = await getDocs(query(productsRef, orderBy('order', 'asc')));
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error getting all products:', error);
                return [];
            }
        });
    }

    async getGlobalProductsByVertical(verticalId) {
        return this._fetchCached(`products_${verticalId}`, async () => {
            try {
                const { where, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                const productsRef = collection(db, 'products');
                const q = query(productsRef, where('verticals', 'array-contains', verticalId));
                const snapshot = await getDocs(q);
                const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return products.sort((a,b) => (a.order || 0) - (b.order || 0));
            } catch (error) {
                console.error(`Error getting recommended products for ${verticalId}:`, error);
                return [];
            }
        });
    }

    async addProduct(data) {
        try {
            const productsRef = collection(db, 'products');
            // Get next order
            const q = query(productsRef, orderBy('order', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            let nextOrder = 0;
            if (!snapshot.empty) nextOrder = (snapshot.docs[0].data().order || 0) + 1;

            const docRef = await addDoc(productsRef, {
                ...data,
                order: nextOrder,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(productId, data) {
        try {
            const docRef = doc(db, 'products', productId);
            const updateData = { ...data, updatedAt: serverTimestamp() };
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            await updateDoc(docRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    async updateProductOrder(productId, newOrder) {
        try {
            const docRef = doc(db, 'products', productId);
            await updateDoc(docRef, { order: newOrder });
            return true;
        } catch (error) {
            console.error('Error updating product order:', error);
            throw error;
        }
    }
}

export const contentService = new ContentService();
