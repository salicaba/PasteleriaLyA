import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, X, Trash2, Users, Shield, Briefcase, UserPlus, Edit, Check, DollarSign,
Wallet, Coffee, Receipt, Eye, Calendar, Clock, Cake, Database, ServerCrash, AlertTriangle, 
Filter, PackagePlus, Plus, Info, ChevronDown, ChevronUp } from 'lucide-react';

import { CardStat, ModalConfirmacion } from '../components/Shared';
import { formatearFechaLocal, formatoMoneda, getFechaHoy } from '../utils/config';

// --- IMPORTACIÓN: RECHARTS ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- IMPORTACIONES DE FIREBASE ---
import { db } from '../firebase';
import { collection, writeBatch, getDocs } from 'firebase/firestore';

// --- IMPORTAMOS LOS ROLES DEFINIDOS ---
import { ROLES } from '../utils/roles';

import { saveInsumo, deleteInsumo, subscribeToInsumos, registrarCompraInsumo, guardarRecetaProducto, subscribeToProducts } from '../services/products.service';

// ... [El componente ModalDetalleCorte se mantiene IGUAL, no es necesario cambiarlo] ...
const ModalDetalleCorte = ({ isOpen, onClose, titulo, items, total, colorTheme, onItemClick, fecha }) => {
    if (!isOpen) return null;

    const theme = {
        bgHeader: colorTheme === 'orange' ? 'bg-orange-50' : 'bg-pink-50',
        textHeader: colorTheme === 'orange' ? 'text-orange-900' : 'text-pink-900',
        borderHeader: colorTheme === 'orange' ? 'border-orange-100' : 'border-pink-100',
        iconColor: colorTheme === 'orange' ? 'text-orange-600' : 'text-pink-600',
        badgeBg: colorTheme === 'orange' ? 'bg-orange-100' : 'bg-pink-100',
        badgeText: colorTheme === 'orange' ? 'text-orange-700' : 'text-pink-700',
        footerBg: colorTheme === 'orange' ? 'bg-orange-900' : 'bg-pink-900',
        borderTop: colorTheme === 'orange' ? 'border-orange-500' : 'border-pink-500'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[260] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col border-t-8 ${theme.borderTop}`}>
                <div className={`p-5 ${theme.bgHeader} flex justify-between items-center border-b ${theme.borderHeader}`}>
                    <div>
                        <h3 className={`font-bold text-xl ${theme.textHeader} flex items-center gap-2`}>
                            <Receipt size={20} className={theme.iconColor}/> {titulo}
                        </h3>
                        <p className="text-xs opacity-70 font-medium">Movimientos del {formatearFechaLocal(fecha)}.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition shadow-sm"><X size={18}/></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {items.length === 0 ? (
                        <div className="text-center py-12 opacity-40">
                            <DollarSign size={48} className="mx-auto mb-2 text-gray-400"/>
                            <p className="text-gray-500 text-sm">No hay ingresos registrados en esta fecha.</p>
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div 
                                key={index} 
                                onClick={() => onItemClick && onItemClick(item.original)} 
                                className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow group ${onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-gray-800 text-sm">{item.folio || item.id || 'S/N'}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} border-transparent uppercase`}>
                                            {item.etiqueta || 'VENTA'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors uppercase">{item.descripcion}</p>
                                    
                                    {item.hora && (
                                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock size={10}/> {item.hora}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-lg ${theme.iconColor}`}>+${formatoMoneda(item.monto)}</p>
                                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1"><Eye size={10}/> Ver</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className={`${theme.footerBg} p-5 text-white flex justify-between items-center`}>
                    <span className="font-bold text-white/80 text-sm uppercase tracking-wider">Total Recaudado</span>
                    <span className="font-bold text-2xl text-white">${formatoMoneda(total)}</span>
                </div>
            </div>
        </div>
    );
};

// --- VISTA INICIO ADMIN (CON CALENDARIO TRADICIONAL + LÍMITES INTELIGENTES) ---
export const VistaInicioAdmin = ({ pedidos, ventasCafeteria, onVerDetalles }) => {
    const [modalAbierto, setModalAbierto] = useState(null); 
    const [fechaCorte, setFechaCorte] = useState(getFechaHoy());

    // 1. Calculamos la FECHA MÍNIMA (La primera venta de la historia)
    // Para que el calendario no te deje ir años atrás innecesariamente.
    const fechaMinimaHistorial = useMemo(() => {
        const todasLasFechas = [
            ...pedidos.map(p => p.fecha),
            ...ventasCafeteria.map(v => v.fecha)
        ].filter(Boolean).sort();

        return todasLasFechas[0] || getFechaHoy();
    }, [pedidos, ventasCafeteria]);

    const datosPasteleria = useMemo(() => {
        const filtrados = pedidos.filter(p => p.fecha === fechaCorte && p.estado !== 'Cancelado');
        const items = filtrados.map(p => {
            const totalPedido = p.total || 0;
            const numPagos = parseInt(p.numPagos) || 1;
            const pagosRealizados = p.pagosRealizados || 0;
            const montoCobrado = (totalPedido / numPagos) * pagosRealizados;
            
            let etiqueta = 'ABONO';
            if (numPagos === 1) etiqueta = 'CONTADO';
            else if (pagosRealizados === numPagos) etiqueta = 'LIQUIDACIÓN';

            const horaMostrar = p.horaPago || null; 

            return {
                id: p.id,
                folio: p.folio,
                descripcion: p.cliente,
                monto: montoCobrado,
                etiqueta: etiqueta,
                original: p,
                hora: horaMostrar 
            };
        }).filter(item => item.monto > 0); 

        items.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));

        const total = items.reduce((acc, item) => acc + item.monto, 0);
        return { items, total };
    }, [pedidos, fechaCorte]);

    const datosCafeteria = useMemo(() => {
        const filtrados = ventasCafeteria.filter(v => v.fecha === fechaCorte);
        const items = filtrados.map(v => ({ 
            id: v.id, 
            folio: v.folioLocal, 
            descripcion: v.cliente, 
            monto: v.total || 0, 
            etiqueta: 'TICKET', 
            original: v, 
            hora: v.hora 
        }));

        items.sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));

        const total = items.reduce((acc, item) => acc + item.monto, 0);
        return { items, total };
    }, [ventasCafeteria, fechaCorte]);

    const esHoy = fechaCorte === getFechaHoy();

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Panel General de Control de Cajas</h2>
                    <p className="text-gray-500 text-sm mt-1">No pierdas ni un peso.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-end md:items-center">
                    
                    {/* --- OPCIÓN CALENDARIO TRADICIONAL (Con Límites) --- */}
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Calendar size={20} /></div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fecha de Corte</label>
                            <input 
                                type="date" 
                                value={fechaCorte} 
                                min={fechaMinimaHistorial}
                                max={getFechaHoy()}
                                onChange={(e) => setFechaCorte(e.target.value)} 
                                className="font-bold text-gray-700 text-sm bg-transparent outline-none cursor-pointer focus:text-blue-600 transition-colors" 
                            />
                        </div>
                        { !esHoy && (
                            <button onClick={() => setFechaCorte(getFechaHoy())} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition whitespace-nowrap">
                                IR A HOY
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* TARJETA PASTELERÍA (Sin etiqueta 'VER DETALLES') */}
                <div onClick={() => setModalAbierto('pasteleria')} className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-pink-800 flex items-center gap-2">Área Pastelería</h3><p className="text-pink-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1"><Eye size={12}/> Ver Corte {esHoy ? 'de Hoy' : `del ${formatearFechaLocal(fechaCorte)}`}</p></div><div className="bg-pink-100 p-2 rounded-lg text-pink-600 group-hover:scale-110 transition-transform"><Wallet size={24} /></div></div>
                    <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-bold text-pink-700">${formatoMoneda(datosPasteleria.total)}</span><span className="text-sm text-pink-400 font-medium">recaudado</span></div>
                    <div className="border-t border-pink-100 pt-3 mt-2 flex justify-between items-center text-sm"><span className="text-gray-500">Movimientos / Pagos:</span><span className="font-bold text-gray-700 bg-pink-50 px-2 py-0.5 rounded">{datosPasteleria.items.length}</span></div>
                </div>
                
                {/* TARJETA CAFETERÍA (Sin etiqueta 'VER DETALLES') */}
                <div onClick={() => setModalAbierto('cafeteria')} className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">Área Cafetería</h3><p className="text-orange-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1"><Eye size={12}/> Ver Corte {esHoy ? 'de Hoy' : `del ${formatearFechaLocal(fechaCorte)}`}</p></div><div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:scale-110 transition-transform"><Coffee size={24} /></div></div>
                    <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-bold text-orange-700">${formatoMoneda(datosCafeteria.total)}</span><span className="text-sm text-orange-400 font-medium">recaudado</span></div>
                    <div className="border-t border-orange-100 pt-3 mt-2 flex justify-between items-center text-sm"><span className="text-gray-500">Tickets cobrados:</span><span className="font-bold text-gray-700 bg-orange-50 px-2 py-0.5 rounded">{datosCafeteria.items.length}</span></div>
                </div>
            </div>

            <ModalDetalleCorte isOpen={modalAbierto === 'pasteleria'} onClose={() => setModalAbierto(null)} titulo={`Corte Pastelería`} items={datosPasteleria.items} total={datosPasteleria.total} colorTheme="pink" onItemClick={onVerDetalles} fecha={fechaCorte} />
            <ModalDetalleCorte isOpen={modalAbierto === 'cafeteria'} onClose={() => setModalAbierto(null)} titulo={`Corte Cafetería`} items={datosCafeteria.items} total={datosCafeteria.total} colorTheme="orange" onItemClick={onVerDetalles} fecha={fechaCorte} />
        </div>
    );
};

// --- VISTA REPORTE UNIVERSAL (CON RANGO POR DÍAS Y LÍMITES INTELIGENTES) ---
export const VistaReporteUniversal = ({ pedidosPasteleria, ventasCafeteria, onAbrirModalDia }) => {
    const [vistaActiva, setVistaActiva] = useState('todos');
    
    // Función para obtener mes actual
    const obtenerMesActual = () => {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    };

    const [mesSeleccionado, setMesSeleccionado] = useState(obtenerMesActual());
    
    // Volvemos a strings de fecha completa 'YYYY-MM-DD' para los rangos
    const [rangoInicio, setRangoInicio] = useState('');
    const [rangoFin, setRangoFin] = useState('');

    const todosLosDatosCompletos = useMemo(() => {
        const pastel = pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' }));
        const cafe = ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }));
        
        let datos = [];
        if (vistaActiva === 'pasteleria') datos = pastel;
        else if (vistaActiva === 'cafeteria') datos = cafe;
        else datos = [...pastel, ...cafe];
        
        return datos.filter(p => p.estado !== 'Cancelado');
    }, [pedidosPasteleria, ventasCafeteria, vistaActiva]);

    // --- CÁLCULO DE LÍMITES INTELIGENTES (MIN/MAX) ---
    // Esto evita que selecciones años anteriores a tu negocio o fechas futuras
    const limitesFechas = useMemo(() => {
        if (todosLosDatosCompletos.length === 0) {
            const hoy = getFechaHoy();
            return { min: hoy, max: hoy };
        }
        
        // Ordenamos todas las fechas de ventas que existen
        const fechasOrdenadas = todosLosDatosCompletos
            .map(d => d.fecha)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        return {
            min: fechasOrdenadas[0], // La fecha de la primerísima venta registrada
            max: getFechaHoy()       // El día de hoy
        };
    }, [todosLosDatosCompletos]);

    // Lista de meses para el selector PRINCIPAL (Este sí se queda por meses)
    const mesesDisponibles = useMemo(() => {
        const setMeses = new Set();
        setMeses.add(obtenerMesActual());

        todosLosDatosCompletos.forEach(d => {
            if (d.fecha && d.fecha.length >= 7) {
                setMeses.add(d.fecha.substring(0, 7));
            }
        });
        return Array.from(setMeses).sort().reverse();
    }, [todosLosDatosCompletos]);

    const formatearNombreMes = (mesStr) => {
        const [anio, mes] = mesStr.split('-');
        const fechaObj = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        return fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    const datosReporte = useMemo(() => {
        let datosFiltrados = todosLosDatosCompletos;
        let tituloPeriodo = "";
        
        const mesSeguro = mesSeleccionado || obtenerMesActual();
        const [anioBase, mesBase] = mesSeguro.split('-');
        let anio = parseInt(anioBase);
        let mes = parseInt(mesBase) - 1;

        if (rangoInicio && rangoFin) {
            // Lógica de rango exacto por DÍA
            datosFiltrados = datosFiltrados.filter(d => d.fecha >= rangoInicio && d.fecha <= rangoFin);
            tituloPeriodo = `Del ${formatearFechaLocal(rangoInicio)} al ${formatearFechaLocal(rangoFin)}`;
            
            // Para la gráfica, usamos el mes de inicio como referencia visual
            const [y, m] = rangoInicio.split('-').map(Number);
            anio = y;
            mes = m - 1;
        } else {
            // Lógica de mes completo
            datosFiltrados = datosFiltrados.filter(d => d.fecha.startsWith(mesSeguro));
            const fechaObj = new Date(anio, mes, 1);
            tituloPeriodo = fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }

        let totalPasteleria = 0, totalCafeteria = 0;
        let desglose = [];
        
        // Generamos los días para la gráfica (Si es rango, mostramos hasta 31 días genéricos)
        const diasGrafica = (rangoInicio && rangoFin) ? 31 : new Date(anio, mes + 1, 0).getDate();

        for (let i = 1; i <= diasGrafica; i++) {
            desglose.push({ label: `${i}`, valorP: 0, valorC: 0 });
        }

        datosFiltrados.forEach(p => {
            let montoReal = 0;
            if (p.origen === 'Pastelería') {
                const numPagos = parseInt(p.numPagos) || 1;
                const pagosHechos = p.pagosRealizados || 0;
                montoReal = (p.total / numPagos) * pagosHechos;
            } else {
                montoReal = p.total;
            }

            if (p.origen === 'Pastelería') totalPasteleria += montoReal;
            else totalCafeteria += montoReal;

            const [y, m, d] = p.fecha.split('-').map(Number);
            
            // Lógica visual para la gráfica:
            // Si es mes normal, asignamos al día exacto.
            // Si es rango, asignamos al día del mes correspondiente (si el rango cruza meses, se puede ver extraño en gráfica de 1-31, pero el total es correcto).
            if (desglose[d-1]) {
                 if (p.origen === 'Pastelería') desglose[d-1].valorP += montoReal;
                 else desglose[d-1].valorC += montoReal;
            }
        });

        return {
            totalPasteleria,
            totalCafeteria,
            totalGlobal: totalPasteleria + totalCafeteria,
            desglose,
            tituloPeriodo,
            anio, mes
        };
    }, [todosLosDatosCompletos, mesSeleccionado, rangoInicio, rangoFin, vistaActiva]);

    const limpiarRango = () => { setRangoInicio(''); setRangoFin(''); };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg pointer-events-none">
                    <p className="font-bold text-gray-700 mb-1">Día {label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                            {entry.name}: ${formatoMoneda(entry.value)}
                        </p>
                    ))}
                    <div className="border-t pt-1 mt-1">
                        <p className="font-bold text-gray-800 text-sm">Total: ${formatoMoneda(payload.reduce((acc, curr) => acc + curr.value, 0))}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const handleBarClick = (data) => {
        if (data && data.label && !rangoInicio) {
            onAbrirModalDia(data.label, datosReporte.mes, datosReporte.anio, todosLosDatosCompletos);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reporte Ventas</h2>
                
                <div className="flex flex-col xl:flex-row gap-4 w-full lg:w-auto items-stretch lg:items-center">
                    
                    <div className="bg-gray-100 p-1 rounded-xl grid grid-cols-3 gap-1 shadow-inner w-full xl:w-auto min-w-[300px]">
                        <button 
                            onClick={() => setVistaActiva('todos')}
                            className={`flex justify-center items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaActiva === 'todos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            Global
                        </button>
                        <button 
                            onClick={() => setVistaActiva('pasteleria')}
                            className={`flex justify-center items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaActiva === 'pasteleria' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-pink-400 hover:bg-gray-200/50'}`}
                        >
                            Pastelería
                        </button>
                        <button 
                            onClick={() => setVistaActiva('cafeteria')}
                            className={`flex justify-center items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaActiva === 'cafeteria' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-400 hover:bg-gray-200/50'}`}
                        >
                            Cafetería
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200 items-start md:items-end flex-1">
                        <div className="w-full md:w-auto">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Mes Principal</label>
                            <div className="relative">
                                <select 
                                    value={mesSeleccionado} 
                                    onChange={(e) => { setMesSeleccionado(e.target.value); limpiarRango(); }} 
                                    className="w-full md:w-auto border rounded-lg p-2 pr-8 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition uppercase appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
                                >
                                    {mesesDisponibles.map(mes => (
                                        <option key={mes} value={mes}>
                                            {formatearNombreMes(mes)}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                    <Calendar size={14} />
                                </div>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
                        
                        {/* --- AQUÍ ESTÁN LOS INPUTS DE FECHA EXACTA CON LÍMITES --- */}
                        <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-2 md:w-auto">
                            <div className="w-full">
                                <label className="text-xs font-bold text-gray-500 block mb-1">Desde</label>
                                <input 
                                    type="date" 
                                    value={rangoInicio} 
                                    min={limitesFechas.min} 
                                    max={limitesFechas.max}
                                    onChange={(e) => setRangoInicio(e.target.value)} 
                                    className="w-full border rounded-lg p-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div className="w-full">
                                <label className="text-xs font-bold text-gray-500 block mb-1">Hasta</label>
                                <input 
                                    type="date" 
                                    value={rangoFin} 
                                    min={limitesFechas.min} 
                                    max={limitesFechas.max}
                                    onChange={(e) => setRangoFin(e.target.value)} 
                                    className="w-full border rounded-lg p-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                        </div>

                        {(rangoInicio || rangoFin) && (<button onClick={limpiarRango} className="text-xs text-red-500 font-bold hover:underline mb-3 md:mb-1 self-end flex items-center gap-1"><X size={12} /> Limpiar</button>)}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 animate-fade-in">
                {(vistaActiva === 'todos' || vistaActiva === 'pasteleria') && (
                    <CardStat titulo="Total Pastelería" valor={`$${formatoMoneda(datosReporte.totalPasteleria)}`} color="bg-pink-100 text-pink-800" />
                )}
                {(vistaActiva === 'todos' || vistaActiva === 'cafeteria') && (
                    <CardStat titulo="Total Cafetería" valor={`$${formatoMoneda(datosReporte.totalCafeteria)}`} color="bg-orange-100 text-orange-800" />
                )}
                {vistaActiva === 'todos' && (
                    <CardStat titulo="Gran Total" valor={`$${formatoMoneda(datosReporte.totalGlobal)}`} color="bg-green-100 text-green-800" />
                )}
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 h-[500px] flex flex-col relative transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 capitalize text-sm md:text-base"><BarChart3 size={20} /> {datosReporte.tituloPeriodo}</h3>
                    <span className="text-xs font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">Vista: {vistaActiva}</span>
                </div>
                
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosReporte.desglose}
                            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/>
                            <XAxis 
                                dataKey="label" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            
                            {(vistaActiva === 'todos' || vistaActiva === 'pasteleria') && (
                                <Bar 
                                    dataKey="valorP" 
                                    name="Pastelería" 
                                    stackId="a" 
                                    fill="#ec4899" 
                                    radius={vistaActiva === 'pasteleria' ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                                    maxBarSize={50}
                                    onClick={handleBarClick}
                                    cursor="pointer"
                                />
                            )}
                            {(vistaActiva === 'todos' || vistaActiva === 'cafeteria') && (
                                <Bar 
                                    dataKey="valorC" 
                                    name="Cafetería" 
                                    stackId="a" 
                                    fill="#f97316" 
                                    radius={[4, 4, 0, 0]} 
                                    maxBarSize={50}
                                    onClick={handleBarClick}
                                    cursor="pointer"
                                />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ... [ModalUsuario, VistaGestionUsuarios y VistaBaseDatos se mantienen IGUALES] ...
// (Asegúrate de copiar el resto del archivo Admin.jsx tal cual estaba, solo reemplazando VistaReporteUniversal)
const ModalUsuario = ({ isOpen, onClose, onGuardar, usuarioAEditar }) => {
    const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: ROLES.GENERAL });

    useEffect(() => { 
        if (usuarioAEditar) { setForm(usuarioAEditar); } 
        else { setForm({ nombre: '', usuario: '', password: '', rol: ROLES.GENERAL }); } 
    }, [usuarioAEditar, isOpen]);

    const generarCredenciales = () => { 
        if (!form.nombre.trim()) return; 
        const limpiarTexto = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, ""); 
        const partes = form.nombre.trim().split(/\s+/); 
        const nombre1 = partes[0] ? limpiarTexto(partes[0]) : ""; 
        const apellido = partes.length > 1 ? limpiarTexto(partes[1]) : ""; 
        if (!form.usuario) { 
            let usuarioBase = nombre1; 
            if (apellido) usuarioBase += `.${apellido}`; 
            const usuarioSugerido = `${usuarioBase.toLowerCase()}@lya.com`; 
            setForm(prev => ({ ...prev, usuario: usuarioSugerido })); 
        } 
        if (!form.password) { 
            const random = Math.floor(1000 + Math.random() * 9000); 
            const passSugerida = `LyA.${random}`; 
            setForm(prev => ({ ...prev, password: passSugerida })); 
        } 
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        let usuarioFinal = form.usuario.trim(); 
        if (!usuarioFinal.endsWith('@lya.com')) { 
            if (!usuarioFinal.includes('@')) { usuarioFinal += '@lya.com'; } 
        } 
        onGuardar({ ...form, usuario: usuarioFinal }); 
        onClose(); 
    };

    const BotonRol = ({ rolValue, label, colorBorder, icon: Icon }) => (
        <button 
            type="button" 
            onClick={() => setForm({...form, rol: rolValue})} 
            className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all flex-1 
            ${form.rol === rolValue ? `bg-gray-50 ${colorBorder} text-gray-800` : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
        >
            <Icon size={18}/> <span className="text-center">{label}</span>
        </button>
    );

    return ( 
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[250] flex items-center justify-center p-4 backdrop-blur-sm"> 
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border-t-8 border-gray-900"> 
                <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100"> 
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"> 
                        {usuarioAEditar ? <Edit size={20} className="text-pink-600"/> : <UserPlus size={20} className="text-pink-600"/>} 
                        {usuarioAEditar ? 'Editar Usuario' : 'Nuevo Usuario'} 
                    </h3> 
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20}/></button> 
                </div> 
                <form onSubmit={handleSubmit} className="p-6 space-y-5"> 
                    <div> 
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre y Primer Apellido</label> 
                        <input required className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors uppercase font-bold text-gray-700" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})} onBlur={generarCredenciales} placeholder="EJ. JUAN PÉREZ" /> 
                    </div> 
                    <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100"> 
                        <div> 
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Usuario</label> 
                            <input required className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm font-mono text-gray-600 focus:border-pink-500 focus:outline-none" value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} placeholder="juan.perez@lya.com" /> 
                        </div> 
                        <div> 
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contraseña</label> 
                            <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm font-mono text-gray-600 focus:border-pink-500 focus:outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Generada..." /> 
                        </div> 
                    </div> 
                    
                    <div> 
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Asignar Rol</label> 
                        <div className="grid grid-cols-2 gap-2"> 
                            <BotonRol rolValue={ROLES.ADMIN} label="ADMIN" colorBorder="border-pink-500" icon={Shield} />
                            <BotonRol rolValue={ROLES.GENERAL} label="GENERAL" colorBorder="border-purple-500" icon={Briefcase} />
                            <BotonRol rolValue={ROLES.PASTELERIA} label="PASTELERÍA" colorBorder="border-pink-400" icon={Cake} />
                            <BotonRol rolValue={ROLES.CAFETERIA} label="CAFETERÍA" colorBorder="border-orange-500" icon={Coffee} />
                        </div> 
                    </div> 

                    <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex justify-center items-center gap-2"> 
                        <Check size={20}/> {usuarioAEditar ? 'Guardar Cambios' : 'Crear Usuario'} 
                    </button> 
                </form> 
            </div> 
        </div> 
    );
};

export const VistaGestionUsuarios = ({ usuarios, onGuardar, onEliminar }) => {
    const [modalOpen, setModalOpen] = useState(false); 
    const [usuarioEditar, setUsuarioEditar] = useState(null); 
    const [usuarioEliminar, setUsuarioEliminar] = useState(null); 
    
    const administradores = usuarios.filter(u => u.rol === ROLES.ADMIN);
    const generales = usuarios.filter(u => u.rol === ROLES.GENERAL);
    const pasteleros = usuarios.filter(u => u.rol === ROLES.PASTELERIA);
    const cafeteros = usuarios.filter(u => u.rol === ROLES.CAFETERIA);

    const GrupoCard = ({ titulo, lista, colorBg, colorBorder, colorText, icon: Icon, colorIcon, iconBg }) => {
        const borderColor = colorText.replace('text-', 'border-').replace('800', '500');

        return (
            <div className={`${colorBg} rounded-3xl p-6 border ${colorBorder} h-full flex flex-col`}>
                <h3 className={`font-bold text-xl ${colorText} mb-4 flex items-center gap-2`}>
                    <Icon size={24}/> {titulo} 
                    <span className={`text-xs px-2 py-1 rounded-full bg-white/50 border border-white/50 ${colorText}`}>{lista.length}</span>
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                    {lista.map(user => (
                        <div 
                            key={user.id} 
                            className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} flex justify-between items-center group hover:shadow-md transition relative overflow-hidden`}
                        >
                            <div className="flex items-center gap-3 pl-2 overflow-hidden">
                                <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center ${colorIcon} font-bold text-sm border border-opacity-20 shadow-sm shrink-0`}>
                                    {user.nombre.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 text-sm truncate">{user.nombre}</p>
                                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-1 rounded w-fit truncate">{user.usuario}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setUsuarioEditar(user); setModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition"><Edit size={16}/></button>
                                <button onClick={() => setUsuarioEliminar(user)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {lista.length === 0 && (
                        <div className="text-center py-8 opacity-40">
                            <Icon size={32} className="mx-auto mb-2 text-gray-400"/>
                            <p className="text-gray-500 italic text-xs">Sin usuarios.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return ( 
        <div className="p-4 md:p-8 h-full overflow-y-auto"> 
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"> 
                <div> 
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"> <Users className="text-pink-600" /> Gestión de Usuarios </h2> 
                    <p className="text-gray-500 text-sm mt-1">Administra quién tiene acceso al sistema.</p> 
                </div> 
                <button onClick={() => { setUsuarioEditar(null); setModalOpen(true); }} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition transform active:scale-95 w-full sm:w-auto justify-center"> <UserPlus size={20}/> Nuevo Usuario </button> 
            </div> 
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto pb-4">
                <GrupoCard 
                    titulo="Administradores" 
                    lista={administradores} 
                    colorBg="bg-gray-200" 
                    colorBorder="border-gray-400" 
                    colorText="text-gray-800" 
                    icon={Shield} 
                    colorIcon="text-gray-900" 
                    iconBg="bg-gray-300"
                />
                <GrupoCard 
                    titulo="Empleados Generales" 
                    lista={generales} 
                    colorBg="bg-purple-200" 
                    colorBorder="border-purple-400" 
                    colorText="text-purple-800" 
                    icon={Briefcase} 
                    colorIcon="text-purple-600" 
                    iconBg="bg-purple-100"
                />
                <GrupoCard 
                    titulo="Empleado Pastelería" 
                    lista={pasteleros} 
                    colorBg="bg-rose-200" 
                    colorBorder="border-rose-400" 
                    colorText="text-rose-800" 
                    icon={Cake} 
                    colorIcon="text-rose-600" 
                    iconBg="bg-rose-100"
                />
                <GrupoCard 
                    titulo="Empleado Cafetería" 
                    lista={cafeteros} 
                    colorBg="bg-orange-200" 
                    colorBorder="border-orange-400" 
                    colorText="text-orange-800" 
                    icon={Coffee} 
                    colorIcon="text-orange-600" 
                    iconBg="bg-orange-100"
                />
            </div> 
            
            <ModalUsuario isOpen={modalOpen} onClose={() => setModalOpen(false)} onGuardar={onGuardar} usuarioAEditar={usuarioEditar} /> 
            <ModalConfirmacion isOpen={!!usuarioEliminar} onClose={() => setUsuarioEliminar(null)} onConfirm={() => { onEliminar(usuarioEliminar.id); setUsuarioEliminar(null); }} titulo="¿Eliminar Usuario?" mensaje={`Se eliminará permanentemente la cuenta de "${usuarioEliminar?.nombre}".`} /> 
        </div> 
    );
};

export const VistaBaseDatos = () => {
    const [confirmarLimpieza, setConfirmarLimpieza] = useState(false);
    
    const [mesesDisponibles, setMesesDisponibles] = useState([]); 
    const [mesesSeleccionados, setMesesSeleccionados] = useState([]); 
    const [confirmarBorradoMeses, setConfirmarBorradoMeses] = useState(false);
    
    const [cargando, setCargando] = useState(false);
    const [cargandoExportar, setCargandoExportar] = useState(false);
    const [cargandoFechas, setCargandoFechas] = useState(true);

    useEffect(() => {
        const obtenerMesesConDatos = async () => {
            setCargandoFechas(true);
            try {
                const ventasSnap = await getDocs(collection(db, "ventas"));
                const fechasVentas = ventasSnap.docs.map(d => d.data().fecha).filter(Boolean);

                const pedidosSnap = await getDocs(collection(db, "pedidos"));
                const fechasPedidos = pedidosSnap.docs.map(d => d.data().fecha).filter(Boolean);

                const todasLasFechas = [...fechasVentas, ...fechasPedidos];
                const setMeses = new Set();

                todasLasFechas.forEach(fechaStr => {
                    if (fechaStr.length >= 7) {
                        const mesAnio = fechaStr.substring(0, 7); 
                        setMeses.add(mesAnio);
                    }
                });

                const mesesOrdenados = Array.from(setMeses).sort().reverse();
                setMesesDisponibles(mesesOrdenados);

            } catch (error) {
                console.error("Error cargando fechas disponibles:", error);
            }
            setCargandoFechas(false);
        };

        obtenerMesesConDatos();
    }, []);

    const nombreMes = (fechaMes) => {
        if (!fechaMes) return "";
        const [anio, mes] = fechaMes.split('-');
        const date = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    const toggleMes = (mes) => {
        if (mesesSeleccionados.includes(mes)) {
            setMesesSeleccionados(prev => prev.filter(m => m !== mes));
        } else {
            setMesesSeleccionados(prev => [...prev, mes]);
        }
    };

    const seleccionarTodos = () => setMesesSeleccionados([...mesesDisponibles]);
    const deseleccionarTodos = () => setMesesSeleccionados([]);

    const handleExportarSeleccion = async () => {
        if (mesesSeleccionados.length === 0) return alert("Selecciona al menos un mes.");
        setCargandoExportar(true);

        try {
            const ventasRef = collection(db, "ventas");
            const snapshotVentas = await getDocs(ventasRef);
            
            const pedidosRef = collection(db, "pedidos");
            const snapshotPedidos = await getDocs(pedidosRef);

            const ventasFiltradas = snapshotVentas.docs
                .map(d => d.data())
                .filter(d => d.fecha && mesesSeleccionados.some(m => d.fecha.startsWith(m)));

            const pedidosFiltrados = snapshotPedidos.docs
                .map(d => d.data())
                .filter(d => d.fecha && mesesSeleccionados.some(m => d.fecha.startsWith(m)));

            if (ventasFiltradas.length === 0 && pedidosFiltrados.length === 0) {
                alert("No se encontraron datos en los meses seleccionados.");
                setCargandoExportar(false);
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "TIPO,FECHA,FOLIO,CLIENTE,TOTAL,ESTADO,DETALLES\n";

            ventasFiltradas.forEach(v => {
                const fila = `CAFETERIA,${v.fecha},"${v.folioLocal || ''}","${v.cliente || 'Publico'}",${v.total},PAGADO,"${v.descripcion || ''}"`;
                csvContent += fila + "\n";
            });

            pedidosFiltrados.forEach(p => {
                const fila = `PASTELERIA,${p.fecha},"${p.folio || ''}","${p.cliente || ''}",${p.total},"${p.estado}","${p.descripcion || ''}"`;
                csvContent += fila + "\n";
            });

            const nombreArchivo = mesesSeleccionados.length === 1 
                ? `Respaldo_LyA_${mesesSeleccionados[0]}.csv`
                : `Respaldo_LyA_Multiples_Periodos.csv`;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", nombreArchivo);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Error exportando:", error);
            alert("Error al generar reporte.");
        }
        setCargandoExportar(false);
    };

    const handleEliminarSeleccion = async () => {
        setConfirmarBorradoMeses(false);
        setCargando(true);
        try {
            const batchSize = 400;
            let totalEliminados = 0;

            const borrarLote = async (nombreColeccion) => {
                const colRef = collection(db, nombreColeccion);
                const snapshot = await getDocs(colRef);
                
                const docsABorrar = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    return data.fecha && mesesSeleccionados.some(mes => data.fecha.startsWith(mes));
                });

                if (docsABorrar.length === 0) return 0;

                for (let i = 0; i < docsABorrar.length; i += batchSize) {
                    const batch = writeBatch(db);
                    const chunk = docsABorrar.slice(i, i + batchSize);
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
                return docsABorrar.length;
            };

            const eliminadosVentas = await borrarLote("ventas");
            const eliminadosPedidos = await borrarLote("pedidos");
            totalEliminados = eliminadosVentas + eliminadosPedidos;

            if (totalEliminados > 0) {
                alert(`✅ Se eliminaron ${totalEliminados} registros de los meses seleccionados.`);
                setMesesDisponibles(prev => prev.filter(m => !mesesSeleccionados.includes(m)));
                setMesesSeleccionados([]); 
            } else {
                alert("⚠️ No se encontraron registros para eliminar en esos periodos.");
            }

        } catch (error) {
            console.error("Error borrando:", error);
            alert("Error: " + error.message);
        }
        setCargando(false);
    };

    const ejecutarBorradoBD = async () => {
        setConfirmarLimpieza(false);
        setCargando(true);
        try {
            const borrarColeccionCompleta = async (nombreColeccion) => {
                const q = collection(db, nombreColeccion);
                const snapshot = await getDocs(q);
                const chunk = 400;
                for (let i = 0; i < snapshot.docs.length; i += chunk) {
                    const batch = writeBatch(db);
                    const lote = snapshot.docs.slice(i, i + chunk);
                    lote.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            };

            await borrarColeccionCompleta("productos");
            await borrarColeccionCompleta("mesas");
            await borrarColeccionCompleta("pedidos");
            await borrarColeccionCompleta("ventas");
            
            alert("✅ Sistema reiniciado correctamente.");
            setMesesDisponibles([]);
            setMesesSeleccionados([]);
        } catch (error) { 
            console.error("Error borrando todo:", error); 
            alert("Error: " + error.message); 
        }
        setCargando(false);
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-blue-600" /> Administración de Datos
                </h2>
                <p className="text-gray-500 text-sm mt-1">Gestión de historial, respaldos y limpieza del sistema.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    
                    <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Calendar size={18}/> Periodos Disponibles</h3>
                            <div className="text-[10px] space-x-2">
                                <button onClick={seleccionarTodos} className="text-blue-600 font-bold hover:underline">Todos</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={deseleccionarTodos} className="text-gray-400 font-bold hover:underline">Ninguno</button>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl flex-1 max-h-[250px] overflow-y-auto bg-gray-50 p-2 custom-scrollbar">
                            {cargandoFechas ? (
                                <div className="text-center py-8 text-gray-400 text-xs italic">Escaneando base de datos...</div>
                            ) : mesesDisponibles.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-xs italic">No hay historial antiguo disponible.</div>
                            ) : (
                                <div className="space-y-1">
                                    {mesesDisponibles.map(mes => (
                                        <label key={mes} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mesesSeleccionados.includes(mes) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-100'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                checked={mesesSeleccionados.includes(mes)}
                                                onChange={() => toggleMes(mes)}
                                            />
                                            <span className={`text-sm font-bold ${mesesSeleccionados.includes(mes) ? 'text-blue-800' : 'text-gray-600'}`}>
                                                {nombreMes(mes)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">{mesesSeleccionados.length} periodo(s) seleccionado(s)</p>
                    </div>

                    <div className="w-full md:w-1/2 lg:w-2/3 flex flex-col gap-4 justify-center">
                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-blue-900 flex items-center gap-2"><Receipt size={18}/> Exportar Historial</h4>
                                <p className="text-xs text-blue-700/70 mt-1">Genera un archivo Excel/CSV con todas las ventas y pedidos de los meses seleccionados.</p>
                            </div>
                            <button 
                                onClick={handleExportarSeleccion}
                                disabled={cargandoExportar || mesesSeleccionados.length === 0}
                                className={`px-4 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition whitespace-nowrap ${mesesSeleccionados.length === 0 ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                            >
                                {cargandoExportar ? 'Generando...' : 'Descargar Reporte'}
                            </button>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-orange-900 flex items-center gap-2"><Trash2 size={18}/> Depurar Historial</h4>
                                <p className="text-xs text-orange-700/70 mt-1">Elimina permanentemente del sistema la información de los meses seleccionados.</p>
                            </div>
                            <button 
                                onClick={() => setConfirmarBorradoMeses(true)}
                                disabled={cargando || mesesSeleccionados.length === 0}
                                className={`px-4 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition whitespace-nowrap ${mesesSeleccionados.length === 0 ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'}`}
                            >
                                {cargando ? 'Procesando...' : 'Eliminar Selección'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-xl text-red-600 shadow-sm border border-red-100 hidden sm:block">
                            <ServerCrash size={28}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">Restablecimiento de Fábrica</h3>
                            <p className="text-sm text-red-800/70 mt-1 max-w-xl">
                                Esta acción eliminará <strong>ABSOLUTAMENTE TODO</strong> (Productos, Mesas, Usuarios, Ventas y Pedidos). Úsala solo si deseas reiniciar el sistema desde cero.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setConfirmarLimpieza(true)} 
                        disabled={cargando}
                        className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition shadow-sm w-full md:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <AlertTriangle size={18}/> Borrar Todo el Sistema
                    </button>
                </div>
            </div>

            <ModalConfirmacion 
                isOpen={confirmarBorradoMeses} 
                onClose={() => setConfirmarBorradoMeses(false)} 
                onConfirm={handleEliminarSeleccion} 
                titulo={`¿Eliminar ${mesesSeleccionados.length} Periodos?`} 
                mensaje={`Se borrarán permanentemente las Ventas y Pedidos de: ${mesesSeleccionados.map(m => nombreMes(m)).join(', ')}. ¿Estás seguro?`}
                tipo="eliminar" 
            />

            <ModalConfirmacion 
                isOpen={confirmarLimpieza} 
                onClose={() => setConfirmarLimpieza(false)} 
                onConfirm={ejecutarBorradoBD} 
                titulo="⚠️ DESTRUCCIÓN TOTAL ⚠️" 
                mensaje="Estás a punto de borrar TODO el sistema. No habrá vuelta atrás. ¿Confirmas esta acción destructiva?"
                tipo="eliminar" 
            />
        </div>
    );
};

// --- COMPONENTE: VISTA ALMACÉN Y COSTOS (OPTIMIZADO Y COLAPSABLE) ---
export const VistaAlmacen = ({ mostrarNotificacion }) => {
    const [pestaña, setPestaña] = useState('insumos'); 
    const [insumos, setInsumos] = useState([]);
    const [productos, setProductos] = useState([]);
    
    // Estados para Modales
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalCompra, setModalCompra] = useState(false);
    
    // Objetos en edición / eliminación
    const [insumoEdit, setInsumoEdit] = useState(null);
    const [insumoAEliminar, setInsumoAEliminar] = useState(null); 
    const [productoReceta, setProductoReceta] = useState(null);

    useEffect(() => {
        const unsubInsumos = subscribeToInsumos(setInsumos);
        const unsubProductos = subscribeToProducts(setProductos);
        return () => { unsubInsumos(); unsubProductos(); };
    }, []);

    // --- COMPONENTE INTERNO: TARJETA DE INFORMACIÓN COLAPSABLE ---
    const InfoCardCollapsible = ({ color, icon: Icon, title, description, children }) => {
        const [expandido, setExpandido] = useState(false);
        
        // Mapeo de colores para clases dinámicas
        const themes = {
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-500', hover: 'hover:bg-indigo-100' },
            pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-800', icon: 'text-pink-500', hover: 'hover:bg-pink-100' },
            green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', icon: 'text-green-600', hover: 'hover:bg-green-100' }
        };
        const t = themes[color] || themes.indigo;

        return (
            <div 
                className={`${t.bg} border ${t.border} rounded-xl overflow-hidden transition-all duration-300 mb-4 cursor-pointer group ${t.hover}`}
                onClick={() => setExpandido(!expandido)}
            >
                <div className="p-4 flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-center">
                        <Icon className={`${t.icon} shrink-0`} size={20}/>
                        <div>
                            <p className={`font-bold text-sm ${t.text}`}>{title}</p>
                            {/* Descripción corta siempre visible */}
                            <p className={`text-xs ${t.text} opacity-80 leading-tight`}>{description}</p>
                        </div>
                    </div>
                    <button className={`${t.text} opacity-50 group-hover:opacity-100 transition-opacity`}>
                        {expandido ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                </div>
                
                {/* Contenido oculto/desplegable */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandido ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`px-4 pb-4 pt-0 text-xs ${t.text} border-t ${t.border} mt-2 pt-3 mx-4`}>
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    // --- ACCIONES DE BASE DE DATOS ---
    const handleGuardarInsumo = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            id: insumoEdit?.id,
            nombre: formData.get('nombre').toUpperCase(),
            unidad: formData.get('unidad'),
            stock: parseFloat(formData.get('stock')) || 0,
            costoPromedio: parseFloat(formData.get('costo')) || 0,
            minimo: parseFloat(formData.get('minimo')) || 5
        };

        try {
            await saveInsumo(data);
            setModalInsumo(false);
            if (insumoEdit) mostrarNotificacion(`Insumo "${data.nombre}" actualizado`, "exito");
            else mostrarNotificacion(`Materia prima "${data.nombre}" creada`, "exito");
        } catch (error) {
            mostrarNotificacion("Error al guardar insumo", "error");
        }
    };

    const handleEliminarInsumo = async () => {
        if (!insumoAEliminar) return;
        try {
            await deleteInsumo(insumoAEliminar.id);
            mostrarNotificacion(`Se eliminó "${insumoAEliminar.nombre}" del almacén`, "info");
            setInsumoAEliminar(null);
        } catch (error) {
            mostrarNotificacion("No se pudo eliminar", "error");
        }
    };

    const handleRegistrarCompra = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const cant = parseFloat(formData.get('cantidad'));
        const total = parseFloat(formData.get('total'));
        
        if (insumoEdit) {
            try {
                await registrarCompraInsumo(insumoEdit.id, cant, total, insumoEdit);
                setModalCompra(false);
                mostrarNotificacion(`Compra registrada para ${insumoEdit.nombre}`, "exito");
            } catch (error) {
                mostrarNotificacion("Error al registrar compra", "error");
            }
        }
    };

    // --- COMPONENTE INTERNO: CALCULADORA DE RECETA ---
    const EditorReceta = ({ producto, onClose }) => {
        const [ingredientes, setIngredientes] = useState(producto.receta || []);
        const [insumoSeleccionado, setInsumoSeleccionado] = useState('');
        const [cantidadUsar, setCantidadUsar] = useState('');

        const agregarIngrediente = () => {
            if (!insumoSeleccionado || !cantidadUsar) return;
            const insumoReal = insumos.find(i => i.id === insumoSeleccionado);
            if (!insumoReal) return;

            const nuevoIngrediente = {
                insumoId: insumoReal.id,
                nombre: insumoReal.nombre,
                unidad: insumoReal.unidad,
                cantidad: parseFloat(cantidadUsar),
                costoUnitarioSnapshot: insumoReal.costoPromedio 
            };

            setIngredientes([...ingredientes, nuevoIngrediente]);
            setInsumoSeleccionado('');
            setCantidadUsar('');
        };

        const removerIngrediente = (index) => {
            const nuevos = [...ingredientes];
            nuevos.splice(index, 1);
            setIngredientes(nuevos);
        };

        const calcularCostoTotal = () => {
            return ingredientes.reduce((total, ing) => {
                const insumoActual = insumos.find(i => i.id === ing.insumoId);
                const costoReal = insumoActual ? insumoActual.costoPromedio : (ing.costoUnitarioSnapshot || 0);
                return total + (costoReal * ing.cantidad);
            }, 0);
        };

        const costoTotal = calcularCostoTotal();
        const precioVenta = parseFloat(producto.precio) || 0;
        const margen = precioVenta - costoTotal;
        const margenPorcentaje = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;

        const guardarEscandallo = async () => {
            try {
                await guardarRecetaProducto(producto.id, ingredientes, costoTotal);
                mostrarNotificacion(`Receta de "${producto.nombre}" guardada correctamente`, "exito");
                onClose();
            } catch (error) {
                mostrarNotificacion("Error al guardar receta", "error");
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Cake size={20}/> Receta: {producto.nombre}</h3>
                        <button onClick={onClose}><X/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Agregar Insumo</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select 
                                    value={insumoSeleccionado} 
                                    onChange={e => setInsumoSeleccionado(e.target.value)}
                                    className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition"
                                >
                                    <option value="">-- Seleccionar Materia Prima --</option>
                                    {insumos.map(i => (
                                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidad}) - ${formatoMoneda(i.costoPromedio)}</option>
                                    ))}
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="Cant." 
                                    className="w-24 p-2 border rounded-lg text-sm"
                                    value={cantidadUsar}
                                    onChange={e => setCantidadUsar(e.target.value)}
                                />
                                <button onClick={agregarIngrediente} className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-pink-700 transition">
                                    <Plus size={16}/>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {ingredientes.map((ing, idx) => {
                                const insumoActual = insumos.find(i => i.id === ing.insumoId);
                                const costoU = insumoActual ? insumoActual.costoPromedio : 0;
                                const subtotal = costoU * ing.cantidad;
                                return (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                        <div>
                                            <p className="font-bold text-gray-700 text-sm">{ing.nombre}</p>
                                            <p className="text-xs text-gray-400">{ing.cantidad} {ing.unidad} x ${formatoMoneda(costoU)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-gray-600">${formatoMoneda(subtotal)}</span>
                                            <button onClick={() => removerIngrediente(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                            {ingredientes.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Este producto no tiene receta definida.</p>}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200 shadow-lg z-10">
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Costo Producción</p>
                                <p className="text-xl font-bold text-gray-800">${formatoMoneda(costoTotal)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-[10px] uppercase text-gray-400 font-bold">Precio Venta</p>
                                <p className="text-xl font-bold text-blue-600">${formatoMoneda(precioVenta)}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${margenPorcentaje < 30 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                <p className="text-[10px] uppercase opacity-70 font-bold">Margen / Ganancia</p>
                                <p className="text-xl font-bold">{margenPorcentaje.toFixed(0)}% <span className="text-sm">(${formatoMoneda(margen)})</span></p>
                            </div>
                        </div>
                        <button 
                            onClick={guardarEscandallo}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            <Check size={18}/> Guardar Escandallo
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Database className="text-indigo-600" /> Almacén y Costos
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Controla materia prima, recetas y analiza tu rentabilidad.</p>
                </div>
                {pestaña === 'insumos' && (
                    <button onClick={() => { setInsumoEdit(null); setModalInsumo(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center gap-2">
                        <PackagePlus size={18}/> Nuevo Insumo
                    </button>
                )}
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-fit mb-6">
                <button onClick={() => setPestaña('insumos')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition ${pestaña === 'insumos' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                    Materia Prima
                </button>
                <button onClick={() => setPestaña('recetas')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition ${pestaña === 'recetas' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                    Recetario & Costos
                </button>
                <button onClick={() => setPestaña('analisis')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition ${pestaña === 'analisis' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                    Rentabilidad
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                
                {/* --- VISTA 1: INSUMOS --- */}
                {pestaña === 'insumos' && (
                    <div className="space-y-4">
                        <InfoCardCollapsible 
                            color="indigo" 
                            icon={Info} 
                            title="¿Qué es la Materia Prima?" 
                            description="Toca aquí para ver cómo registrar tus ingredientes base."
                        >
                            Aquí registras los ingredientes base que compras para fabricar tus productos. Define en qué unidad los mides (Kilos, Litros, Piezas) y lleva el control de tu stock.
                            <div className="bg-white/50 p-2 rounded-lg text-xs border border-indigo-200 mt-2">
                                <strong>💡 Ejemplo:</strong><br/>
                                Si compras costales de harina, crea el insumo <strong>"HARINA TRIGO"</strong> con unidad <strong>KG</strong>.<br/>
                                Si compras cajas de leche, crea <strong>"LECHE ENTERA"</strong> con unidad <strong>LT</strong>.<br/>
                                Cuando registres una compra con el botón <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-1 rounded font-bold"><Wallet size={10}/></span>, el sistema promediará automáticamente el costo nuevo con el viejo.
                            </div>
                        </InfoCardCollapsible>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insumos.map(insumo => (
                                <div key={insumo.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl opacity-10 rounded-bl-full transition-colors ${insumo.stock <= insumo.minimo ? 'from-red-500' : 'from-indigo-500'}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h3 className="font-bold text-gray-800 text-lg">{insumo.nombre}</h3>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setInsumoEdit(insumo); setModalCompra(true); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Registrar Compra"><Wallet size={16}/></button>
                                            <button onClick={() => { setInsumoEdit(insumo); setModalInsumo(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Editar"><Edit size={16}/></button>
                                            <button onClick={() => setInsumoAEliminar(insumo)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Eliminar"><Trash2 size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-1 mb-4">
                                        <span className={`text-3xl font-bold ${insumo.stock <= insumo.minimo ? 'text-red-500' : 'text-gray-700'}`}>{insumo.stock}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1.5">{insumo.unidad}</span>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-sm border border-gray-100">
                                        <span className="text-gray-500">Costo Promedio:</span>
                                        <span className="font-bold text-indigo-600">${(insumo.costoPromedio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{insumo.unidad}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-sm border border-gray-100">
                                        <span className="text-gray-500">Valor Total:</span>
                                        <span className="font-bold text-indigo-600">${((insumo.stock || 0) * (insumo.costoPromedio || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            ))}
                            {insumos.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 italic">No hay materia prima registrada.</div>}
                        </div>
                    </div>
                )}

                {/* --- VISTA 2: RECETARIO --- */}
                {pestaña === 'recetas' && (
                    <div className="space-y-4">
                        <InfoCardCollapsible 
                            color="pink" 
                            icon={Info} 
                            title="¿Cómo funcionan las Recetas (Escandallo)?" 
                            description="Toca aquí para ver cómo calcular tus costos de producción."
                        >
                            El "Escandallo" es el desglose exacto de qué ingredientes lleva cada producto. Esto permite calcular <strong>cuánto te cuesta realmente</strong> producir una unidad basándose en el precio actual de tus insumos.
                            <div className="bg-white/50 p-2 rounded-lg text-xs border border-pink-200 mt-2">
                                <strong>💡 Ejemplo:</strong><br/>
                                Para un <strong>"PASTEL DE CHOCOLATE"</strong>, podrías agregar:<br/>
                                - 0.5 KG de Harina<br/>
                                - 0.2 KG de Cocoa<br/>
                                - 4 PZA de Huevos<br/>
                                El sistema sumará el costo de cada pequeña porción para darte el <strong>Costo Total de Producción</strong>.
                            </div>
                        </InfoCardCollapsible>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {productos.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => setProductoReceta(prod)}
                                    className={`bg-white p-4 rounded-xl border cursor-pointer hover:shadow-lg transition group ${prod.tieneReceta ? 'border-green-200 shadow-sm' : 'border-gray-200 border-dashed opacity-80 hover:opacity-100'}`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-gray-800">{prod.nombre}</h3>
                                        {prod.tieneReceta ? 
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Check size={10}/> ESCANDALLO OK</span> :
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">SIN RECETA</span>
                                        }
                                    </div>
                                    
                                    {prod.tieneReceta ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500"><span>Costo:</span> <span className="font-bold text-gray-800">${prod.costoProduccion?.toFixed(2)}</span></div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>Venta:</span> <span className="font-bold text-blue-600">${parseFloat(prod.precio).toFixed(2)}</span></div>
                                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400">MARGEN</span>
                                                <span className={`text-sm font-bold ${((prod.precio - prod.costoProduccion)/prod.precio) < 0.3 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {(((prod.precio - prod.costoProduccion)/prod.precio)*100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-20 text-gray-300 gap-2">
                                            <Edit size={20}/> <span className="text-sm font-bold">Crear Receta</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- VISTA 3: RENTABILIDAD --- */}
                {pestaña === 'analisis' && (
                    <div className="space-y-4">
                        <InfoCardCollapsible 
                            color="green" 
                            icon={Info} 
                            title="Análisis de Rentabilidad" 
                            description="Toca aquí para aprender a interpretar tu margen de ganancia."
                        >
                            Esta tabla cruza el <strong>Precio de Venta</strong> (lo que paga el cliente) contra el <strong>Costo de Producción</strong> (lo que te cuesta a ti en materia prima). El objetivo es detectar productos que te dejan poca ganancia.
                            <div className="bg-white/50 p-2 rounded-lg text-xs border border-green-200 mt-2">
                                <strong>💡 ¿Cómo leer esto?</strong><br/>
                                - <span className="text-red-600 font-bold">CRÍTICO:</span> Ganas menos del 20%. Estás "cambiando dinero" o perdiendo si consideras luz/gas.<br/>
                                - <span className="text-yellow-600 font-bold">REGULAR:</span> Ganas entre 20% y 40%. Es aceptable, pero podría mejorar.<br/>
                                - <span className="text-green-600 font-bold">EXCELENTE:</span> Ganas más del 40%. Estos son tus productos estrella.
                            </div>
                        </InfoCardCollapsible>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Producto</th>
                                            <th className="p-4 text-right">Precio Venta</th>
                                            <th className="p-4 text-right">Costo Insumos</th>
                                            <th className="p-4 text-right">Ganancia Neta</th>
                                            <th className="p-4 text-center">Margen %</th>
                                            <th className="p-4 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {productos.filter(p => p.tieneReceta).map(prod => {
                                            const margen = prod.precio - prod.costoProduccion;
                                            const porcentaje = (margen / prod.precio) * 100;
                                            let color = 'bg-green-100 text-green-700';
                                            let texto = 'EXCELENTE';

                                            if (porcentaje < 20) { color = 'bg-red-100 text-red-700'; texto = 'CRÍTICO'; }
                                            else if (porcentaje < 40) { color = 'bg-yellow-100 text-yellow-800'; texto = 'REGULAR'; }

                                            return (
                                                <tr key={prod.id} className="hover:bg-gray-50">
                                                    <td className="p-4 font-bold text-gray-800">{prod.nombre}</td>
                                                    <td className="p-4 text-right text-gray-600">${parseFloat(prod.precio).toFixed(2)}</td>
                                                    <td className="p-4 text-right text-gray-600">${prod.costoProduccion.toFixed(2)}</td>
                                                    <td className="p-4 text-right font-bold text-gray-800">${margen.toFixed(2)}</td>
                                                    <td className="p-4 text-center font-mono text-gray-600">{porcentaje.toFixed(1)}%</td>
                                                    <td className="p-4 text-center"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${color}`}>{texto}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {productos.filter(p => p.tieneReceta).length === 0 && <div className="p-8 text-center text-gray-400">Aún no has configurado recetas para ver el análisis.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CREAR/EDITAR INSUMO */}
            {modalInsumo && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleGuardarInsumo} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in-up border-t-8 border-indigo-600">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">{insumoEdit ? 'Editar Insumo' : 'Nueva Materia Prima'}</h3>
                        <div className="space-y-3">
                            <div><label className="text-xs font-bold text-gray-400">NOMBRE</label><input name="nombre" defaultValue={insumoEdit?.nombre} required className="w-full border rounded-lg p-2 uppercase" placeholder="EJ. HARINA BLANCA"/></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-bold text-gray-400">UNIDAD</label>
                                    <select name="unidad" defaultValue={insumoEdit?.unidad || 'kg'} className="w-full border rounded-lg p-2 bg-white">
                                        <option value="kg">KILOGRAMOS</option>
                                        <option value="lt">LITROS</option>
                                        <option value="pza">PIEZAS</option>
                                        <option value="g">GRAMOS</option>
                                        <option value="ml">MILILITROS</option>
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-gray-400">STOCK ACTUAL</label><input name="stock" type="number" step="0.01" defaultValue={insumoEdit?.stock} required className="w-full border rounded-lg p-2"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-bold text-gray-400">COSTO UNITARIO ($)</label><input name="costo" type="number" step="0.01" defaultValue={insumoEdit?.costoPromedio} required className="w-full border rounded-lg p-2" placeholder="0.00"/></div>
                                <div><label className="text-xs font-bold text-gray-400">ALERTA MÍNIMA</label><input name="minimo" type="number" defaultValue={insumoEdit?.minimo || 5} className="w-full border rounded-lg p-2"/></div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button type="button" onClick={() => setModalInsumo(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL REGISTRAR COMPRA */}
            {modalCompra && insumoEdit && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <form onSubmit={handleRegistrarCompra} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in-up border-t-8 border-green-500">
                        <h3 className="font-bold text-xl mb-1 text-gray-800">Registrar Compra</h3>
                        <p className="text-sm text-gray-500 mb-4">Ingresando stock para: <strong className="text-green-600">{insumoEdit.nombre}</strong></p>
                        
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400">CANTIDAD COMPRADA ({insumoEdit.unidad})</label>
                                <input name="cantidad" type="number" step="0.01" required className="w-full border rounded-lg p-2 text-lg font-bold text-gray-700" placeholder="0.00"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">TOTAL PAGADO ($)</label>
                                <input name="total" type="number" step="0.01" required className="w-full border rounded-lg p-2 text-lg font-bold text-gray-700" placeholder="$0.00"/>
                                <p className="text-[10px] text-gray-400 mt-1">* Esto actualizará el Costo Promedio automáticamente.</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button type="button" onClick={() => setModalCompra(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg">Registrar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL EDITOR RECETA */}
            {productoReceta && (
                <EditorReceta producto={productoReceta} onClose={() => setProductoReceta(null)} />
            )}

            {/* MODAL CONFIRMACIÓN BORRADO */}
            <ModalConfirmacion 
                isOpen={!!insumoAEliminar} 
                onClose={() => setInsumoAEliminar(null)} 
                onConfirm={handleEliminarInsumo} 
                titulo="¿Eliminar Materia Prima?" 
                mensaje={`Estás a punto de borrar "${insumoAEliminar?.nombre}". Esto podría afectar los costos de las recetas donde se utilice.`}
                tipo="eliminar" 
            />
        </div>
    );
};