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
    }

    /**
     * Get all sections for a specific vertical
     * @param {string} verticalId - The ID of the vertical (e.g., 'bts', 'office')
     * @returns {Promise<Array>} Array of section objects
     */
    async getSections(verticalId) {
        try {
            const sectionsRef = collection(db, 'verticals', verticalId, 'sections');
            // Fetch all without complex sorting to avoid Index errors for now
            // and to ensure we get legacy documents that might lack the 'order' field
            const sectionsQuery = query(sectionsRef);

            const snapshot = await getDocs(sectionsQuery);
            const sections = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort
            return sections.sort((a, b) => {
                const orderA = a.order !== undefined ? a.order : 9999;
                const orderB = b.order !== undefined ? b.order : 9999;

                if (orderA !== orderB) return orderA - orderB;

                // Secondary sort by createdAt
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });
        } catch (error) {
            console.error(`Error getting sections for ${verticalId}:`, error);
            throw error;
        }
    }

    /**
     * Get vertical metadata (Intro title, text, benefits)
     * @param {string} verticalId 
     */
    async getVerticalMeta(verticalId) {
        try {
            const docRef = doc(db, 'verticals', verticalId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                return snapshot.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting vertical meta:', error);
            return null;
        }
    }

    /**
     * Update vertical metadata
     * @param {string} verticalId 
     * @param {Object} data { introTitle, introText, benefits }
     */
    async updateVerticalMeta(verticalId, data) {
        try {
            const docRef = doc(db, 'verticals', verticalId);
            // setDoc with merge: true creates the doc if it doesn't exist
            await setDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
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
            const folderRef = ref(storage, path);
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
     * Update section order
     */
    async updateSectionOrder(verticalId, sectionId, newOrder) {
        try {
            const docRef = doc(db, 'verticals', verticalId, 'sections', sectionId);
            await updateDoc(docRef, { order: newOrder });
            return true;
        } catch (error) {
            console.error('Error updating section order:', error);
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

            return true;
        } catch (error) {
            console.error('Error deleting section:', error);
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
}

export const contentService = new ContentService();
