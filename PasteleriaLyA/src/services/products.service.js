// src/services/products.service.js
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { writeBatch, increment } from 'firebase/firestore';

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

export const updateProductStock = async (items) => {
    const batch = writeBatch(db);
    let hayCambios = false;

    items.forEach(item => {
        if (item.controlarStock && item.id) {
            const productoRef = doc(db, COLLECTION_NAME, item.id);
            batch.update(productoRef, { stock: increment(-item.cantidad) });
            hayCambios = true;
        }
    });

    if (hayCambios) {
        await batch.commit();
        console.log("Stock actualizado correctamente");
    }
};

const COLLECTION_INSUMOS = 'insumos';
const COLLECTION_MOVIMIENTOS = 'movimientos_almacen';

// 1. GESTIÓN DE INSUMOS (MATERIA PRIMA)
// src/services/products.service.js

// 1. GESTIÓN DE INSUMOS (MATERIA PRIMA)
export const saveInsumo = async (insumo) => {
    try {
        if (insumo.id) {
            // EDITAR: Aquí sí necesitamos el ID para saber cuál actualizar
            const ref = doc(db, COLLECTION_INSUMOS, insumo.id);
            await updateDoc(ref, insumo);
        } else {
            // CREAR: Aquí el ID viene como 'undefined', así que LO QUITAMOS antes de enviar
            // Usamos desestructuración para separar 'id' del resto de los datos
            const { id, ...datosParaGuardar } = insumo;
            
            await addDoc(collection(db, COLLECTION_INSUMOS), {
                ...datosParaGuardar, // Usamos la copia limpia sin ID
                stock: parseFloat(insumo.stock) || 0,
                costoPromedio: parseFloat(insumo.costoPromedio) || 0,
                unidad: insumo.unidad || 'unidad'
            });
        }
        return { success: true, message: "Insumo guardado" };
    } catch (error) {
        console.error("Error saveInsumo:", error);
        throw error;
    }
};

export const deleteInsumo = async (id) => {
    await deleteDoc(doc(db, COLLECTION_INSUMOS, id));
};

export const subscribeToInsumos = (callback) => {
    return onSnapshot(collection(db, COLLECTION_INSUMOS), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
    });
};

// 2. REGISTRAR COMPRA (ENTRADA DE ALMACÉN + CÁLCULO DE COSTO PROMEDIO)
export const registrarCompraInsumo = async (insumoId, cantidadComprada, costoTotalCompra, insumoActual) => {
    const batch = writeBatch(db);
    const insumoRef = doc(db, COLLECTION_INSUMOS, insumoId);
    const movRef = doc(collection(db, COLLECTION_MOVIMIENTOS));

    // Cálculos numéricos
    const stockActual = parseFloat(insumoActual.stock) || 0;
    const costoPromActual = parseFloat(insumoActual.costoPromedio) || 0;
    const cantNueva = parseFloat(cantidadComprada);
    const costoCompra = parseFloat(costoTotalCompra);

    // Nuevo Stock
    const nuevoStock = stockActual + cantNueva;

    // Nuevo Costo Promedio (Ponderado)
    // Fórmula: ((StockActual * CostoActual) + (CostoTotalCompraNueva)) / NuevoStockTotal
    const valorInventarioActual = stockActual * costoPromActual;
    const nuevoCostoPromedio = (valorInventarioActual + costoCompra) / nuevoStock;

    // 1. Actualizar Insumo
    batch.update(insumoRef, {
        stock: nuevoStock,
        costoPromedio: nuevoCostoPromedio
    });

    // 2. Registrar Movimiento (Historial)
    batch.set(movRef, {
        tipo: 'ENTRADA',
        insumoId,
        nombreInsumo: insumoActual.nombre,
        cantidad: cantNueva,
        costoTotal: costoCompra,
        fecha: new Date().toISOString().split('T')[0],
        timestamp: new Date()
    });

    await batch.commit();
    return { success: true, message: "Compra registrada y costo actualizado" };
};

// 3. GUARDAR RECETA EN EL PRODUCTO
// Esto actualiza el producto con un array de ingredientes y su costo calculado
export const guardarRecetaProducto = async (productoId, receta, costoProduccion) => {
    const ref = doc(db, COLLECTION_NAME, productoId); // COLLECTION_NAME es 'productos'
    await updateDoc(ref, {
        receta: receta, // Array de { insumoId, cantidad, nombre, costoSnapshot }
        costoProduccion: costoProduccion,
        tieneReceta: true
    });
};