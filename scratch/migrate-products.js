import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase (debes usar la misma que en firebase-init.js)
// Como soy un bot, asumo que las claves están en el entorno o en el init.
// Para este script, solo definiré los datos y el usuario los ejecutará si quiere, 
// pero mejor lo inyecto directamente si puedo.

const firebaseConfig = {
  apiKey: "AIzaSyCX-XXXXXXXX", // El usuario tiene las credenciales en su firebase-init.js
  authDomain: "specifications-solutions-2n.firebaseapp.com",
  projectId: "specifications-solutions-2n",
  storageBucket: "specifications-solutions-2n.appspot.com",
  messagingSenderId: "367272216854",
  appId: "1:367272216854:web:XXXXXXXX"
};

const products = [
    {
        name: "2N® IP Style",
        category: "intercom",
        description: "El videoportero con la pantalla táctil de 10 pulgadas más grande y nítida del mercado. Incluye cámara 5MP y tecnología WaveKey.",
        imageUrl: "assets/New product renders/2N_IP-Verso_2M_Flush_Black_Touch Display_Left.png",
        tags: ["WaveKey", "10' Touch Screen", "IP65", "IK08"],
        order: 0
    },
    {
        name: "2N® IP Verso 2.0",
        category: "intercom",
        description: "La nueva generación del intercomunicador más modular del mundo. Cámara Full HD y procesador ultra rápido.",
        imageUrl: "assets/New product renders/2N_IP-Verso_2M_Flush_Black_5-Buttons_Left.png",
        tags: ["Modular", "Full HD", "Wide Angle"],
        order: 1
    },
    {
        name: "2N® Access Unit 2.0",
        category: "access",
        description: "Lector de acceso inteligente que combina Bluetooth, RFID y teclado en un solo dispositivo elegante.",
        imageUrl: "assets/AU 2.0 photos/2N Access Unit 2.0 Bluetooth & RFID/9160335_Access_Unit_2_0_Bluetooth_&_RFID_black_flush_front_hq.png",
        tags: ["Bluetooth", "RFID", "PIN"],
        order: 2
    },
    {
        name: "2N® Indoor View",
        category: "indoor",
        description: "Unidad de respuesta de 7 pulgadas con superficie de cristal premium blanca. Perfecta para ver quién está en la puerta.",
        imageUrl: "assets/Indoor Touch 2.0 photos/91378375WH_Indoor-Touch-2.0_White_Front_Idle.png",
        tags: ["7' Screen", "Glass Surface", "HD Audio"],
        order: 3
    }
];

// Nota: Este script es una referencia. Lo ideal es que el usuario use el panel admin.
console.log("Productos listos para migrar:", products);
