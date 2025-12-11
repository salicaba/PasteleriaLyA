// src/services/sales.service.js
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'ventas';

// Suscribirse a ventas
export const subscribeToSales = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// Crear una nueva venta (Cobrar ticket)
export const createSale = async (saleData) => {
    try {
        await addDoc(collection(db, COLLECTION_NAME), saleData);
        return { success: true, message: "Venta registrada" };
    } catch (error) {
        console.error("Error en createSale:", error);
        throw error;
    }
};

// Eliminar una venta (Anular ticket)
export const deleteSale = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true, message: "Venta anulada" };
    } catch (error) {
        console.error("Error en deleteSale:", error);
        throw error;
    }
};