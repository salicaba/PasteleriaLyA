// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <--- Esta línea es vital para la BD

// Tu configuración (Copiada de tu imagen)
const firebaseConfig = {
  apiKey: "AIzaSyB_HYGRL4jILi2izlyPUf8_3GJld7TlN0M",
  authDomain: "pastelerialya-cd733.firebaseapp.com",
  projectId: "pastelerialya-cd733",
  storageBucket: "pastelerialya-cd733.firebasestorage.app",
  messagingSenderId: "802284395800",
  appId: "1:802284395800:web:ba25f9fa026981f527d26d"
};

// 1. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializar y exportar la Base de Datos
export const db = getFirestore(app);