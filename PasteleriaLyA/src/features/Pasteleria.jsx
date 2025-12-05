import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle, DollarSign, AlertCircle, Eye, Edit, Trash2, User, Phone, Cake, CalendarDays, ShoppingBag, Calculator, PlusCircle } from 'lucide-react';
import { CardStat } from '../components/Shared';
import { formatearFechaLocal, getFechaHoy } from '../utils/config';

export const VistaInicioPasteleria = ({ pedidos, onEditar, onToggleEstado, onVerDetalles, onCancelar }) => {
    const pedidosOrdenados = useMemo(() => [...pedidos].sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega)), [pedidos]);
    const totalCajaHoy = useMemo(() => { const hoy = getFechaHoy(); return pedidos.filter(p => p.estado !== 'Cancelado' && p.fecha === hoy).reduce((acc, p) => acc + (p.pagosRealizados ? (p.total / p.numPagos) * p.pagosRealizados : 0), 0); }, [pedidos]);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Pedidos de Pasteles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <CardStat titulo="Pedidos Pendientes" valor={pedidos.filter(p => p.estado === 'Pendiente').length} color="bg-yellow-100 text-yellow-800" icon={<Clock size={30} />} />
                <CardStat titulo="Entregados Hoy" valor={pedidos.filter(p => p.estado === 'Entregado' && p.fechaEntrega === getFechaHoy()).length} color="bg-green-100 text-green-800" icon={<CheckCircle size={30} />} />
                <CardStat titulo="Total Caja (Hoy)" valor={`$${totalCajaHoy.toFixed(0)}`} color="bg-pink-100 text-pink-800" icon={<DollarSign size={30} />} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-pink-50 text-pink-800 text-sm"><th className="p-4">Folio</th><th className="p-4">Cliente</th><th className="p-4">Entrega</th><th className="p-4">Total</th><th className="p-4">Pagos</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr></thead><tbody>{pedidosOrdenados.map((p, i) => (<tr key={i} onClick={() => onVerDetalles(p)} className={`border-b hover:bg-gray-50 cursor-pointer ${p.estado === 'Cancelado' ? 'opacity-50' : ''}`}><td className="p-4 font-mono font-bold text-gray-600">{p.folio}</td><td className="p-4"><div className={`font-bold ${p.estado === 'Cancelado' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{p.cliente}</div><div className="text-xs text-gray-400">{p.tipoProducto || 'Pastel'}</div></td><td className="p-4 text-sm font-medium text-gray-600">{formatearFechaLocal(p.fechaEntrega)}</td><td className={`p-4 font-bold ${p.estado === 'Cancelado' ? 'text-gray-400' : 'text-green-600'}`}>${p.total}</td><td className="p-4 text-sm text-gray-500"><span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">{p.pagosRealizados || 0}/{p.numPagos}</span></td><td className="p-4">
                    {p.estado === 'Cancelado' ? (<span className="px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 bg-red-100 text-red-800"><AlertCircle size={12} /> Cancelado</span>) : (
                        <button onClick={(e) => { e.stopPropagation(); onToggleEstado(p.folio); }} className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 transition-colors ${p.estado === 'Entregado' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                            {p.estado === 'Entregado' ? <CheckCircle size={12} /> : <Clock size={12} />} {p.estado}
                        </button>
                    )}
                </td><td className="p-4 flex gap-2"><button onClick={(e) => { e.stopPropagation(); onVerDetalles(p); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><Eye size={18} /></button>{p.estado !== 'Cancelado' && (<><button onClick={(e) => { e.stopPropagation(); onEditar(p); }} className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600"><Edit size={18} /></button><button onClick={(e) => { e.stopPropagation(); onCancelar(p.folio); }} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={18} /></button></>)}</td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
};

export const VistaNuevoPedido = ({ pedidos, onGuardarPedido, generarFolio, pedidoAEditar, mostrarNotificacion }) => {
    const [formulario, setFormulario] = useState({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Pastel');
    const [otroTexto, setOtroTexto] = useState('');

    useEffect(() => {
        if (pedidoAEditar) {
            setFormulario({ ...pedidoAEditar });
            const esEstandar = ['Pastel', 'Cheesecake', 'Rosca'].includes(pedidoAEditar.tipoProducto);
            if (esEstandar) setCategoriaSeleccionada(pedidoAEditar.tipoProducto);
            else { setCategoriaSeleccionada('Otro'); setOtroTexto(pedidoAEditar.tipoProducto || ''); }
        } else {
            setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
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
            setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
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
                    <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><User size={16} className="mr-2 text-pink-500" /> Cliente</label><input required type="text" placeholder="Ej. María Pérez" className="w-full p-3 border rounded-lg" value={formulario.cliente} onChange={e => { if (/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]*$/.test(e.target.value)) setFormulario({ ...formulario, cliente: e.target.value }) }} /></div>
                    <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><Phone size={16} className="mr-2 text-pink-500" /> Teléfono</label><input required type="tel" placeholder="10 dígitos" className="w-full p-3 border rounded-lg" value={formulario.telefono} onChange={e => { if (/^\d{0,10}$/.test(e.target.value)) setFormulario({ ...formulario, telefono: e.target.value }) }} /></div>
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700"><Cake size={16} className="mr-2 text-pink-500" /> Categoría / Producto</label>
                        <select className="w-full p-3 border rounded-lg bg-white" value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)}><option value="Pastel">Pastel</option><option value="Cheesecake">Cheesecake</option><option value="Rosca">Rosca</option><option value="Otro">Otro (Escribir)</option></select>
                        {categoriaSeleccionada === 'Otro' && (<input type="text" placeholder="Especifique..." className="w-full p-3 mt-2 border rounded-lg bg-pink-50" value={otroTexto} onChange={e => setOtroTexto(e.target.value)} required />)}
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700"><CalendarDays size={16} className="mr-2 text-pink-500" /> Fecha de Entrega</label>
                        <input required type="date" min="2025-12-01" className="w-full p-3 border rounded-lg" value={formulario.fechaEntrega} onChange={e => setFormulario({ ...formulario, fechaEntrega: e.target.value })} />
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