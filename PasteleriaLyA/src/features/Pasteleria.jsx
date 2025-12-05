import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, DollarSign, AlertCircle, Eye, Edit, Trash2, User, Phone, Cake, CalendarDays, ShoppingBag, Calculator, PlusCircle, ChevronLeft, ChevronRight, Search, ArchiveRestore, RotateCcw, X } from 'lucide-react';
import { CardStat } from '../components/Shared';
import { formatearFechaLocal, getFechaHoy } from '../utils/config';

// --- COMPONENTE: MODAL DE PAPELERA (PEDIDOS CANCELADOS) ---
const ModalPapelera = ({ pedidosCancelados, onClose, onRestaurar }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border-t-8 border-gray-500">
                <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            <ArchiveRestore size={24} className="text-gray-600"/> Papelera de Reciclaje
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Los pedidos se eliminan permanentemente después de 48 horas.</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-2 rounded-full border hover:bg-gray-100"><X size={20}/></button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 bg-gray-100/50 max-h-[60vh]">
                    {pedidosCancelados.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Trash2 size={48} className="mx-auto mb-3 opacity-20"/>
                            <p>La papelera está vacía.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pedidosCancelados.map((p, i) => {
                                // Calcular tiempo restante
                                const fechaCancelacion = new Date(p.fechaCancelacion);
                                const ahora = new Date();
                                const horasTranscurridas = (ahora - fechaCancelacion) / (1000 * 60 * 60);
                                const horasRestantes = Math.max(0, 48 - horasTranscurridas);
                                
                                return (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">Cancelado</span>
                                                <span className="text-[10px] font-bold text-gray-400">{p.folio}</span>
                                            </div>
                                            <p className="font-bold text-gray-800">{p.cliente}</p>
                                            <p className="text-xs text-gray-500">{p.tipoProducto} • Entrega: {formatearFechaLocal(p.fechaEntrega)}</p>
                                            <p className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                                                <Clock size={10}/> Se elimina en {Math.floor(horasRestantes)} horas
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => onRestaurar(p.folio)} 
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <RotateCcw size={16}/> Restaurar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- VISTA: INICIO (DASHBOARD) ---
export const VistaInicioPasteleria = ({ pedidos, onEditar, onToggleEstado, onVerDetalles, onCancelar, onRestaurar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [mostrarPapelera, setMostrarPapelera] = useState(false);

    const pedidosActivos = useMemo(() => pedidos.filter(p => p.estado !== 'Cancelado'), [pedidos]);
    const pedidosCancelados = useMemo(() => pedidos.filter(p => p.estado === 'Cancelado'), [pedidos]);

    const pedidosFiltrados = useMemo(() => {
        let procesados = [...pedidosActivos].sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));
        if (busqueda) {
            const texto = busqueda;
            procesados = procesados.filter(p => p.cliente.toUpperCase().includes(texto) || p.telefono.includes(texto));
        }
        return procesados;
    }, [pedidosActivos, busqueda]);

    const totalCajaHoy = useMemo(() => { const hoy = getFechaHoy(); return pedidosActivos.filter(p => p.fecha === hoy).reduce((acc, p) => acc + (p.pagosRealizados ? (p.total / p.numPagos) * p.pagosRealizados : 0), 0); }, [pedidosActivos]);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Pedidos de la Pastelería</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <CardStat titulo="Pedidos Pendientes" valor={pedidosActivos.filter(p => p.estado === 'Pendiente').length} color="bg-yellow-100 text-yellow-800" icon={<Clock size={30} />} />
                <CardStat titulo="Entregados Hoy" valor={pedidosActivos.filter(p => p.estado === 'Entregado' && p.fechaEntrega === getFechaHoy()).length} color="bg-green-100 text-green-800" icon={<CheckCircle size={30} />} />
                
                {/* NUEVA TARJETA PAPELERA */}
                <div 
                    onClick={() => setMostrarPapelera(true)}
                    className="p-6 rounded-xl shadow-sm border-l-4 border-gray-400 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                    <div>
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Pedidos Cancelados (48h)</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{pedidosCancelados.length}</p>
                    </div>
                    <div className="text-gray-300 opacity-50 group-hover:text-gray-500 group-hover:opacity-100 transition"><ArchiveRestore size={30}/></div>
                </div>

                <CardStat titulo="Total Caja (Hoy)" valor={`$${totalCajaHoy.toFixed(0)}`} color="bg-pink-100 text-pink-800" icon={<DollarSign size={30} />} />
            </div>

            <div className="flex justify-end mb-4">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
                    <input 
                        type="text"
                        placeholder="BUSCAR POR CLIENTE O TELÉFONO..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm transition-all uppercase"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value.toUpperCase())} 
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-pink-50 text-pink-800 text-sm">
                                <th className="p-4">Folio</th><th className="p-4">Cliente</th><th className="p-4">Entrega</th><th className="p-4">Total</th><th className="p-4">Pagos</th><th className="p-4">Estado</th><th className="p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidosFiltrados.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No se encontraron pedidos activos. Revisa la papelera si cancelaste alguno.</td></tr>
                            ) : (
                                pedidosFiltrados.map((p, i) => (
                                    <tr key={i} onClick={() => onVerDetalles(p)} className="border-b hover:bg-gray-50 cursor-pointer">
                                        <td className="p-4 font-mono font-bold text-gray-600">{p.folio}</td>
                                        <td className="p-4"><div className="font-bold uppercase text-gray-800">{p.cliente}</div><div className="text-xs text-gray-400">{p.tipoProducto || 'Pastel'}</div></td>
                                        <td className="p-4 text-sm font-medium text-gray-600">{formatearFechaLocal(p.fechaEntrega)}<br/><span className="text-xs text-gray-400">{p.horaEntrega ? `${p.horaEntrega} hrs` : ''}</span></td>
                                        <td className="p-4 font-bold text-green-600">${p.total}</td>
                                        <td className="p-4 text-sm text-gray-500"><span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">{p.pagosRealizados || 0}/{p.numPagos}</span></td>
                                        <td className="p-4">
                                            <button onClick={(e) => { e.stopPropagation(); onToggleEstado(p.folio); }} className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 transition-colors ${p.estado === 'Entregado' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                                                {p.estado === 'Entregado' ? <CheckCircle size={12} /> : <Clock size={12} />} {p.estado}
                                            </button>
                                        </td>
                                        <td className="p-4 flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); onVerDetalles(p); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><Eye size={18} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onEditar(p); }} className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600"><Edit size={18} /></button>
                                            {/* BOTÓN CANCELAR (Antes eliminar) */}
                                            <button onClick={(e) => { e.stopPropagation(); onCancelar(p.folio); }} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600" title="Cancelar Pedido"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL PAPELERA */}
            {mostrarPapelera && (
                <ModalPapelera 
                    pedidosCancelados={pedidosCancelados} 
                    onClose={() => setMostrarPapelera(false)} 
                    onRestaurar={(folio) => { onRestaurar(folio); setMostrarPapelera(false); }} 
                />
            )}
        </div>
    );
};

// ... (VistaNuevoPedido y VistaCalendarioPasteleria SE MANTIENEN IGUAL) ...
// Copia las otras vistas del código anterior aquí abajo.
export const VistaNuevoPedido = ({ pedidos, onGuardarPedido, generarFolio, pedidoAEditar, mostrarNotificacion }) => {
    const [formulario, setFormulario] = useState({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '', horaEntrega: '' });
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Pastel');
    const [otroTexto, setOtroTexto] = useState('');

    useEffect(() => {
        if (pedidoAEditar) {
            setFormulario({ ...pedidoAEditar, horaEntrega: pedidoAEditar.horaEntrega || '' });
            const esEstandar = ['Pastel', 'Cheesecake', 'Rosca'].includes(pedidoAEditar.tipoProducto);
            if (esEstandar) setCategoriaSeleccionada(pedidoAEditar.tipoProducto);
            else { setCategoriaSeleccionada('Otro'); setOtroTexto(pedidoAEditar.tipoProducto || ''); }
        } else {
            setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '', horaEntrega: '' });
            setCategoriaSeleccionada('Pastel'); setOtroTexto('');
        }
    }, [pedidoAEditar]);

    useEffect(() => {
        if (categoriaSeleccionada === 'Otro') setFormulario(prev => ({ ...prev, tipoProducto: otroTexto }));
        else setFormulario(prev => ({ ...prev, tipoProducto: categoriaSeleccionada }));
    }, [categoriaSeleccionada, otroTexto]);

    const manejarSubmit = (e) => {
        e.preventDefault();
        if (formulario.telefono.length !== 10) { mostrarNotificacion("El teléfono debe tener 10 dígitos.", "error"); return; }
        if (formulario.cliente.trim().length < 3) { mostrarNotificacion("Nombre muy corto.", "error"); return; }
        if (categoriaSeleccionada === 'Otro' && otroTexto.trim() === '') { mostrarNotificacion("Especifica qué producto es.", "error"); return; }
        const folioFinal = pedidoAEditar ? formulario.folio : generarFolio();
        if (!pedidoAEditar && pedidos.find(p => p.folio === folioFinal)) { mostrarNotificacion("Error colisión folio", "error"); return; }
        
        onGuardarPedido({
            ...formulario,
            folio: folioFinal,
            total: parseFloat(formulario.total) || 0,
            numPagos: parseInt(formulario.numPagos) || 1,
            pagosRealizados: pedidoAEditar ? (pedidoAEditar.pagosRealizados || 0) : 0,
            fecha: pedidoAEditar ? pedidoAEditar.fecha : getFechaHoy(),
            estado: pedidoAEditar ? pedidoAEditar.estado : 'Pendiente',
            origen: 'Pastelería'
        });
        
        if (!pedidoAEditar) {
            setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '', horaEntrega: '' });
            setCategoriaSeleccionada('Pastel'); setOtroTexto('');
            mostrarNotificacion(`Pedido ${folioFinal} registrado`, "exito");
        } else { mostrarNotificacion("Pedido actualizado", "exito"); }
    };

    const montoPorPago = formulario.total && formulario.numPagos > 0 ? (parseFloat(formulario.total) / parseInt(formulario.numPagos)).toFixed(2) : '0.00';

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-pink-900">{pedidoAEditar ? 'Editar Pedido' : 'Nuevo Pedido Pastelería'}</h2>
                {pedidoAEditar && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">{pedidoAEditar.folio}</span>}
            </div>
            <form onSubmit={manejarSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-pink-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700"><User size={16} className="mr-2 text-pink-500" /> Cliente</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="EJ. MARÍA PÉREZ" 
                            className="w-full p-3 border rounded-lg uppercase" 
                            value={formulario.cliente} 
                            onChange={e => { 
                                const val = e.target.value.toUpperCase();
                                if (/^[A-Z\sÑÁÉÍÓÚ]*$/.test(val)) setFormulario({ ...formulario, cliente: val });
                            }} 
                        />
                    </div>
                    <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><Phone size={16} className="mr-2 text-pink-500" /> Teléfono</label><input required type="tel" placeholder="10 dígitos" className="w-full p-3 border rounded-lg" value={formulario.telefono} onChange={e => { if (/^\d{0,10}$/.test(e.target.value)) setFormulario({ ...formulario, telefono: e.target.value }) }} /></div>
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700"><Cake size={16} className="mr-2 text-pink-500" /> Categoría / Producto</label>
                        <select className="w-full p-3 border rounded-lg bg-white" value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)}><option value="Pastel">Pastel</option><option value="Cheesecake">Cheesecake</option><option value="Rosca">Rosca</option><option value="Otro">Otro (Escribir)</option></select>
                        {categoriaSeleccionada === 'Otro' && (<input type="text" placeholder="Especifique..." className="w-full p-3 mt-2 border rounded-lg bg-pink-50" value={otroTexto} onChange={e => setOtroTexto(e.target.value)} required />)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center text-sm font-medium text-gray-700"><CalendarDays size={16} className="mr-2 text-pink-500" /> Fecha Entrega</label>
                            <input required type="date" min="2025-12-01" className="w-full p-3 border rounded-lg" value={formulario.fechaEntrega} onChange={e => setFormulario({ ...formulario, fechaEntrega: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center text-sm font-medium text-gray-700"><Clock size={16} className="mr-2 text-pink-500" /> Hora Entrega</label>
                            <input required type="time" className="w-full p-3 border rounded-lg" value={formulario.horaEntrega} onChange={e => setFormulario({ ...formulario, horaEntrega: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2"><label className="flex items-center text-sm font-medium text-gray-700"><ShoppingBag size={16} className="mr-2 text-pink-500" /> Detalles</label><textarea placeholder="Sabor, dedicatoria, decoración especial..." className="w-full p-3 border rounded-lg h-24" value={formulario.detalles} onChange={e => setFormulario({ ...formulario, detalles: e.target.value })} /></div>
                    <div className="md:col-span-2 bg-pink-50 p-4 rounded-xl border border-pink-100">
                        <div className="flex items-center mb-4 text-pink-700 font-semibold"><Calculator size={18} className="mr-2" /> Calculadora de Liquidación</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm text-gray-600">Total ($)</label><input required type="number" min="0" placeholder="Ej. 500" className="w-full p-3 border rounded-lg font-bold" value={formulario.total} onChange={e => setFormulario({ ...formulario, total: e.target.value })} /></div>
                            <div><label className="text-sm text-gray-600">Num. Pagos</label><input type="number" min="1" placeholder="Ej. 2" className="w-full p-3 border rounded-lg" value={formulario.numPagos} onChange={e => setFormulario({ ...formulario, numPagos: e.target.value })} /></div>
                            <div className="bg-white p-3 rounded-lg border border-pink-200 flex flex-col justify-center items-center"><span className="text-xs text-pink-500 uppercase font-bold">Monto x Pago</span><span className="text-xl font-bold text-pink-700">${montoPorPago}</span></div>
                        </div>
                    </div>
                </div>
                <button type="submit" className="mt-8 w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2">{pedidoAEditar ? <Edit size={20} /> : <PlusCircle size={20} />} {pedidoAEditar ? 'Guardar Cambios' : 'Registrar Pedido'}</button>
            </form>
        </div>
    );
};

export const VistaCalendarioPasteleria = ({ pedidos, onSeleccionarDia }) => {
    const [fechaVisual, setFechaVisual] = useState(new Date(2025, 11, 1)); 
    const [fechaBusqueda, setFechaBusqueda] = useState('');

    const anio = fechaVisual.getFullYear();
    const mes = fechaVisual.getMonth();

    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const diaInicioSemana = new Date(anio, mes, 1).getDay(); 

    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(i);

    const cambiarMes = (delta) => {
        const nueva = new Date(fechaVisual);
        nueva.setMonth(nueva.getMonth() + delta);
        if (nueva < new Date(2025, 11, 1)) return;
        setFechaVisual(nueva);
    };

    const handleCambiarMesInput = (e) => {
        const [y, m] = e.target.value.split('-').map(Number);
        const nueva = new Date(y, m - 1, 1);
        if (nueva < new Date(2025, 11, 1)) return;
        setFechaVisual(nueva);
    };

    const handleBuscarDia = (e) => {
        const fechaStr = e.target.value;
        setFechaBusqueda(fechaStr);
        if(fechaStr) {
            const [y, m] = fechaStr.split('-').map(Number);
            if (new Date(y, m - 1, 1) >= new Date(2025, 11, 1)) {
                setFechaVisual(new Date(y, m - 1, 1));
            }
            onSeleccionarDia(fechaStr);
        }
    };

    const getPedidosDelDia = (dia) => {
        if (!dia) return [];
        const fechaString = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return pedidos
            .filter(p => p.fechaEntrega === fechaString && p.estado !== 'Cancelado')
            .sort((a, b) => (a.horaEntrega || '00:00').localeCompare(b.horaEntrega || '00:00'));
    };

    const mesInputValue = `${anio}-${String(mes + 1).padStart(2, '0')}`;

    return (
        <div className="p-8 h-screen flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <CalendarDays size={32} className="text-pink-600"/> Agenda de Pedidos
                </h2>
                
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-pink-100 p-1">
                        <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-pink-50 rounded-lg text-gray-600"><ChevronLeft /></button>
                        <input 
                            type="month" 
                            value={mesInputValue}
                            min="2025-12"
                            onChange={handleCambiarMesInput}
                            className="px-2 py-1 font-bold text-lg text-gray-700 bg-transparent border-none focus:outline-none text-center min-w-[220px] cursor-pointer"
                        />
                        <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-pink-50 rounded-lg text-gray-600"><ChevronRight /></button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400"/>
                        </div>
                        <input 
                            type="date"
                            value={fechaBusqueda}
                            min="2025-12-01"
                            onChange={handleBuscarDia}
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                            placeholder="Buscar día..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 bg-pink-50 border-b border-pink-100">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                        <div key={d} className="py-3 text-center text-sm font-bold text-pink-800 uppercase tracking-wider">{d}</div>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {dias.map((dia, idx) => {
                        const pedidosDia = getPedidosDelDia(dia);
                        const tienePedidos = pedidosDia.length > 0;
                        
                        return (
                            <div 
                                key={idx} 
                                className={`border-b border-r border-gray-100 p-2 min-h-[100px] relative transition-colors hover:bg-gray-50 ${!dia ? 'bg-gray-50/30' : 'cursor-pointer'}`}
                                onClick={() => { if (dia) onSeleccionarDia(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`); }}
                            >
                                {dia && (
                                    <>
                                        <span className={`text-sm font-bold mb-1 block ${tienePedidos ? 'text-pink-600' : 'text-gray-400'}`}>{dia}</span>
                                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                            {pedidosDia.map((p, i) => (
                                                <div key={i} className="text-[10px] bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded border border-pink-200 truncate font-medium flex justify-between gap-1" title={`${p.tipoProducto} - ${p.cliente}`}>
                                                    <span>{p.tipoProducto}</span>
                                                    {p.horaEntrega && <span className="text-pink-500">{p.horaEntrega}</span>}
                                                </div>
                                            ))}
                                            {tienePedidos && pedidosDia.length > 3 && (
                                                <div className="text-[9px] text-gray-400 text-center font-bold">+ {pedidosDia.length - 3} más</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};