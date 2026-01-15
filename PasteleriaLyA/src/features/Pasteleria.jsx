import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Clock, CheckCircle, DollarSign, AlertCircle, Eye, Edit, Trash2, User, Phone, 
    Cake, CalendarDays, ShoppingBag, Calculator, PlusCircle, ChevronLeft, 
    ChevronRight, Search, ArchiveRestore, RotateCcw, X, PackageCheck, FilterX, Receipt,
    MessageCircle, ArrowDown 
} from 'lucide-react';
import { CardStat, ModalConfirmacion } from '../components/Shared';
import { formatearFechaLocal, getFechaHoy } from '../utils/config';

// --- HELPER PARA FORMATEAR HORA ---
const formatearHora = (isoString) => {
    if (!isoString) return 'Reciente';
    return new Date(isoString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

// --- COMPONENTE MODAL PAPELERA (Sin cambios) ---
const ModalPapelera = ({ isOpen, onClose, pedidos, onRestaurar, onEliminar, onVaciar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [pedidoParaRestaurar, setPedidoParaRestaurar] = useState(null);
    const [pedidoParaEliminar, setPedidoParaEliminar] = useState(null);
    const [confirmarVaciar, setConfirmarVaciar] = useState(false);

    useEffect(() => { 
        if (isOpen) {
            setBusqueda(''); 
            setConfirmarVaciar(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const pedidosFiltrados = pedidos
        .filter(p => 
            p.estado === 'Cancelado' && 
            (p.cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
             p.folio.toLowerCase().includes(busqueda.toLowerCase()))
        )
        .sort((a, b) => {
            const fechaA = a.fechaCancelacion || '';
            const fechaB = b.fechaCancelacion || '';
            return fechaA.localeCompare(fechaB);
        });

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border-t-8 border-red-500">
                    <div className="p-6 bg-red-50 text-red-800 flex justify-between items-start border-b border-red-100">
                        <div>
                            <h3 className="font-bold text-2xl flex items-center mb-1">
                                <ArchiveRestore size={24} className="mr-2"/> Cancelados de Pastelería
                            </h3>
                            <p className="text-sm opacity-80">Los pedidos se eliminarán automáticamente al final del día.</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm text-gray-500"><X size={20}/></button>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" placeholder="BUSCAR..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none bg-gray-50 focus:bg-white transition-all uppercase" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                        {pedidos.length > 0 && (
                            <button onClick={() => setConfirmarVaciar(true)} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
                                <Trash2 size={18} /> Vaciar Todo
                            </button>
                        )}
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {pedidosFiltrados.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <Trash2 size={48} className="mx-auto mb-2 text-gray-300"/>
                                <p className="text-gray-500 font-medium">La papelera está vacía.</p>
                            </div>
                        ) : (
                            pedidosFiltrados.map((pedido) => (
                                <div key={pedido.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-100 text-red-700">CANCELADO</span>
                                            <span className="text-xs font-mono text-gray-400 font-bold">{pedido.folio}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-lg uppercase">{pedido.cliente}</h4>
                                        <div className="text-xs text-gray-500 mt-1">{pedido.tipoProducto} • {new Date(pedido.fechaEntrega).toLocaleDateString()}</div>
                                        <p className="text-[10px] text-red-600 mt-2 flex items-center gap-1.5 font-bold bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100">
                                            <Clock size={11}/> Cancelado a las {formatearHora(pedido.fechaCancelacion)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => setPedidoParaRestaurar(pedido)} className="flex-1 sm:flex-none px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition">
                                            <RotateCcw size={16}/> Restaurar
                                        </button>
                                        <button onClick={() => setPedidoParaEliminar(pedido)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition flex items-center justify-center" title="Eliminar definitivamente">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ModalConfirmacion isOpen={!!pedidoParaRestaurar} onClose={() => setPedidoParaRestaurar(null)} onConfirm={() => { if(pedidoParaRestaurar) { onRestaurar(pedidoParaRestaurar.folio); setPedidoParaRestaurar(null); onClose(); } }} titulo="¿Restaurar Pedido?" mensaje={`El pedido de ${pedidoParaRestaurar?.cliente} volverá a la lista de Pendientes.`} />
            <ModalConfirmacion isOpen={!!pedidoParaEliminar} onClose={() => setPedidoParaEliminar(null)} onConfirm={() => { if (pedidoParaEliminar) { onEliminar(pedidoParaEliminar.id); setPedidoParaEliminar(null); } }} titulo="¿Eliminar definitivamente?" mensaje="Esta acción no se puede deshacer. El pedido desaparecerá para siempre de la base de datos." />
            <ModalConfirmacion isOpen={confirmarVaciar} onClose={() => setConfirmarVaciar(false)} onConfirm={() => { onVaciar(); setConfirmarVaciar(false); }} titulo="¿Vaciar Papelera?" mensaje="Se eliminarán TODOS los pedidos cancelados de Pastelería. Esta acción es irreversible." />
        </>
    );
};

// --- MODAL ENTREGADOS (Sin cambios) ---
const ModalEntregados = ({ pedidosEntregados, onClose, onDeshacerEntrega }) => {
    const [busqueda, setBusqueda] = useState('');
    const [pedidoParaDeshacer, setPedidoParaDeshacer] = useState(null);

    const filtrados = pedidosEntregados
        .filter(p => p.cliente.toUpperCase().includes(busqueda) || (p.telefono && p.telefono.includes(busqueda)))
        .sort((a, b) => {
            const fechaA = a.fechaEntregaReal || '';
            const fechaB = b.fechaEntregaReal || '';
            return fechaA.localeCompare(fechaB);
        });

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border-t-8 border-green-500 flex flex-col max-h-[90vh]">
                    <div className="bg-green-50 p-4 flex justify-between items-center border-b border-green-100 shrink-0">
                        <div>
                            <h3 className="font-bold text-xl text-green-900 flex items-center gap-2"><PackageCheck size={24} className="text-green-600"/> Entregados</h3>
                            <p className="text-xs text-green-700 mt-1">Historial de entregas del día.</p>
                        </div>
                        <button onClick={onClose} className="bg-white p-2 rounded-full border hover:bg-gray-100"><X size={20}/></button>
                    </div>

                    <div className="p-4 bg-white border-b border-gray-100 shrink-0">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
                            <input type="text" placeholder="BUSCAR..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm uppercase bg-gray-50 focus:ring-2 focus:ring-green-500 focus:outline-none" value={busqueda} onChange={(e) => setBusqueda(e.target.value.toUpperCase())} />
                        </div>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                        {filtrados.length === 0 ? (
                            <div className="text-center py-12 text-gray-400"><CheckCircle size={48} className="mx-auto mb-3 opacity-20"/><p>{busqueda ? "No se encontraron coincidencias." : "No hay pedidos entregados aún."}</p></div>
                        ) : (
                            <div className="space-y-3">
                                {filtrados.map((p, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex justify-between items-center group hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Entregado</span>
                                                <span className="text-[10px] font-bold text-gray-400">{p.folio}</span>
                                            </div>
                                            <p className="font-bold text-gray-800">{p.cliente}</p>
                                            <p className="text-xs text-gray-500">{p.tipoProducto} • {formatearFechaLocal(p.fechaEntrega)}</p>
                                            <p className="text-[10px] text-green-700 mt-2 flex items-center gap-1.5 font-bold bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100">
                                                <Clock size={11}/> Entregado a las {formatearHora(p.fechaEntregaReal)}
                                            </p>
                                        </div>
                                        <button onClick={() => setPedidoParaDeshacer(p)} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors border border-yellow-200" title="Regresar a Pendientes">
                                            <RotateCcw size={16}/> Deshacer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ModalConfirmacion isOpen={!!pedidoParaDeshacer} onClose={() => setPedidoParaDeshacer(null)} onConfirm={() => { if (pedidoParaDeshacer) { onDeshacerEntrega(pedidoParaDeshacer.folio); setPedidoParaDeshacer(null); onClose(); } }} titulo="¿Deshacer Entrega?" mensaje={pedidoParaDeshacer ? `El pedido de ${pedidoParaDeshacer.cliente} volverá a estar activo en la lista de pendientes.` : ''} tipo="eliminar" />
        </>
    );
};

// --- MODAL CORTE DE CAJA (Sin cambios) ---
const ModalCorteCaja = ({ pedidosDelDia, totalCaja, onClose }) => {
    const ingresos = pedidosDelDia.filter(p => p.pagosRealizados > 0 && p.estado !== 'Cancelado');
    const ingresosOrdenados = [...ingresos].sort((a, b) => {
        const horaA = a.horaPago || '00:00';
        const horaB = b.horaPago || '00:00';
        return horaA.localeCompare(horaB);
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border-t-8 border-pink-500 flex flex-col max-h-[90vh]">
                <div className="bg-pink-50 p-4 flex justify-between items-center border-b border-pink-100 shrink-0">
                    <div><h3 className="font-bold text-xl text-pink-900 flex items-center gap-2"><Receipt size={24} className="text-pink-600"/> Corte de Caja</h3><p className="text-xs text-pink-700 mt-1">Ingresos registrados hoy.</p></div>
                    <button onClick={onClose} className="bg-white p-2 rounded-full border hover:bg-gray-100"><X size={20}/></button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                    {ingresosOrdenados.length === 0 ? (
                        <div className="text-center py-12 text-gray-400"><DollarSign size={48} className="mx-auto mb-3 opacity-20"/><p>No hay ingresos registrados hoy.</p></div>
                    ) : (
                        <div className="space-y-3">
                            {ingresosOrdenados.map((p, i) => {
                                const montoIngresado = (p.total / p.numPagos) * p.pagosRealizados;
                                const esLiquidado = p.pagosRealizados === p.numPagos;
                                const esPagoUnico = p.numPagos === 1;
                                return (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{p.folio || p.id}</p>
                                            <p className="text-xs text-gray-500 uppercase">{p.cliente}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${esLiquidado ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {esPagoUnico ? 'PAGO ÚNICO' : esLiquidado ? 'LIQUIDADO' : `ABONO (${p.pagosRealizados}/${p.numPagos})`}
                                                </span>
                                                {p.horaPago && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10}/> {p.horaPago}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right"><span className="block font-bold text-pink-600 text-lg">+${montoIngresado.toFixed(2)}</span></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="bg-pink-900 p-4 text-white flex justify-between items-center shrink-0"><span className="font-bold text-pink-200 uppercase tracking-wider text-sm">Total Recaudado</span><span className="font-bold text-3xl">${totalCaja.toFixed(2)}</span></div>
            </div>
        </div>
    );
};

// --- VISTA: INICIO (DASHBOARD) ---
export const VistaInicioPasteleria = ({ pedidos, onEditar, onIniciarEntrega, onVerDetalles, onCancelar, onRestaurar, onDeshacerEntrega, onVaciarPapelera, onEliminarDePapelera }) => {
    const [busqueda, setBusqueda] = useState('');
    const [fechaFiltro, setFechaFiltro] = useState(''); 
    const [mostrarPapelera, setMostrarPapelera] = useState(false);
    const [mostrarEntregados, setMostrarEntregados] = useState(false);
    const [mostrarCajaHoy, setMostrarCajaHoy] = useState(false);

    // REFERENCIA PARA EL SCROLL AUTOMÁTICO
    const atrasadosRef = useRef(null); 

    const pedidosPendientes = useMemo(() => pedidos.filter(p => p.estado === 'Pendiente'), [pedidos]);
    const pedidosCancelados = useMemo(() => pedidos.filter(p => p.estado === 'Cancelado'), [pedidos]);

    // --- CÁLCULO DE LÍMITES INTELIGENTES ---
    const rangoFechasActivas = useMemo(() => {
        const pendientesConFecha = pedidosPendientes.filter(p => p.fechaEntrega);
        if (pendientesConFecha.length === 0) return { min: '', max: '' };
        const fechasOrdenadas = pendientesConFecha.map(p => p.fechaEntrega).sort();
        return {
            min: fechasOrdenadas[0], 
            max: fechasOrdenadas[fechasOrdenadas.length - 1] 
        };
    }, [pedidosPendientes]);

    const pedidosEntregadosHoy = useMemo(() => {
        const hoy = new Date();
        return pedidos.filter(p => {
            if (p.estado !== 'Entregado') return false;
            if (p.fechaEntregaReal) {
                const fechaReal = new Date(p.fechaEntregaReal);
                return fechaReal.getDate() === hoy.getDate() &&
                       fechaReal.getMonth() === hoy.getMonth() &&
                       fechaReal.getFullYear() === hoy.getFullYear();
            }
            return p.fechaEntrega === getFechaHoy();
        });
    }, [pedidos]);

    const entregadosHoyCount = pedidosEntregadosHoy.length;

    // --- SEMÁFORO DE OPERACIONES ---
    const semaforoProduccion = useMemo(() => {
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const sHoy = fmt(hoy);
        const sManana = fmt(manana);
        const pendientesHoy = pedidos.filter(p => p.fechaEntrega === sHoy && p.estado === 'Pendiente').length;
        const cargaManana = pedidos.filter(p => p.fechaEntrega === sManana && p.estado !== 'Cancelado').length;
        return { hoy: pendientesHoy, manana: cargaManana };
    }, [pedidos]);

    // --- FILTRADO Y ORDENAMIENTO ---
    const pedidosFiltrados = useMemo(() => {
        const hoyStr = getFechaHoy(); 
        let procesados = [...pedidosPendientes].sort((a, b) => {
            const esPasadoA = a.fechaEntrega < hoyStr;
            const esPasadoB = b.fechaEntrega < hoyStr;
            if (esPasadoA && !esPasadoB) return 1;
            if (!esPasadoA && esPasadoB) return -1;
            const fechaA = new Date(a.fechaEntrega);
            const fechaB = new Date(b.fechaEntrega);
            const diffFechas = fechaA - fechaB;
            if (diffFechas !== 0) return diffFechas;
            const horaA = a.horaEntrega || '23:59';
            const horaB = b.horaEntrega || '23:59';
            return horaA.localeCompare(horaB);
        });

        if (fechaFiltro) { procesados = procesados.filter(p => p.fechaEntrega === fechaFiltro); }
        if (busqueda) { const texto = busqueda; procesados = procesados.filter(p => p.cliente.toUpperCase().includes(texto) || p.telefono.includes(texto)); }
        
        return procesados;
    }, [pedidosPendientes, busqueda, fechaFiltro]);

    // Detectar si hay atrasados para mostrar el botón
    const hayAtrasadosVisibles = useMemo(() => {
        const hoyStr = getFechaHoy();
        return pedidosFiltrados.some(p => p.fechaEntrega && p.fechaEntrega < hoyStr);
    }, [pedidosFiltrados]);

    const pedidosCajaHoy = useMemo(() => { const hoy = getFechaHoy(); return pedidos.filter(p => p.estado !== 'Cancelado' && p.fecha === hoy); }, [pedidos]);
    const totalCajaHoy = useMemo(() => { return pedidosCajaHoy.reduce((acc, p) => acc + (p.pagosRealizados ? (p.total / p.numPagos) * p.pagosRealizados : 0), 0); }, [pedidosCajaHoy]);

    const enviarComandaWhatsApp = (pedido) => {
        if (!pedido.telefono || pedido.telefono.length < 10) { 
            alert("El cliente no tiene un número válido."); 
            return; 
        }
        
        const tel = pedido.telefono.replace(/\D/g, ''); 
        const total = parseFloat(pedido.total) || 0;
        const numPagos = parseInt(pedido.numPagos) || 1;
        const pagosHechos = parseFloat(pedido.pagosRealizados || 0);
        const abonado = (numPagos > 0 ? total / numPagos : 0) * pagosHechos;
        const resta = total - abonado;

        // --- DICCIONARIO DE EMOJIS SEGUROS (UNICODE) ---
        const e = {
            pastel: '\uD83C\uDF70',   // 🍰
            hola: '\uD83D\uDC4B',     // 👋
            folio: '\uD83D\uDCC4',    // 📄
            prod: '\uD83C\uDF82',     // 🎂
            cal: '\uD83D\uDCC5',      // 📅
            reloj: '\u23F0',          // ⏰
            nota: '\uD83D\uDCDD',     // 📝
            bolsa: '\uD83D\uDCB0',    // 💰
            billete: '\uD83D\uDCB5',  // 💵
            tarjeta: '\uD83D\uDCB3',  // 💳
            alerta: '\u2757',         // ❗
            check: '\u2705',          // ✅
            warn: '\u26A0\uFE0F',     // ⚠️
            punto: '\uD83D\uDD39',    // 🔹
            brillo: '\u2728',         // ✨
            pin: '\uD83D\uDCCD',      // 📍
            mapa: '\uD83D\uDDFA\uFE0F' // 🗺️
        };

        // --- CONSTRUCCIÓN DEL MENSAJE ---
        let txt = `${e.pastel} *PASTELERÍA LyA - COMANDA DIGITAL* ${e.pastel}\n\n`;
        txt += `Hola *${pedido.cliente.toUpperCase()}* ${e.hola}, este es el resumen de tu pedido:\n\n`;
        
        // 1. DETALLES
        txt += `${e.folio} *FOLIO:* ${pedido.folio}\n`;
        txt += `${e.prod} *PRODUCTO:* ${pedido.tipoProducto}\n`;
        txt += `${e.cal} *ENTREGA:* ${formatearFechaLocal(pedido.fechaEntrega)}\n`;
        
        if (pedido.horaEntrega) {
            txt += `${e.reloj} *HORA:* ${pedido.horaEntrega} hrs\n`;
        }
        
        txt += `${e.nota} *DETALLES:* ${pedido.detalles || 'Ninguno'}\n\n`;

        // 2. FINANZAS
        txt += `${e.bolsa} *ESTADO DE CUENTA* ${e.bolsa}\n`;
        txt += `--------------------------------\n`;
        txt += `${e.billete} *TOTAL A PAGAR:* $${total.toFixed(2)}\n`;

        if (numPagos > 1) { 
            txt += `${e.tarjeta} *ABONADO:* $${abonado.toFixed(2)} (${pagosHechos}/${numPagos} pagos)\n`; 
            
            if (resta > 0.5) {
                txt += `${e.alerta} *RESTA:* $${resta.toFixed(2)}\n`;
            } else {
                txt += `${e.check} *LIQUIDADO* (Pagado al 100%)\n`;
            }
        } else { 
            txt += `${e.punto} *ESTADO:* ${pagosHechos >= 1 ? `${e.check} PAGADO` : `${e.warn} PENDIENTE DE PAGO`}\n`; 
        }
        
        txt += `--------------------------------\n\n`;

        // 3. UBICACIÓN (ACTUALIZADA)
        txt += `${e.pin} *UBICACIÓN:* Segunda Calle Ote. Nte., Nuevo Mexico, 30540 Pijijiapan, Chis.\n`;
        txt += `${e.mapa} *VER MAPA:* https://maps.app.goo.gl/eRH7dffC6PMpKWh47?g_st=ac\n\n`;

        // 4. DESPEDIDA
        txt += `${e.brillo} *¡Gracias por tu preferencia!* ${e.brillo}`;

        window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(txt)}`, '_blank');
    };

    // FUNCIÓN PARA IR A LOS ATRASADOS
    const irAAtrasados = () => {
        if (atrasadosRef.current) {
            atrasadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="p-4 md:p-8 relative min-h-screen">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Pedidos de la Pastelería</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {/* Pendientes */}
                <div onClick={() => { setBusqueda(''); setFechaFiltro(''); }} className="p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 bg-white flex justify-between items-center cursor-pointer hover:bg-yellow-50 transition-colors group" title="Limpiar filtros">
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Pendientes</p><p className="text-3xl font-bold text-gray-800 mt-2">{pedidosPendientes.length}</p></div>
                    <div className="text-yellow-300 opacity-50 group-hover:text-yellow-500 group-hover:opacity-100 transition">{(busqueda || fechaFiltro) ? <FilterX size={30} /> : <Clock size={30}/>}</div>
                </div>
                {/* Entregados Hoy */}
                <div onClick={() => setMostrarEntregados(true)} className="p-6 rounded-xl shadow-sm border-l-4 border-green-500 bg-white flex justify-between items-center cursor-pointer hover:bg-green-50 transition-colors group">
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Entregados Hoy</p><p className="text-3xl font-bold text-gray-800 mt-2">{entregadosHoyCount}</p></div>
                    <div className="text-green-300 opacity-50 group-hover:text-green-500 group-hover:opacity-100 transition"><PackageCheck size={30}/></div>
                </div>
                {/* Cancelados */}
                <div onClick={() => setMostrarPapelera(true)} className="p-6 rounded-xl shadow-sm border-l-4 border-red-500 bg-white flex justify-between items-center cursor-pointer hover:bg-red-50 transition-colors group">
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Papelera</p><p className="text-3xl font-bold text-gray-800 mt-2">{pedidosCancelados.length}</p></div>
                    <div className="text-red-300 opacity-50 group-hover:text-red-500 group-hover:opacity-100 transition"><ArchiveRestore size={30}/></div>
                </div>
                {/* Total Caja */}
                <div onClick={() => setMostrarCajaHoy(true)} className="p-6 rounded-xl shadow-sm border-l-4 border-pink-500 bg-white flex justify-between items-center cursor-pointer hover:bg-pink-50 transition-colors group">
                    <div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Total Caja Hoy</p><p className="text-3xl font-bold text-gray-800 mt-2">${totalCajaHoy.toFixed(0)}</p></div>
                    <div className="text-pink-300 opacity-50 group-hover:text-pink-500 group-hover:opacity-100 transition"><DollarSign size={30}/></div>
                </div>
            </div>

            {/* SEMÁFORO DE OPERACIONES */}
            <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-center shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10 mb-4 sm:mb-0">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600 shadow-sm"><Cake size={28} /></div>
                    <div><h3 className="font-bold text-blue-900 text-lg">Semáforo de Cocina</h3><p className="text-sm text-blue-700 opacity-80">Monitor de carga de trabajo inmediata.</p></div>
                </div>
                <div className="flex gap-8 relative z-10 text-center">
                    <div><p className={`text-3xl font-bold ${semaforoProduccion.hoy > 0 ? 'text-orange-600' : 'text-green-600'}`}>{semaforoProduccion.hoy}</p><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Pendientes Hoy</p></div>
                    <div className="w-px bg-blue-200"></div>
                    <div><p className="text-3xl font-bold text-blue-800">{semaforoProduccion.manana}</p><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Para Mañana</p></div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-blue-100/20 skew-x-12 transform translate-x-10"></div>
            </div>

            {/* FILTROS Y BÚSQUEDA */}
            <div className="flex flex-col md:flex-row justify-end mb-4 gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 w-full md:w-auto min-w-[200px]">
                    <div className="bg-pink-50 p-2 rounded-lg text-pink-500"><CalendarDays size={20} /></div>
                    <div className="flex flex-col flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Filtrar Fecha</label>
                        <input type="date" value={fechaFiltro} min={rangoFechasActivas.min} max={rangoFechasActivas.max} onChange={(e) => setFechaFiltro(e.target.value)} className="font-bold text-gray-700 text-sm bg-transparent outline-none cursor-pointer focus:text-pink-600 transition-colors w-full" />
                    </div>
                    {fechaFiltro && (<button onClick={() => setFechaFiltro('')} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition whitespace-nowrap flex items-center gap-1" title="Borrar Filtro"><X size={12} /></button>)}
                </div>
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
                    <input type="text" placeholder="BUSCAR POR NOMBRE O TELÉFONO..." className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm transition-all uppercase text-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value.toUpperCase())} />
                    {busqueda && (<button onClick={() => setBusqueda('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"><X size={16} /></button>)}
                </div>
            </div>

            {/* TABLA DE PEDIDOS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead><tr className="bg-pink-50 text-pink-800 text-sm"><th className="p-4">Folio</th><th className="p-4">Cliente</th><th className="p-4">Entrega</th><th className="p-4">Total</th><th className="p-4">Pagos</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr></thead>
                        <tbody>
                            {pedidosFiltrados.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">{busqueda || fechaFiltro ? "No se encontraron coincidencias con los filtros actuales." : "No hay pedidos pendientes. ¡Buen trabajo!"}</td></tr>
                            ) : (
                                pedidosFiltrados.map((p, i) => {
                                    const fechaHoy = getFechaHoy();
                                    const esVencido = p.fechaEntrega && p.fechaEntrega < fechaHoy;
                                    const esHoy = p.fechaEntrega === fechaHoy;

                                    let claseFila = "border-b cursor-pointer transition-colors ";
                                    if (esVencido) claseFila += "bg-red-100 hover:bg-red-200"; 
                                    else if (esHoy) claseFila += "bg-orange-100 hover:bg-orange-200"; 
                                    else claseFila += "hover:bg-gray-50"; 

                                    // Lógica del Separador
                                    const pedidoAnterior = i > 0 ? pedidosFiltrados[i - 1] : null;
                                    const anteriorEraVencido = pedidoAnterior && pedidoAnterior.fechaEntrega < fechaHoy;
                                    const mostrarSeparador = esVencido && (!pedidoAnterior || !anteriorEraVencido);

                                    return (
                                        <React.Fragment key={i}>
                                            {mostrarSeparador && (
                                                <tr ref={atrasadosRef} className="scroll-mt-32"> {/* <--- REF AGREGADA AQUÍ PARA EL SCROLL */}
                                                    <td colSpan="7" className="bg-red-50 text-red-500 font-bold text-center text-xs uppercase py-2 tracking-widest border-y border-red-200 shadow-inner">
                                                        🔻 Pedidos Atrasados / No Recogidos 🔻
                                                    </td>
                                                </tr>
                                            )}
                                            <tr onClick={() => onVerDetalles(p)} className={claseFila}>
                                                <td className="p-4 font-mono font-bold text-gray-600">{p.folio}</td>
                                                <td className="p-4">
                                                    <div className="font-bold uppercase text-gray-800">{p.cliente}</div>
                                                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5"><Phone size={10} /> <span>{p.telefono || 'Sin número'}</span></div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{p.tipoProducto || 'Pastel'}</div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-600">{formatearFechaLocal(p.fechaEntrega)}<br/><span className="text-xs text-gray-400">{p.horaEntrega ? `${p.horaEntrega} hrs` : ''}</span></td>
                                                <td className="p-4 font-bold text-green-600">${p.total}</td>
                                                <td className="p-4 text-sm text-gray-500"><span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">{p.pagosRealizados || 0}/{p.numPagos}</span></td>
                                                <td className="p-4"><button onClick={(e) => { e.stopPropagation(); onIniciarEntrega(p.folio); }} className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center w-fit gap-1 transition-all bg-yellow-100 text-yellow-800 hover:bg-green-100 hover:text-green-800 border border-yellow-200 hover:scale-105" title="Marcar como Entregado"><Clock size={12} /> Pendiente</button></td>
                                                <td className="p-4 flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); enviarComandaWhatsApp(p); }} className="p-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 border border-green-200 transition-colors"><MessageCircle size={18} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onVerDetalles(p); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><Eye size={18} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onEditar(p); }} className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600"><Edit size={18} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onCancelar(p.folio); }} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- BOTÓN FLOTANTE PARA ATRASADOS (NUEVO) --- */}
            {hayAtrasadosVisibles && (
                <button 
                    onClick={irAAtrasados}
                    className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 font-bold border-4 border-white transition-all transform hover:scale-105"
                >
                    <AlertCircle size={20} />
                    Ver Atrasados 👇
                </button>
            )}

            <ModalPapelera isOpen={mostrarPapelera} pedidos={pedidosCancelados} onClose={() => setMostrarPapelera(false)} onRestaurar={(folio) => { onRestaurar(folio); setMostrarPapelera(false); }} onVaciar={onVaciarPapelera} onEliminar={onEliminarDePapelera} />
            {mostrarEntregados && <ModalEntregados pedidosEntregados={pedidosEntregadosHoy} onClose={() => setMostrarEntregados(false)} onDeshacerEntrega={(folio) => { onDeshacerEntrega(folio); }} />}
            {mostrarCajaHoy && <ModalCorteCaja pedidosDelDia={pedidosCajaHoy} totalCaja={totalCajaHoy} onClose={() => setMostrarCajaHoy(false)} />}
        </div>
    );
};

// --- VISTA: NUEVO PEDIDO ---
export const VistaNuevoPedido = ({ pedidos, onGuardarPedido, generarFolio, pedidoAEditar, mostrarNotificacion, fechaPreseleccionada }) => {
    const [formulario, setFormulario] = useState({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '', horaEntrega: '' });
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Pastel');
    const [otroTexto, setOtroTexto] = useState('');
    const fechaHoy = new Date();
    const fechaMinima = `${fechaHoy.getFullYear()}-${String(fechaHoy.getMonth() + 1).padStart(2, '0')}-${String(fechaHoy.getDate()).padStart(2, '0')}`;
    
    useEffect(() => {
        if (pedidoAEditar) {
            setFormulario({ ...pedidoAEditar, horaEntrega: pedidoAEditar.horaEntrega || '' });
            const esEstandar = ['Pastel', 'Cheesecake', 'Rosca'].includes(pedidoAEditar.tipoProducto);
            if (esEstandar) setCategoriaSeleccionada(pedidoAEditar.tipoProducto);
            else { setCategoriaSeleccionada('Otro'); setOtroTexto(pedidoAEditar.tipoProducto || ''); }
        } else {
            setFormulario({ 
                folio: '', 
                cliente: '', 
                telefono: '', 
                tipoProducto: 'Pastel', 
                detalles: '', 
                total: '', 
                numPagos: 1, 
                fechaEntrega: fechaPreseleccionada || '', 
                horaEntrega: '' 
            });
            setCategoriaSeleccionada('Pastel'); setOtroTexto('');
        }
    }, [pedidoAEditar, fechaPreseleccionada]);

    useEffect(() => {
        if (categoriaSeleccionada === 'Otro') setFormulario(prev => ({ ...prev, tipoProducto: otroTexto }));
        else setFormulario(prev => ({ ...prev, tipoProducto: categoriaSeleccionada }));
    }, [categoriaSeleccionada, otroTexto]);

    // --- CORRECCIÓN EN LA FUNCIÓN manejarSubmit ---
const manejarSubmit = (e) => {
    e.preventDefault();
    
    // --- Validaciones ---
    if (formulario.telefono.length !== 10) { 
        mostrarNotificacion("El teléfono debe tener 10 dígitos.", "error"); 
        return; 
    }
    if (formulario.cliente.trim().length < 3) { 
        mostrarNotificacion("Nombre muy corto.", "error"); 
        return; 
    }
    if (categoriaSeleccionada === 'Otro' && otroTexto.trim() === '') { 
        mostrarNotificacion("Especifica qué producto es.", "error"); 
        return; 
    }
    
    const folioFinal = pedidoAEditar ? formulario.folio : generarFolio();
    
    // --- LÓGICA CORREGIDA PARA PAGOS ---
    let pagosRealizadosFinal = 0;

    if (pedidoAEditar) {
        // 1. Recuperamos el dinero REAL que había pagado el cliente
        const totalAnterior = parseFloat(pedidoAEditar.total) || 0;
        const numPagosAnterior = parseInt(pedidoAEditar.numPagos) || 1;
        const pagosMarcadosAnteriormente = parseFloat(pedidoAEditar.pagosRealizados) || 0;
        
        // Dinero realmente pagado con el precio anterior
        const dineroYaPagado = (totalAnterior / numPagosAnterior) * pagosMarcadosAnteriormente;

        // 2. Calculamos el nuevo costo por pago
        const totalNuevo = parseFloat(formulario.total) || 0;
        const numPagosNuevo = parseInt(formulario.numPagos) || 1;
        
        if (totalNuevo > 0 && numPagosNuevo > 0) {
            const costoPorPagoNuevo = totalNuevo / numPagosNuevo;
            
            // 3. Calculamos cuántos pagos del NUEVO sistema equivalen al dinero pagado
            pagosRealizadosFinal = dineroYaPagado / costoPorPagoNuevo;

            // Redondeamos hacia abajo (si pagó 1.5 pagos, solo cuenta como 1 pago completo)
            // Pero también debemos considerar pagos parciales si el negocio lo requiere
            if (pagosRealizadosFinal >= 0) {
                // Mantener hasta 2 decimales para visualización
                pagosRealizadosFinal = Math.floor(pagosRealizadosFinal * 100) / 100;
            }
            
            // Si el dinero pagado supera el nuevo total, limitamos a los pagos completos
            if (pagosRealizadosFinal > numPagosNuevo) {
                pagosRealizadosFinal = numPagosNuevo;
            }
        }
    } else {
        // Para pedidos nuevos, comenzamos con 0 pagos
        pagosRealizadosFinal = 0;
    }
    
    // Asegurarnos de que no sea negativo
    pagosRealizadosFinal = Math.max(0, pagosRealizadosFinal);
    
    onGuardarPedido({
        ...formulario,
        folio: folioFinal,
        total: parseFloat(formulario.total) || 0,
        numPagos: parseInt(formulario.numPagos) || 1,
        // ¡CORRECCIÓN CRÍTICA! Usamos pagosRealizadosFinal en lugar de pedidoAEditar.pagosRealizados
        pagosRealizados: pedidoAEditar ? pagosRealizadosFinal : 0,
        fecha: pedidoAEditar ? pedidoAEditar.fecha : getFechaHoy(),
        estado: pedidoAEditar ? pedidoAEditar.estado : 'Pendiente',
        origen: 'Pastelería'
    });
    
    if (!pedidoAEditar) {
        setFormulario({ 
            folio: '', 
            cliente: '', 
            telefono: '', 
            tipoProducto: 'Pastel', 
            detalles: '', 
            total: '', 
            numPagos: 1, 
            fechaEntrega: '', 
            horaEntrega: '' 
        });
        setCategoriaSeleccionada('Pastel'); 
        setOtroTexto('');
    }
};

    const montoPorPago = formulario.total && formulario.numPagos > 0 ? (parseFloat(formulario.total) / parseInt(formulario.numPagos)).toFixed(2) : '0.00';

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl md:text-3xl font-bold text-pink-900">{pedidoAEditar ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                {pedidoAEditar && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">{pedidoAEditar.folio}</span>}
            </div>
            <form onSubmit={manejarSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-pink-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700"><User size={16} className="mr-2 text-pink-500" /> Cliente</label>
                        <input required type="text" placeholder="EJ. MARÍA PÉREZ" className="w-full p-3 border rounded-lg uppercase" value={formulario.cliente} onChange={e => { const val = e.target.value.toUpperCase(); if (/^[A-Z\sÑÁÉÍÓÚ]*$/.test(val)) setFormulario({ ...formulario, cliente: val }); }} />
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
                            <input required type="date" min={fechaMinima} className="w-full p-3 border rounded-lg" value={formulario.fechaEntrega} onChange={e => setFormulario({ ...formulario,fechaEntrega: e.target.value })} />
                        </div>
                        <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><Clock size={16} className="mr-2 text-pink-500" /> Hora Entrega</label><input type="time" className="w-full p-3 border rounded-lg" value={formulario.horaEntrega} onChange={e => setFormulario({ ...formulario, horaEntrega: e.target.value })} /></div>
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

// --- VISTA: CALENDARIO (CORREGIDA PARA MÓVILES) ---
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

    const cambiarMes = (delta) => { const nueva = new Date(fechaVisual); nueva.setMonth(nueva.getMonth() + delta); if (nueva < new Date(2025, 11, 1)) return; setFechaVisual(nueva); };
    const handleBuscarDia = (e) => { const fechaStr = e.target.value; setFechaBusqueda(fechaStr); if(fechaStr) { const [y, m] = fechaStr.split('-').map(Number); if (new Date(y, m - 1, 1) >= new Date(2025, 11, 1)) { setFechaVisual(new Date(y, m - 1, 1)); } onSeleccionarDia(fechaStr); } };

    const getPedidosDelDia = (dia) => { if (!dia) return []; const fechaString = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`; return pedidos.filter(p => p.fechaEntrega === fechaString && p.estado !== 'Cancelado').sort((a, b) => (a.horaEntrega || '00:00').localeCompare(b.horaEntrega || '00:00')); };
    
    // Formatear mes actual para mostrarlo bonito
    const mesFormateado = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(fechaVisual);

    return (
        <div className="p-4 md:p-8 h-screen flex flex-col">
            {/* CABECERA CORREGIDA PARA MÓVIL */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <CalendarDays size={32} className="text-pink-600"/> Agenda
                </h2>
                
                {/* Contenedor de controles apilados en móvil y alineados en PC */}
                <div className="flex flex-col w-full md:w-auto gap-3 items-end">
                    
                    {/* Selector de Mes - Ancho completo en móvil para evitar desbordes */}
                    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-pink-100 p-1 w-full md:w-64">
                        <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-pink-50 rounded-lg text-gray-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        
                        {/* Texto del mes centrado y capitalizado */}
                        <span className="font-bold text-gray-700 capitalize text-lg truncate px-2 select-none">
                            {mesFormateado}
                        </span>

                        <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-pink-50 rounded-lg text-gray-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Buscador de fecha - Ancho igual al de arriba */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400"/>
                        </div>
                        <input 
                            type="date" 
                            value={fechaBusqueda} 
                            min="2025-12-01" 
                            onChange={handleBuscarDia} 
                            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm w-full" 
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 bg-pink-50 border-b border-pink-100">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (<div key={d} className="py-3 text-center text-xs md:text-sm font-bold text-pink-800 uppercase tracking-wider">{d}</div>))}</div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {dias.map((dia, idx) => {
                        const pedidosDia = getPedidosDelDia(dia); const tienePedidos = pedidosDia.length > 0;
                        return (
                            <div key={idx} className={`border-b border-r border-gray-100 p-1 md:p-2 min-h-[80px] md:min-h-[100px] relative transition-colors hover:bg-gray-50 ${!dia ? 'bg-gray-50/30' : 'cursor-pointer'}`} onClick={() => { if (dia) onSeleccionarDia(`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`); }}>
                                {dia && (<><span className={`text-xs md:text-sm font-bold mb-1 block ${tienePedidos ? 'text-pink-600' : 'text-gray-400'}`}>{dia}</span><div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] custom-scrollbar">{pedidosDia.map((p, i) => (<div key={i} className="text-[9px] md:text-[10px] bg-pink-100 text-pink-800 px-1 py-0.5 rounded border border-pink-200 truncate font-medium flex justify-between gap-1"><span>{p.tipoProducto}</span>{p.horaEntrega && <span className="text-pink-500 hidden md:inline">{p.horaEntrega}</span>}</div>))}{tienePedidos && pedidosDia.length > 3 && (<div className="text-[8px] text-gray-400 text-center font-bold">+ {pedidosDia.length - 3} más</div>)}</div></>)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};