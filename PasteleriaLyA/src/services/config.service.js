import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

const CONFIG_ID = 'estado_general'; // Nombre del documento en la BD

// Escuchar cambios en tiempo real (Para que se bloquee al instante en los celulares)
export const suscribirEstadoServicio = (callback) => {
    const docRef = doc(db, 'configuracion', CONFIG_ID);
    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data().servicioActivo);
        } else {
            // Si no existe, crearlo como activo por defecto
            setDoc(docRef, { servicioActivo: true });
            callback(true);
        }
    });
};

// Cambiar el estado (Para el Admin)
export const cambiarEstadoServicio = async (nuevoEstado) => {
    const docRef = doc(db, 'configuracion', CONFIG_ID);
    await setDoc(docRef, { servicioActivo: nuevoEstado }, { merge: true });
};