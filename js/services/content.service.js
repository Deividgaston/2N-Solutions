/**
 * 2N Presenter - Content Service
 * Handles Firestore operations for vertical content sections
 */

import { db, storage } from '../firebase-init.js';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
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
            const q = query(
                collection(db, this.collectionName),
                // We'll need to filter by vertical, but for now let's just create a subcollection structure or simple query
                // Let's use a root collection with a verticalId field for simplicity
                // Actually, filtering by verticalId is better
            );

            // Wait, we need 'where' clause. Importing it.
            // Re-evaluating import strategy...
            // Let's assume the user has sections stored with a verticalId field.

            // Actually, let's create a cleaner structure:
            // collection: 'verticals' -> doc: {verticalId} -> subcollection: 'sections'
            // This is clean and scalable.

            const sectionsRef = collection(db, 'verticals', verticalId, 'sections');
            const sectionsQuery = query(sectionsRef, orderBy('createdAt', 'asc'));

            const snapshot = await getDocs(sectionsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error getting sections for ${verticalId}:`, error);
            throw error;
        }
    }

    /**
     * List all images in the multimedia folder for a vertical
     * @param {string} verticalId - Optional, if we want to filter by vertical folder
     * @returns {Promise<Array>} Array of image objects
     */
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
     * Add a new section to a vertical using an existing image URL or new upload
     * @param {string} verticalId 
     * @param {string} imageUrl 
     * @param {string} text 
     * @param {string} imagePath - Optional (if we want to track storage path)
     */
    async addSection(verticalId, imageUrl, text, imagePath = null) {
        try {
            const sectionsRef = collection(db, 'verticals', verticalId, 'sections');
            const docRef = await addDoc(sectionsRef, {
                imageUrl,
                imagePath,
                text,
                createdAt: serverTimestamp()
            });

            return {
                id: docRef.id,
                imageUrl,
                text
            };
        } catch (error) {
            console.error('Error adding section:', error);
            throw error;
        }
    }

    /**
     * Delete a section
     * @param {string} verticalId 
     * @param {string} sectionId 
     * @param {string} imagePath 
     */
    async deleteSection(verticalId, sectionId, imagePath) {
        try {
            // 1. Delete image from Storage
            if (imagePath) {
                const storageRef = ref(storage, imagePath);
                await deleteObject(storageRef).catch(err => console.warn('Image delete error (might be missing):', err));
            }

            // 2. Delete document from Firestore
            const docRef = doc(db, 'verticals', verticalId, 'sections', sectionId);
            await deleteDoc(docRef);

            return true;
        } catch (error) {
            console.error('Error deleting section:', error);
            throw error;
        }
    }
}

export const contentService = new ContentService();
