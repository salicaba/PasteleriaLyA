// src/services/mesas.service.js
import { db } from '../firebase';
import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'mesas';

// Agregar nueva mesa
export const createMesa = async (numeroMesaActual) => {
    try {
        // ANTES: Generaba un ID aleatorio basado en tiempo
        // const nuevaId = `M-${Date.now().toString().slice(-5)}`;
        
        // AHORA: Generamos un ID limpio y legible
        const numero = numeroMesaActual + 1;
        const nuevaId = `mesa${numero}`; // Ej: "mesa1"
        
        const nuevaMesa = { 
            id: nuevaId, 
            nombre: `Mesa ${numero}`, 
            tipo: 'mesa', 
            estado: 'Libre', 
            cuentas: [] 
        };
        
        // Usamos nuevaId como la clave del documento
        await setDoc(doc(db, COLLECTION_NAME, nuevaId), nuevaMesa);
        return { success: true, message: "Mesa agregada" };
    } catch (error) {
        console.error("Error en createMesa:", error);
        throw error;
    }
};

// Actualizar mesa (para agregar cuentas, mover pedidos, etc.)
export const updateMesa = async (id, data) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), data);
        return { success: true };
    } catch (error) {
        console.error("Error en updateMesa:", error);
        throw error;
    }
};

// Eliminar mesa
export const removeMesa = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true, message: "Mesa eliminada" };
    } catch (error) {
        console.error("Error en removeMesa:", error);
        throw error;
    }
};

// Suscripción
export const subscribeToMesas = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Ordenar alfabéticamente
        data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        callback(data);
    });
};