import React, { useState } from 'react';
import { 
    LayoutDashboard, BarChart3, Coffee, Cake, PlusCircle, Grid, UtensilsCrossed, ArrowLeft, PanelLeftClose, 
    AlertCircle, CheckCircle, X, Trash2, ShoppingBag, CalendarDays, Calculator, Eye, Calendar as CalendarIcon, Printer, FileText
} from 'lucide-react';
import { formatearFechaLocal, imprimirTicket } from '../utils/config';

export const Notificacion = ({ data, onClose }) => {
    if (!data.visible) return null;
    const estilos = {
        exito: "bg-green-600 border-green-700 text-white",
        error: "bg-red-500 border-red-600 text-white",
        info: "bg-blue-600 border-blue-700 text-white"
    };
    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-b-4 animate-bounce-in transition-all duration-300 ${estilos[data.tipo] || estilos.info}`}>
            {data.tipo === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            <span className="font-semibold text-sm md:text-base">{data.mensaje}</span>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity"><X size={18} /></button>
        </div>
    );
};

export const CardStat = ({ titulo, valor, color, icon }) => (
    <div className={`p-6 rounded-xl shadow-sm border-l-4 ${color.split(' ')[0].replace('bg-', 'border-')} bg-white flex justify-between items-center`}>
        <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">{titulo}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{valor}</p>
        </div>
        {icon && <div className="text-gray-300 opacity-50">{icon}</div>}
    </div>
);

const BotonNav = ({ icon, label, active, onClick, colorTheme = "pink" }) => {
    const activeClass = colorTheme === "orange" ? "bg-orange-600 text-white shadow-md" : "bg-pink-700 text-white shadow-md";
    const hoverClass = colorTheme === "orange" ? "hover:bg-orange-700 text-orange-100" : "hover:bg-pink-800 text-pink-100";
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? activeClass : hoverClass}`}>
            {icon} <span className="font-medium whitespace-nowrap">{label}</span>
        </button>
    );
};

export const Sidebar = ({ modo, vistaActual, setVistaActual, setModo, isOpen, toggleSidebar }) => {
    const esCafeteria = modo === 'cafeteria';
    const colorBg = esCafeteria ? "bg-orange-900" : "bg-pink-900";
    const colorText = esCafeteria ? "text-orange-200" : "text-pink-200";

    return (
        <div className={`${isOpen ? 'w-64 p-4' : 'w-0 p-0'} ${colorBg} text-white min-h-screen flex flex-col shadow-2xl transition-all duration-300 overflow-hidden relative`}>
            {isOpen && <button onClick={toggleSidebar} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition"><PanelLeftClose size={20} /></button>}
            <div className="mb-8 text-center mt-6">
                {/* LOGO PERSONALIZADO LyA */}
                <h1 className="text-5xl font-bold text-white whitespace-nowrap mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>LyA</h1>
                <p className={`text-xs ${colorText} uppercase tracking-widest mt-1 whitespace-nowrap`}>{modo === 'admin' ? 'Administración' : modo === 'pasteleria' ? 'Modo Pastelería' : 'Modo Cafetería'}</p>
            </div>
            <nav className="space-y-2 flex-1">
                {modo === 'admin' && (
                    <>
                        <BotonNav icon={<LayoutDashboard size={20} />} label="Inicio Admin" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} />
                        <BotonNav icon={<BarChart3 size={20} />} label="Reporte Comparativo" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} />
                        <div className="my-6 border-t border-pink-700"></div>
                        <p className="text-xs text-pink-400 uppercase font-bold mb-2 pl-3 whitespace-nowrap">Accesos Rápidos</p>
                        <button onClick={() => { setModo('pasteleria'); setVistaActual('inicio'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 text-pink-100 transition whitespace-nowrap"><Cake size={20} /><span>Ir a Pastelería</span></button>
                        <button onClick={() => { setModo('cafeteria'); setVistaActual('inicio'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 text-pink-100 transition whitespace-nowrap"><Coffee size={20} /><span>Ir a Cafetería</span></button>
                    </>
                )}
                {modo === 'pasteleria' && (
                    <>
                        <BotonNav icon={<LayoutDashboard size={20} />} label="Inicio" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} />
                        <BotonNav icon={<PlusCircle size={20} />} label="Nuevo Pedido" active={vistaActual === 'pedidos'} onClick={() => setVistaActual('pedidos')} />
                        <BotonNav icon={<BarChart3 size={20} />} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} />
                    </>
                )}
                {modo === 'cafeteria' && (
                    <>
                        <BotonNav icon={<LayoutDashboard size={20} />} label="Inicio" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} colorTheme="orange" />
                        <BotonNav icon={<Grid size={20} />} label="Punto de Venta (QR)" active={vistaActual === 'mesas'} onClick={() => setVistaActual('mesas')} colorTheme="orange" />
                        <BotonNav icon={<UtensilsCrossed size={20} />} label="Menú y Productos" active={vistaActual === 'menu'} onClick={() => setVistaActual('menu')} colorTheme="orange" />
                        <BotonNav icon={<BarChart3 size={20} />} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} colorTheme="orange" />
                    </>
                )}
            </nav>
            {modo !== 'admin' && <button onClick={() => { setModo('admin'); setVistaActual('inicio'); }} className="mt-4 flex items-center justify-center space-x-2 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm whitespace-nowrap"><ArrowLeft size={16} /><span>Volver al Admin</span></button>}
        </div>
    );
};

export const ModalConfirmacion = ({ isOpen, onClose, onConfirm, titulo = "¿Estás seguro?", mensaje = "Esta acción no se puede deshacer." }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[250] p-4 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-in transform border-t-8 border-red-500">
                <div className="p-6 text-center">
                    <Trash2 size={32} className="text-red-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{titulo}</h3>
                    <p className="text-gray-500 mb-6 text-sm">{mensaje}</p>
                    <div className="flex space-x-3 justify-center">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg hover:shadow-xl transition transform active:scale-95">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ModalDetalles = ({ pedido, cerrar, onRegistrarPago }) => {
    if (!pedido) return null;
    const numPagos = pedido.numPagos ? parseInt(pedido.numPagos) : 1;
    const esPagoUnico = numPagos === 1;

    const [montoRecibido, setMontoRecibido] = useState('');
    const [esLiquidacion, setEsLiquidacion] = useState(esPagoUnico);

    const montoTotal = parseFloat(pedido.total);
    const pagosRealizados = pedido.pagosRealizados || (pedido.origen === 'Cafetería' ? 1 : 0);
    const montoPorPago = (montoTotal / numPagos);
    const pagosRestantes = numPagos - pagosRealizados;
    const saldoPendiente = (montoTotal - (montoPorPago * pagosRealizados));
    const montoACobrar = esLiquidacion ? saldoPendiente : montoPorPago;
    const cambio = montoRecibido ? (parseFloat(montoRecibido) - montoACobrar) : 0;
    const esMontoSuficiente = montoRecibido && parseFloat(montoRecibido) >= montoACobrar - 0.01;
    const porcentajePagado = (pagosRealizados / numPagos) * 100;
    const esCafeteria = pedido.origen === 'Cafetería';

    const handleCobrar = () => { if (esMontoSuficiente) { onRegistrarPago(pedido.folio, esLiquidacion); setMontoRecibido(''); setEsLiquidacion(esPagoUnico); } };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="bg-pink-900 p-6 text-white flex justify-between"><div><h3 className="text-2xl font-bold">{pedido.cliente}</h3><p className="text-pink-200 font-mono text-sm">{pedido.folio || pedido.id}</p></div><button onClick={cerrar}><X /></button></div>
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border"><h4 className="text-sm font-bold text-gray-500 uppercase flex items-center mb-2"><ShoppingBag size={14} className="mr-2" /> Descripción</h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase mb-2 inline-block ${esCafeteria ? 'bg-orange-100 text-orange-700' : 'bg-pink-100 text-pink-700'}`}>{pedido.tipoProducto || (esCafeteria ? 'Consumo Cafetería' : 'Producto')}</span>
                        <p className="text-gray-800 whitespace-pre-wrap">{pedido.detalles || (esCafeteria ? `Venta de mostrador con ${pedido.items} artículos.` : 'Sin detalles.')}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                        {pedido.telefono && <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium text-gray-700">{pedido.telefono}</p></div>}
                        {pedido.fechaEntrega && <div><p className="text-xs text-gray-400">Entrega Programada</p><p className="font-medium text-pink-700 flex items-center gap-1"><CalendarDays size={14} />{formatearFechaLocal(pedido.fechaEntrega)}</p></div>}
                        <div><p className="text-xs text-gray-400">Fecha Registro</p><p className="font-medium text-gray-700 flex items-center gap-1"><CalendarDays size={14} />{formatearFechaLocal(pedido.fecha)}</p></div>
                    </div>
                    
                    {/* BOTONES DE IMPRESIÓN */}
                    <div className="flex gap-2">
                        <button onClick={() => imprimirTicket({ ...pedido, saldoPendiente }, 'ticket')} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 text-gray-700">
                            <Printer size={16}/> Imprimir Ticket
                        </button>
                        {!esCafeteria && (
                            <button onClick={() => imprimirTicket(pedido, 'comanda')} className="flex-1 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 text-pink-700">
                                <FileText size={16}/> Comanda Cocina
                            </button>
                        )}
                    </div>

                    <hr className="border-gray-100" />
                    {pedido.estado === 'Cancelado' ? (<div className="w-full bg-red-100 text-red-800 font-bold py-6 rounded-xl text-center flex flex-col justify-center items-center border border-red-200"><AlertCircle size={32} className="mb-2" /><span className="text-lg">Pedido cancelado</span></div>) : (
                        <div>
                            <div className="flex justify-between items-end mb-2"><span className="text-3xl font-bold text-gray-800">${montoTotal.toFixed(2)}</span><span className="text-sm text-gray-500 mb-1">Total</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${porcentajePagado}%` }}></div></div>
                            {!esCafeteria && <div className="flex justify-between text-sm text-gray-600 mb-6"><span>Pagado: {pagosRealizados} de {numPagos}</span><span>Resta: ${saldoPendiente.toFixed(2)}</span></div>}
                            {pagosRestantes > 0 ? (
                                <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                                    <h5 className="font-bold text-pink-800 mb-3 flex items-center"><Calculator size={16} className="mr-2" /> Cajero</h5>
                                    {!esPagoUnico ? (
                                        <div className="flex space-x-2 mb-4">
                                            <button onClick={() => { setEsLiquidacion(false); setMontoRecibido(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Abono (${montoPorPago.toFixed(2)})</button>
                                            <button onClick={() => { setEsLiquidacion(true); setMontoRecibido(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Liquidar (${saldoPendiente.toFixed(2)})</button>
                                        </div>
                                    ) : (
                                        <div className="mb-4 p-2 bg-pink-100 text-pink-800 text-center rounded-lg text-sm font-bold border border-pink-200">
                                            Pago de Contado (Total: ${saldoPendiente.toFixed(2)})
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 mb-4"><div><label className="text-xs font-bold text-gray-500">Recibido</label><input type="number" min="0" className="w-full p-2 rounded border font-bold" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} /></div><div><label className="text-xs font-bold text-gray-500">Cambio</label><div className="w-full p-2 rounded border font-bold bg-white text-green-600">${cambio >= 0 ? cambio.toFixed(2) : '0.00'}</div></div></div>
                                    <button onClick={handleCobrar} disabled={!esMontoSuficiente} className={`w-full py-3 rounded-xl font-bold shadow-lg text-white ${esMontoSuficiente ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'}`}>Confirmar Cobro</button>
                                </div>
                            ) : (<div className="w-full bg-green-100 text-green-800 font-bold py-3 rounded-xl text-center border border-green-200">¡Pagado / Liquidado!</div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ModalVentasDia = ({ dia, mes, anio, ventas, cerrar, onVerDetalle }) => {
    if (!dia) return null;
    const ventasDelDia = ventas.filter(v => {
        const [y, m, d] = v.fecha.split('-').map(Number);
        return d === parseInt(dia) && m === (mes + 1) && y === anio;
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up">
                <div className="bg-pink-900 p-4 flex justify-between items-center text-white sticky top-0 z-10"><h3 className="font-bold text-lg flex items-center gap-2"><CalendarIcon size={20} /> Ventas del {dia}/{mes + 1}/{anio}</h3><button onClick={cerrar}><X /></button></div>
                <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                    {ventasDelDia.length === 0 ? <div className="text-center text-gray-500 py-10">No hay ventas registradas.</div> : (
                        <div className="space-y-3">
                            {ventasDelDia.map((v, i) => (
                                <div key={i} onClick={() => onVerDetalle(v)} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-pink-300 transition-all group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.origen === 'Pastelería' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>{v.origen}</span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs flex items-center gap-1"><Eye size={12} /> Ver detalles</span>
                                        </div>
                                        <p className="font-bold text-gray-800">{v.cliente}</p>
                                        {v.tipoProducto && <p className="text-xs text-gray-500">{v.tipoProducto}</p>}
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-green-600 text-lg">${v.total}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{v.folio || v.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};