// src/services/orders.service.js
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from 'firebase/firestore';

const COLLECTION_NAME = 'pedidos';

// Suscribirse a pedidos en tiempo real
export const subscribeToOrders = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// Guardar (Crear o Editar) un pedido
export const saveOrder = async (orderData) => {
    try {
        if (orderData.id) {
            await updateDoc(doc(db, COLLECTION_NAME, orderData.id), orderData);
            return { success: true, message: "Pedido actualizado" };
        } else {
            await addDoc(collection(db, COLLECTION_NAME), orderData);
            return { success: true, message: `Pedido ${orderData.folio} registrado` };
        }
    } catch (error) {
        console.error("Error en saveOrder:", error);
        throw error;
    }
};

// Actualizar estado (para cancelar, restaurar, entregar o registrar pagos)
export const updateOrderStatus = async (id, updates) => {
    try {
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        return { success: true };
    } catch (error) {
        console.error("Error en updateOrderStatus:", error);
        throw error;
    }
};

// Eliminar un pedido permanentemente
export const deleteOrder = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true, message: "Pedido eliminado definitivamente" };
    } catch (error) {
        console.error("Error en deleteOrder:", error);
        throw error;
    }
};

// Vaciar papelera (Eliminar múltiples pedidos cancelados)
export const emptyOrdersTrash = async (ordersToDelete) => {
    try {
        const batch = writeBatch(db);
        ordersToDelete.forEach(p => {
            const ref = doc(db, COLLECTION_NAME, p.id);
            batch.delete(ref);
        });
        await batch.commit();
        return { success: true, message: "Papelera de pastelería vaciada" };
    } catch (error) {
        console.error("Error vaciando papelera:", error);
        throw error;
    }
};