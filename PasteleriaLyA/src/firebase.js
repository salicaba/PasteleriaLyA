// src/firebase.js
import { initializeApp } from "firebase/app";
// 1. CAMBIO EN EL IMPORT: Agregamos initializeFirestore y las herramientas de caché
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyB_HYGRL4jILi2izlyPUf8_3GJld7TlN0M",
  authDomain: "pastelerialya-cd733.firebaseapp.com",
  projectId: "pastelerialya-cd733",
  storageBucket: "pastelerialya-cd733.firebasestorage.app",
  messagingSenderId: "802284395800",
  appId: "1:802284395800:web:ba25f9fa026981f527d26d"
};

// Inicializar Firebase (esto se queda igual)
const app = initializeApp(firebaseConfig);

// 2. CAMBIO EN LA INICIALIZACIÓN DE LA BD:
// En lugar de usar solo getFirestore(app), usamos initializeFirestore con configuración
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() 
  })
});