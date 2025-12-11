// src/services/users.service.js
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const COLLECTION_NAME = 'usuarios';

// Suscribirse a la lista de usuarios
export const subscribeToUsers = (callback) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// Guardar usuario (Crear o Actualizar)
export const saveUser = async (user, usersList = []) => {
    try {
        if (user.id) {
            // Actualizar
            await updateDoc(doc(db, COLLECTION_NAME, user.id), user);
            return { success: true, message: `Usuario ${user.nombre} actualizado` };
        } else {
            // Crear (validando duplicados)
            const existe = usersList.find(u => u.usuario === user.usuario);
            if (existe) {
                throw new Error("El nombre de usuario ya existe.");
            }
            await addDoc(collection(db, COLLECTION_NAME), user);
            return { success: true, message: `Usuario ${user.nombre} creado` };
        }
    } catch (error) {
        console.error("Error en saveUser:", error);
        throw error;
    }
};

// Eliminar usuario
export const deleteUser = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true, message: "Usuario eliminado" };
    } catch (error) {
        console.error("Error en deleteUser:", error);
        throw error;
    }
};