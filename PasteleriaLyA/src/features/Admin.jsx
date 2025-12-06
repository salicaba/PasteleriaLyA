import React, { useState, useMemo } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, X, CloudUpload, Trash2, AlertTriangle } from 'lucide-react';
import { CardStat } from '../components/Shared';
import { formatearFechaLocal, PRODUCTOS_CAFETERIA_INIT, MESAS_FISICAS_INIT } from '../utils/config';

// --- IMPORTACIONES DE FIREBASE ---
import { db } from '../firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';

export const VistaInicioAdmin = ({ pedidos, ventasCafeteria }) => {
    const [cargando, setCargando] = useState(false);

    // --- FUNCIÓN PARA SUBIR DATOS INICIALES ---
    const subirDatosIniciales = async () => {
        if (!confirm("¿Subir productos y mesas iniciales a la base de datos?")) return;
        setCargando(true);
        try {
            const batch = writeBatch(db);
            // 1. Subir Productos
            if (PRODUCTOS_CAFETERIA_INIT.length > 0) {
                PRODUCTOS_CAFETERIA_INIT.forEach(prod => {
                    const ref = doc(collection(db, "productos")); 
                    batch.set(ref, prod);
                });
            }
            // 2. Subir Mesas
            if (MESAS_FISICAS_INIT.length > 0) {
                MESAS_FISICAS_INIT.forEach(mesa => {
                    const ref = doc(db, "mesas", mesa.id);
                    batch.set(ref, mesa);
                });
            }
            await batch.commit();
            alert("¡Éxito! Datos subidos.");
        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + error.message);
        }
        setCargando(false);
    };

    // --- FUNCIÓN PARA BORRAR TODO DE LA BD (RESET) ---
    const borrarBaseDatos = async () => {
        if (!confirm("⚠️ ¡PELIGRO! ⚠️\n\nEsto borrará TODOS los productos y mesas de la Base de Datos en la nube.\n¿Estás seguro?")) return;
        setCargando(true);
        try {
            const batch = writeBatch(db);
            
            // 1. Obtener y borrar productos
            const prodSnapshot = await getDocs(collection(db, "productos"));
            prodSnapshot.forEach((doc) => batch.delete(doc.ref));

            // 2. Obtener y borrar mesas
            const mesasSnapshot = await getDocs(collection(db, "mesas"));
            mesasSnapshot.forEach((doc) => batch.delete(doc.ref));

            await batch.commit();
            alert("✅ Base de datos limpiada correctamente.");
        } catch (error) {
            console.error("Error borrando:", error);
            alert("Error al borrar: " + error.message);
        }
        setCargando(false);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Panel General (Dueño)</h2>
                
                <div className="flex gap-2">
                    {/* Botón para subir (útil si llenas config.js después) */}
                    <button 
                        onClick={subirDatosIniciales}
                        disabled={cargando}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-300 transition"
                    >
                        {cargando ? "Procesando..." : <><CloudUpload size={16}/> Cargar Iniciales</>}
                    </button>

                    {/* BOTÓN PARA BORRAR TODO (RESET) */}
                    <button 
                        onClick={borrarBaseDatos}
                        disabled={cargando}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-200 transition border border-red-200"
                    >
                        <Trash2 size={16}/> Limpiar BD
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm">
                    <h3 className="text-xl font-bold text-pink-800 mb-2">Área Pastelería</h3>
                    <p className="text-gray-600 mb-4">{pedidos.filter(p => p.estado !== 'Cancelado').length} pedidos activos</p>
                    <p className="text-3xl font-bold text-pink-600">${pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.total, 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Área Cafetería</h3>
                    <p className="text-gray-600 mb-4">{ventasCafeteria.length} tickets registrados</p>
                    <p className="text-3xl font-bold text-orange-600">${ventasCafeteria.reduce((s, v) => s + v.total, 0)}</p>
                </div>
            </div>
        </div>
    );
};

export const VistaReporteUniversal = ({ pedidosPasteleria, ventasCafeteria, modo, onAbrirModalDia }) => {
    const [mesSeleccionado, setMesSeleccionado] = useState('2025-12');
    const [rangoInicio, setRangoInicio] = useState('');
    const [rangoFin, setRangoFin] = useState('');

    const todosLosDatosCompletos = useMemo(() => {
        let datos = [];
        if (modo === 'admin') datos = [...pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' })), ...ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }))];
        else if (modo === 'pasteleria') datos = pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' }));
        else datos = ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }));
        return datos.filter(p => p.estado !== 'Cancelado');
    }, [pedidosPasteleria, ventasCafeteria, modo]);

    const datosReporte = useMemo(() => {
        let datosFiltrados = todosLosDatosCompletos;
        let tituloPeriodo = "";
        const [anioStr, mesStr] = mesSeleccionado.split('-');
        const anio = parseInt(anioStr);
        const mes = parseInt(mesStr) - 1;

        if (rangoInicio && rangoFin) {
            datosFiltrados = datosFiltrados.filter(d => d.fecha >= rangoInicio && d.fecha <= rangoFin);
            tituloPeriodo = `Del ${formatearFechaLocal(rangoInicio)} al ${formatearFechaLocal(rangoFin)}`;
        } else {
            datosFiltrados = datosFiltrados.filter(d => d.fecha.startsWith(mesSeleccionado));
            const fechaObj = new Date(anio, mes, 1);
            tituloPeriodo = fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }

        let totalPasteleria = 0, totalCafeteria = 0;
        let desglose = [];
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();

        for (let i = 1; i <= diasEnMes; i++) {
            desglose.push({ label: `${i}`, valorP: 0, valorC: 0 });
        }

        datosFiltrados.forEach(p => {
            const [y, m, d] = p.fecha.split('-').map(Number);
            if (p.origen === 'Pastelería') totalPasteleria += p.total;
            else totalCafeteria += p.total;

            if (y === anio && m === (mes + 1)) {
                if (p.origen === 'Pastelería') desglose[d-1].valorP += p.total;
                else desglose[d-1].valorC += p.total;
            }
        });

        const maxValor = Math.max(...desglose.map(d => d.valorP + d.valorC), 1);

        return {
            totalPasteleria,
            totalCafeteria,
            totalGlobal: totalPasteleria + totalCafeteria,
            desglose,
            maxValor,
            anio,
            mes,
            tituloPeriodo
        };
    }, [todosLosDatosCompletos, mesSeleccionado, rangoInicio, rangoFin]);

    const limpiarRango = () => { setRangoInicio(''); setRangoFin(''); };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reporte Ventas</h2>
                <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200 items-start md:items-end w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Mes Principal</label>
                        <input type="month" value={mesSeleccionado} min="2025-12" onChange={(e) => { setMesSeleccionado(e.target.value); limpiarRango(); }} className="w-full md:w-auto border rounded-lg p-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition" />
                    </div>
                    <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
                    
                    {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
                    {/* Cambiamos 'flex' por 'grid' con 'grid-cols-1' (móvil) y 'sm:grid-cols-2' (tablet/PC) */}
                    <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-2 md:w-auto">
                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Desde</label>
                            <input type="date" value={rangoInicio} min="2025-12-01" onChange={(e) => setRangoInicio(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-gray-600" />
                        </div>
                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Hasta</label>
                            <input type="date" value={rangoFin} min="2025-12-01" onChange={(e) => setRangoFin(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-gray-600" />
                        </div>
                    </div>
                    {/* --------------------------- */}

                    {(rangoInicio || rangoFin) && (<button onClick={limpiarRango} className="text-xs text-red-500 font-bold hover:underline mb-3 md:mb-1 self-end flex items-center gap-1"><X size={12} /> Limpiar</button>)}
                </div>
            </div>
            
            {/* Tarjetas Resumen (Grid adaptable) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {modo !== 'cafeteria' && <CardStat titulo="Total Pastelería" valor={`$${datosReporte.totalPasteleria}`} color="bg-pink-100 text-pink-800" />}
                {modo !== 'pasteleria' && <CardStat titulo="Total Cafetería" valor={`$${datosReporte.totalCafeteria}`} color="bg-orange-100 text-orange-800" />}
                {modo === 'admin' && <CardStat titulo="Gran Total" valor={`$${datosReporte.totalGlobal}`} color="bg-green-100 text-green-800" />}
            </div>

            {/* Gráfica con Scroll Horizontal en Móvil */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 capitalize text-sm md:text-base"><BarChart3 size={20} /> {datosReporte.tituloPeriodo}</h3>
                </div>
                {/* Contenedor scrollable para la gráfica */}
                <div className="overflow-x-auto pb-2">
                    <div className="h-64 flex items-end justify-between gap-1 px-2 min-w-[600px] md:min-w-0">
                        {datosReporte.desglose.map((item, i) => {
                            const tieneDatos = item.valorP > 0 || item.valorC > 0;
                            return (
                                <div key={i} className={`flex flex-col items-center justify-end h-full flex-1 group relative ${tieneDatos ? 'cursor-pointer' : ''}`} onClick={() => { if (tieneDatos) { onAbrirModalDia(item.label, datosReporte.mes, datosReporte.anio, todosLosDatosCompletos); } }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg transition-opacity">Día {item.label}: ${item.valorP + item.valorC}</div>
                                    <div className={`w-full max-w-[30px] flex flex-col justify-end h-full rounded-t overflow-hidden ${tieneDatos ? 'bg-gray-50 hover:bg-gray-100' : 'bg-transparent'}`}>
                                        {(modo === 'admin' || modo === 'pasteleria') && <div className="bg-pink-500 w-full transition-all duration-500" style={{ height: `${(item.valorP / datosReporte.maxValor) * 100}%` }}></div>}
                                        {(modo === 'admin' || modo === 'cafeteria') && <div className="bg-orange-500 w-full transition-all duration-500" style={{ height: `${(item.valorC / datosReporte.maxValor) * 100}%` }}></div>}
                                    </div>
                                    <span className="mt-2 text-[10px] text-gray-400 font-medium">{item.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};