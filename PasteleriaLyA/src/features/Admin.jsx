import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, X, Trash2, Users, Shield, Briefcase, UserPlus, Edit, Check, DollarSign, Wallet, Coffee, Receipt, Eye, Calendar, Clock, Cake, Database, ServerCrash, AlertTriangle } from 'lucide-react';
import { CardStat, ModalConfirmacion } from '../components/Shared';
import { formatearFechaLocal, getFechaHoy } from '../utils/config';

// --- IMPORTACIÓN: RECHARTS ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- IMPORTACIONES DE FIREBASE ---
import { db } from '../firebase';
import { collection, writeBatch, getDocs } from 'firebase/firestore';

// --- IMPORTAMOS LOS ROLES DEFINIDOS ---
import { ROLES } from '../utils/roles';

// MODAL DETALLE CORTE (Sin cambios)
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
                                    <p className={`font-bold text-lg ${theme.iconColor}`}>+${item.monto.toFixed(2)}</p>
                                    <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1"><Eye size={10}/> Ver</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className={`${theme.footerBg} p-5 text-white flex justify-between items-center`}>
                    <span className="font-bold text-white/80 text-sm uppercase tracking-wider">Total Recaudado</span>
                    <span className="font-bold text-2xl text-white">${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// VISTA INICIO ADMIN (SIN EL BOTÓN DE BORRAR)
export const VistaInicioAdmin = ({ pedidos, ventasCafeteria, onVerDetalles }) => {
    const [modalAbierto, setModalAbierto] = useState(null); 
    const [fechaCorte, setFechaCorte] = useState(getFechaHoy());

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
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Panel General de Control</h2>
                    <p className="text-gray-500 text-sm mt-1">Resumen financiero y herramientas de base de datos.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-end md:items-center">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Calendar size={20} /></div>
                        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Fecha de Corte</label><input type="date" value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} className="font-bold text-gray-700 text-sm bg-transparent outline-none cursor-pointer" /></div>
                        { !esHoy && (<button onClick={() => setFechaCorte(getFechaHoy())} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition">IR A HOY</button>)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div onClick={() => setModalAbierto('pasteleria')} className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">VER DETALLES</div>
                    <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-pink-800 flex items-center gap-2">Área Pastelería</h3><p className="text-pink-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1"><Eye size={12}/> Ver Corte {esHoy ? 'de Hoy' : `del ${formatearFechaLocal(fechaCorte)}`}</p></div><div className="bg-pink-100 p-2 rounded-lg text-pink-600 group-hover:scale-110 transition-transform"><Wallet size={24} /></div></div>
                    <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-bold text-pink-700">${datosPasteleria.total.toFixed(2)}</span><span className="text-sm text-pink-400 font-medium">recaudado</span></div>
                    <div className="border-t border-pink-100 pt-3 mt-2 flex justify-between items-center text-sm"><span className="text-gray-500">Movimientos / Pagos:</span><span className="font-bold text-gray-700 bg-pink-50 px-2 py-0.5 rounded">{datosPasteleria.items.length}</span></div>
                </div>
                <div onClick={() => setModalAbierto('cafeteria')} className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">VER DETALLES</div>
                    <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">Área Cafetería</h3><p className="text-orange-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1"><Eye size={12}/> Ver Corte {esHoy ? 'de Hoy' : `del ${formatearFechaLocal(fechaCorte)}`}</p></div><div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:scale-110 transition-transform"><Coffee size={24} /></div></div>
                    <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-bold text-orange-700">${datosCafeteria.total.toFixed(2)}</span><span className="text-sm text-orange-400 font-medium">recaudado</span></div>
                    <div className="border-t border-orange-100 pt-3 mt-2 flex justify-between items-center text-sm"><span className="text-gray-500">Tickets cobrados:</span><span className="font-bold text-gray-700 bg-orange-50 px-2 py-0.5 rounded">{datosCafeteria.items.length}</span></div>
                </div>
            </div>

            <ModalDetalleCorte isOpen={modalAbierto === 'pasteleria'} onClose={() => setModalAbierto(null)} titulo={`Corte Pastelería`} items={datosPasteleria.items} total={datosPasteleria.total} colorTheme="pink" onItemClick={onVerDetalles} fecha={fechaCorte} />
            <ModalDetalleCorte isOpen={modalAbierto === 'cafeteria'} onClose={() => setModalAbierto(null)} titulo={`Corte Cafetería`} items={datosCafeteria.items} total={datosCafeteria.total} colorTheme="orange" onItemClick={onVerDetalles} fecha={fechaCorte} />
        </div>
    );
};

// --- VISTA REPORTE UNIVERSAL CON RECHARTS ---
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
            desglose.push({ label: `${i}`, valorP: 0, valorC: 0, fechaFull: `${anio}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
        }

        datosFiltrados.forEach(p => {
            const [y, m, d] = p.fecha.split('-').map(Number);
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

            if (y === anio && m === (mes + 1)) {
                if (p.origen === 'Pastelería') desglose[d-1].valorP += montoReal;
                else desglose[d-1].valorC += montoReal;
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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg pointer-events-none">
                    <p className="font-bold text-gray-700 mb-1">Día {label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                            {entry.name}: ${entry.value.toFixed(2)}
                        </p>
                    ))}
                    <div className="border-t pt-1 mt-1">
                        <p className="font-bold text-gray-800 text-sm">Total: ${(payload.reduce((acc, curr) => acc + curr.value, 0)).toFixed(2)}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 italic">Click para ver detalles</p>
                </div>
            );
        }
        return null;
    };

    const handleBarClick = (data) => {
        if (data && data.label) {
            onAbrirModalDia(data.label, datosReporte.mes, datosReporte.anio, todosLosDatosCompletos);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reporte Ventas</h2>
                <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200 items-start md:items-end w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Mes Principal</label>
                        <input type="month" value={mesSeleccionado} min="2025-12" onChange={(e) => { setMesSeleccionado(e.target.value); limpiarRango(); }} className="w-full md:w-auto border rounded-lg p-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition uppercase" />
                    </div>
                    <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
                    
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

                    {(rangoInicio || rangoFin) && (<button onClick={limpiarRango} className="text-xs text-red-500 font-bold hover:underline mb-3 md:mb-1 self-end flex items-center gap-1"><X size={12} /> Limpiar</button>)}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {modo !== 'cafeteria' && <CardStat titulo="Total Pastelería" valor={`$${datosReporte.totalPasteleria.toFixed(2)}`} color="bg-pink-100 text-pink-800" />}
                {modo !== 'pasteleria' && <CardStat titulo="Total Cafetería" valor={`$${datosReporte.totalCafeteria.toFixed(2)}`} color="bg-orange-100 text-orange-800" />}
                {modo === 'admin' && <CardStat titulo="Gran Total" valor={`$${datosReporte.totalGlobal.toFixed(2)}`} color="bg-green-100 text-green-800" />}
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 capitalize text-sm md:text-base"><BarChart3 size={20} /> {datosReporte.tituloPeriodo}</h3>
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
                            
                            {(modo === 'admin' || modo === 'pasteleria') && (
                                <Bar 
                                    dataKey="valorP" 
                                    name="Pastelería" 
                                    stackId="a" 
                                    fill="#ec4899" 
                                    radius={[4, 4, 0, 0]} 
                                    maxBarSize={50}
                                    onClick={handleBarClick}
                                    cursor="pointer"
                                />
                            )}
                            {(modo === 'admin' || modo === 'cafeteria') && (
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
                <p className="text-xs text-gray-400 text-center mt-2 italic">Haz clic en una barra para ver el detalle del día.</p>
            </div>
        </div>
    );
};

// COMPONENTE MODAL USUARIO Y VISTA GESTIÓN USUARIOS (SIN CAMBIOS)
const ModalUsuario = ({ isOpen, onClose, onGuardar, usuarioAEditar }) => {
    // Usamos 'empleado general' como default
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

    // Helper para botones de rol
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

// --- GESTIÓN USUARIOS ACTUALIZADA ---
// --- GESTIÓN USUARIOS ACTUALIZADA ---
export const VistaGestionUsuarios = ({ usuarios, onGuardar, onEliminar }) => {
    const [modalOpen, setModalOpen] = useState(false); 
    const [usuarioEditar, setUsuarioEditar] = useState(null); 
    const [usuarioEliminar, setUsuarioEliminar] = useState(null); 
    
    // Clasificamos usuarios en 4 grupos
    const administradores = usuarios.filter(u => u.rol === ROLES.ADMIN);
    const generales = usuarios.filter(u => u.rol === ROLES.GENERAL);
    const pasteleros = usuarios.filter(u => u.rol === ROLES.PASTELERIA);
    const cafeteros = usuarios.filter(u => u.rol === ROLES.CAFETERIA);

    // Componente reutilizable para cada tarjeta de grupo
    const GrupoCard = ({ titulo, lista, colorBg, colorBorder, colorText, icon: Icon, colorIcon, iconBg }) => {
        
        // Función para obtener el color del borde basado en el texto
        // Ejemplo: 'text-rose-800' se convierte en 'border-rose-500'
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
                            // AQUI ESTÁ EL CAMBIO: Agregamos border-l-4 y el color dinámico
                            className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} flex justify-between items-center group hover:shadow-md transition relative overflow-hidden`}
                        >
                            {/* Eliminé el div absoluto que hacía la línea finita, ahora usamos el borde real de la caja */}
                            
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
            
            {/* GRID DE 4 CUADRITOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto pb-4">
                
                {/* 1. ADMINS */}
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

                {/* 2. GENERALES */}
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

                {/* 3. PASTELERÍA */}
                <GrupoCard 
                    titulo="Staff Pastelería" 
                    lista={pasteleros} 
                    colorBg="bg-rose-200" 
                    colorBorder="border-rose-400" 
                    colorText="text-rose-800" 
                    icon={Cake} 
                    colorIcon="text-rose-600" 
                    iconBg="bg-rose-100"
                />

                {/* 4. CAFETERÍA */}
                <GrupoCard 
                    titulo="Staff Cafetería" 
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

// --- COMPONENTE ACTUALIZADO: GESTIÓN DE BASE DE DATOS (MULTI-SELECCIÓN) ---
export const VistaBaseDatos = () => {
    // Estados para Limpieza Total (Fábrica)
    const [confirmarLimpieza, setConfirmarLimpieza] = useState(false);
    
    // Estados para Gestión por Periodos (Multi-selección)
    const [mesesDisponibles, setMesesDisponibles] = useState([]); // Todos los que existen
    const [mesesSeleccionados, setMesesSeleccionados] = useState([]); // Los que marcó el usuario (array)
    const [confirmarBorradoMeses, setConfirmarBorradoMeses] = useState(false);
    
    // Estados de carga
    const [cargando, setCargando] = useState(false);
    const [cargandoExportar, setCargandoExportar] = useState(false);
    const [cargandoFechas, setCargandoFechas] = useState(true);

    // --- EFECTO: BUSCAR MESES CON DATOS REALES ---
    useEffect(() => {
        const obtenerMesesConDatos = async () => {
            setCargandoFechas(true);
            try {
                // 1. Obtener fechas de Ventas
                const ventasSnap = await getDocs(collection(db, "ventas"));
                const fechasVentas = ventasSnap.docs.map(d => d.data().fecha).filter(Boolean);

                // 2. Obtener fechas de Pedidos
                const pedidosSnap = await getDocs(collection(db, "pedidos"));
                const fechasPedidos = pedidosSnap.docs.map(d => d.data().fecha).filter(Boolean);

                // 3. Unificar y extraer "YYYY-MM"
                const todasLasFechas = [...fechasVentas, ...fechasPedidos];
                const setMeses = new Set();

                todasLasFechas.forEach(fechaStr => {
                    if (fechaStr.length >= 7) {
                        const mesAnio = fechaStr.substring(0, 7); // "2025-12"
                        setMeses.add(mesAnio);
                    }
                });

                // 4. Ordenar (Más reciente primero)
                const mesesOrdenados = Array.from(setMeses).sort().reverse();
                setMesesDisponibles(mesesOrdenados);

            } catch (error) {
                console.error("Error cargando fechas disponibles:", error);
            }
            setCargandoFechas(false);
        };

        obtenerMesesConDatos();
    }, []);

    // Helper: Nombre bonito del mes
    const nombreMes = (fechaMes) => {
        if (!fechaMes) return "";
        const [anio, mes] = fechaMes.split('-');
        const date = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    // Helper: Checkbox lógica
    const toggleMes = (mes) => {
        if (mesesSeleccionados.includes(mes)) {
            setMesesSeleccionados(prev => prev.filter(m => m !== mes));
        } else {
            setMesesSeleccionados(prev => [...prev, mes]);
        }
    };

    const seleccionarTodos = () => setMesesSeleccionados([...mesesDisponibles]);
    const deseleccionarTodos = () => setMesesSeleccionados([]);

    // --- FUNCIÓN 1: EXPORTAR SELECCIONADOS ---
    const handleExportarSeleccion = async () => {
        if (mesesSeleccionados.length === 0) return alert("Selecciona al menos un mes.");
        setCargandoExportar(true);

        try {
            // Obtener todo y filtrar (más seguro para asegurar consistencia)
            const ventasRef = collection(db, "ventas");
            const snapshotVentas = await getDocs(ventasRef);
            
            const pedidosRef = collection(db, "pedidos");
            const snapshotPedidos = await getDocs(pedidosRef);

            // Filtrar los que coincidan con ALGUNO de los meses seleccionados
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

            // Generar CSV
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

            // Nombre del archivo dinámico
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

    // --- FUNCIÓN 2: ELIMINAR SELECCIONADOS ---
    const handleEliminarSeleccion = async () => {
        setConfirmarBorradoMeses(false);
        setCargando(true);
        try {
            const batchSize = 400;
            let totalEliminados = 0;

            const borrarLote = async (nombreColeccion) => {
                const colRef = collection(db, nombreColeccion);
                const snapshot = await getDocs(colRef);
                
                // Filtrar docs que pertenezcan a CUALQUIERA de los meses seleccionados
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
                // Actualizar lista disponible quitando los meses que seleccionamos
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

    // --- FUNCIÓN 3: RESET FÁBRICA ---
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

            {/* SECCIÓN 1: GESTOR DE HISTORIAL (MULTI-SELECCIÓN) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* COLUMNA IZQUIERDA: SELECTOR DE MESES */}
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

                    {/* COLUMNA DERECHA: ACCIONES */}
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

            {/* SECCIÓN 2: ZONA DE PELIGRO (RESET FÁBRICA) */}
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

            {/* MODAL CONFIRMACIÓN: BORRAR MESES */}
            <ModalConfirmacion 
                isOpen={confirmarBorradoMeses} 
                onClose={() => setConfirmarBorradoMeses(false)} 
                onConfirm={handleEliminarSeleccion} 
                titulo={`¿Eliminar ${mesesSeleccionados.length} Periodos?`} 
                mensaje={`Se borrarán permanentemente las Ventas y Pedidos de: ${mesesSeleccionados.map(m => nombreMes(m)).join(', ')}. ¿Estás seguro?`}
                tipo="eliminar" 
            />

            {/* MODAL CONFIRMACIÓN: RESET FÁBRICA */}
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