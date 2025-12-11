// src/services/products.service.js
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'productos';

// Crear o Actualizar un producto (Upsert)
export const saveProduct = async (product) => {
    try {
        if (product.id) {
            // Si tiene ID, es una actualización
            const productRef = doc(db, COLLECTION_NAME, product.id);
            await updateDoc(productRef, product);
            return { success: true, message: "Producto actualizado correctamente" };
        } else {
            // Si no, es uno nuevo
            await addDoc(collection(db, COLLECTION_NAME), product);
            return { success: true, message: "Producto creado correctamente" };
        }
    } catch (error) {
        console.error("Error en saveProduct:", error);
        throw error;
    }
};

// Eliminar producto
export const deleteProduct = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true, message: "Producto eliminado" };
    } catch (error) {
        console.error("Error en deleteProduct:", error);
        throw error;
    }
};

// Suscribirse a cambios (para usar en useEffect luego)
export const subscribeToProducts = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};