// src/services/sessions.service.js
import { db } from '../firebase';
import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'sesiones_llevar';

// Suscribirse a sesiones activas
export const subscribeToSessions = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// Crear nueva sesión "Para Llevar"
export const createSession = async (clientData) => {
    try {
        const nuevaId = `L-${Date.now().toString().slice(-4)}`;
        const nuevaSesion = { 
            id: nuevaId, 
            tipo: 'llevar', 
            nombreCliente: clientData.nombre, 
            telefono: clientData.telefono, 
            cuenta: [], 
            estado: 'Activa' 
        };
        await setDoc(doc(db, COLLECTION_NAME, nuevaId), nuevaSesion);
        return { success: true, message: "Sesión creada", session: nuevaSesion };
    } catch (error) {
        console.error("Error en createSession:", error);
        throw error;
    }
};

// Actualizar sesión (Agregar productos)
export const updateSession = async (id, data) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), data);
        return { success: true };
    } catch (error) {
        console.error("Error en updateSession:", error);
        throw error;
    }
};

// Eliminar sesión (Cuando se paga o cancela)
export const deleteSession = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        console.error("Error en deleteSession:", error);
        throw error;
    }
};

export const saveSession = async (session) => {
    try {
        await setDoc(doc(db, COLLECTION_NAME, session.id), session);
        return { success: true, message: "Sesión guardada" };
    } catch (error) {
        console.error("Error en saveSession:", error);
        throw error;
    }
};