/**
 * 2N Presenter - Database Initialization Script
 * Run this once after creating your admin user in Firebase Auth
 * 
 * INSTRUCTIONS:
 * 1. Create user in Firebase Auth Console (gastonortigosa@gmail.com)
 * 2. Copy the User UID from the Auth console
 * 3. Replace ADMIN_UID below with the actual UID
 * 4. Open init-db.html in browser to run this script
 */

import { db } from './firebase-init.js';
import { doc, setDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ========================================
// CONFIGURATION - EDIT THIS
// ========================================
const ADMIN_UID = 'PASTE_YOUR_UID_HERE'; // <-- Replace with actual UID from Firebase Auth
const ADMIN_EMAIL = 'gastonortigosa@gmail.com';
const ADMIN_NAME = 'David Gastón';

// ========================================
// INITIALIZATION FUNCTIONS
// ========================================

async function initializeAdmin() {
    console.log('Creating admin user document...');
    await setDoc(doc(db, 'users', ADMIN_UID), {
        email: ADMIN_EMAIL,
        displayName: ADMIN_NAME,
        role: 'admin',
        language: 'es',
        createdAt: serverTimestamp()
    });
    console.log('✅ Admin user created');
}

async function initializeVerticals() {
    console.log('Creating verticals...');

    const verticals = [
        { id: 'bts', name: { es: 'Residencial BTS', en: 'Residential BTS', pt: 'Residencial BTS' }, order: 1 },
        { id: 'btr', name: { es: 'Residencial BTR', en: 'Residential BTR', pt: 'Residencial BTR' }, order: 2 },
        { id: 'office', name: { es: 'Oficinas', en: 'Offices', pt: 'Escritórios' }, order: 3 },
        { id: 'hotel', name: { es: 'Hoteles', en: 'Hotels', pt: 'Hotéis' }, order: 4 },
        { id: 'retail', name: { es: 'Retail', en: 'Retail', pt: 'Varejo' }, order: 5 }
    ];

    for (const v of verticals) {
        await setDoc(doc(db, 'verticals', v.id), {
            name: v.name,
            description: { es: '', en: '', pt: '' },
            icon: '',
            order: v.order,
            isActive: true
        });
        console.log(`  ✅ Vertical: ${v.id}`);
    }
    console.log('✅ All verticals created');
}

async function initializeSampleSections() {
    console.log('Creating sample sections...');

    const sections = [
        {
            verticalId: 'bts',
            title: { es: 'Introducción 2N', en: '2N Introduction', pt: 'Introdução 2N' },
            content: {
                es: '2N es líder global en intercomunicadores IP y control de acceso, parte del grupo Axis Communications.',
                en: '2N is a global leader in IP intercoms and access control, part of the Axis Communications group.',
                pt: '2N é líder global em intercomunicadores IP e controle de acesso, parte do grupo Axis Communications.'
            },
            order: 1,
            isActive: true,
            images: []
        },
        {
            verticalId: 'bts',
            title: { es: 'Beneficios para Promotores', en: 'Benefits for Developers', pt: 'Benefícios para Promotores' },
            content: {
                es: 'Mayor valor percibido de la vivienda, diferenciación en el mercado, reducción de costes de mantenimiento.',
                en: 'Higher perceived property value, market differentiation, reduced maintenance costs.',
                pt: 'Maior valor percebido da propriedade, diferenciação no mercado, redução de custos de manutenção.'
            },
            order: 2,
            isActive: true,
            images: []
        },
        {
            verticalId: 'office',
            title: { es: 'Control de Acceso Corporativo', en: 'Corporate Access Control', pt: 'Controle de Acesso Corporativo' },
            content: {
                es: 'Soluciones de acceso móvil, tarjetas RFID y códigos QR para edificios de oficinas modernos.',
                en: 'Mobile access, RFID cards, and QR code solutions for modern office buildings.',
                pt: 'Soluções de acesso móvel, cartões RFID e códigos QR para edifícios de escritórios modernos.'
            },
            order: 1,
            isActive: true,
            images: []
        }
    ];

    for (let i = 0; i < sections.length; i++) {
        await setDoc(doc(collection(db, 'sections')), sections[i]);
        console.log(`  ✅ Section ${i + 1}`);
    }
    console.log('✅ Sample sections created');
}

// ========================================
// MAIN EXECUTION
// ========================================

async function runInitialization() {
    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');

    const log = (msg) => {
        console.log(msg);
        logEl.innerHTML += msg + '<br>';
    };

    try {
        statusEl.textContent = 'Inicializando...';
        statusEl.className = 'loading';

        if (ADMIN_UID === 'PASTE_YOUR_UID_HERE') {
            throw new Error('⚠️ Debes reemplazar ADMIN_UID con el UID real de Firebase Auth');
        }

        log('🚀 Iniciando configuración de base de datos...');

        await initializeAdmin();
        log('✅ Usuario admin creado');

        await initializeVerticals();
        log('✅ Verticales creadas');

        await initializeSampleSections();
        log('✅ Secciones de ejemplo creadas');

        statusEl.textContent = '¡Inicialización completada!';
        statusEl.className = 'success';
        log('');
        log('🎉 ¡Todo listo! Ahora puedes ir a index.html e iniciar sesión.');

    } catch (error) {
        console.error('Error:', error);
        statusEl.textContent = 'Error: ' + error.message;
        statusEl.className = 'error';
        log('❌ ' + error.message);
    }
}

// Expose to window for button click
window.runInitialization = runInitialization;
