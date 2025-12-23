import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Filter, Plus, Edit, Trash2, X, Image as ImageIcon, Upload, Check, 
    Coffee, ChevronRight, DollarSign, Hash, AlignLeft, Tag, RotateCw, RotateCcw, 
    GripVertical, Settings, PlusCircle, Save, AlertTriangle, Smartphone, ShoppingBag, 
    Grid, QrCode as IconoQR, ArrowLeft, Receipt, Users, Printer, Merge, CheckSquare, Square, 
    Cake, Sparkles, AlertCircle, Calculator, MinusCircle,
    CheckCircle, XCircle, Clock, Info, ArchiveRestore, Box, PauseCircle, PlayCircle, Lock, EyeOff, Loader, Split, CheckCheck, Undo2,
    ChevronDown, ChevronUp, Power 
} from 'lucide-react';

import QRCode from "react-qr-code";

import { Notificacion, CardStat, CardProducto, ModalConfirmacion, ModalInfoProducto } from '../components/Shared';
// --- CAMBIO 1: IMPORTAMOS OBTENER_URL_BASE ---
import { ORDEN_CATEGORIAS, imprimirTicket, OBTENER_URL_BASE } from '../utils/config';
import { cambiarEstadoServicio } from '../services/config.service';

const CATEGORIAS_INICIALES = ['Bebidas Calientes', 'Bebidas Frías', 'Pastelería', 'Bocadillos', 'Otros'];

// --- COMPONENTE 1: MODAL CORTE DE CAJA ---
const ModalCorteCaja = ({ isOpen, onClose, ventas }) => {
    if (!isOpen) return null;
    const total = ventas.reduce((acc, v) => acc + v.total, 0);

    const ventasOrdenadas = [...ventas].sort((a, b) => {
        const horaA = a.hora || '00:00';
        const horaB = b.hora || '00:00';
        return horaA.localeCompare(horaB);
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[260] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col border-t-8 border-orange-500">
                <div className="p-5 bg-orange-50 flex justify-between items-center border-b border-orange-100">
                    <div><h3 className="font-bold text-xl text-orange-900 flex items-center gap-2"><Receipt size={20}/> Corte de Caja</h3><p className="text-xs text-orange-600">Ingresos registrados hoy.</p></div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-orange-100 text-orange-400 transition shadow-sm"><X size={18}/></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {ventasOrdenadas.length === 0 ? (
                        <div className="text-center py-12 opacity-40"><DollarSign size={48} className="mx-auto mb-2 text-gray-400"/><p className="text-gray-500 text-sm">No hay ingresos registrados hoy.</p></div>
                    ) : (
                        ventasOrdenadas.map((venta) => (
                            <div key={venta.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm mb-0.5">{venta.folioLocal || venta.id}</p>
                                    <p className="text-xs text-gray-500 mb-1.5 uppercase">{venta.cliente}</p>
                                    <div className="flex gap-2 items-center">
                                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200 uppercase">VENTA</span>
                                        {venta.hora && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10}/> {venta.hora}</span>}
                                    </div>
                                </div>
                                <div className="text-right"><p className="font-bold text-lg text-orange-700">+${venta.total.toFixed(2)}</p></div>
                            </div>
                        ))
                    )}
                </div>
                <div className="bg-orange-900 p-5 text-white flex justify-between items-center"><span className="font-bold text-orange-100 text-sm uppercase tracking-wider">Total Recaudado</span><span className="font-bold text-2xl text-white">${total.toFixed(2)}</span></div>
            </div>
        </div>
    );
};

// --- COMPONENTE 2: MODAL HISTORIAL ---
// --- COMPONENTE 2: MODAL HISTORIAL ---
const ModalHistorial = ({ isOpen, onClose, tipo, items, onRestaurar, onVaciarPapelera, onEliminarDePapelera }) => {
    const [busqueda, setBusqueda] = useState('');
    const [itemParaRestaurar, setItemParaRestaurar] = useState(null);
    const [itemParaEliminar, setItemParaEliminar] = useState(null);
    const [confirmarVaciar, setConfirmarVaciar] = useState(false);

    useEffect(() => { if (isOpen) { setBusqueda(''); setConfirmarVaciar(false); } }, [isOpen]);

    // --- AQUÍ ESTÁ EL CAMBIO ---
    const itemsOrdenados = useMemo(() => {
        if (!items) return [];
        return [...items].sort((a, b) => {
            // 1. Priorizamos el timestamp numérico (es lo más exacto para ordenar tiempo)
            // a - b = Ascendente (De la mañana a la noche)
            if (a.timestamp && b.timestamp) {
                return a.timestamp - b.timestamp;
            }
            // 2. Fallback por si acaso falla el timestamp (usamos la hora en texto)
            if (a.hora && b.hora) {
                return a.hora.localeCompare(b.hora);
            }
            return 0;
        });
    }, [items]);
    // ---------------------------

    if (!isOpen) return null;

    const esVenta = tipo === 'vendidos';
    const titulo = esVenta ? 'Vendidos' : 'Cancelados de Cafetería';
    const subtitulo = esVenta ? 'Historial de ventas del día.' : 'Las cuentas se eliminarán automáticamente al final del día.';
    const colorHeader = esVenta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
    const iconoHeader = esVenta ? <CheckCircle size={24} className="text-green-600 mr-2"/> : <ArchiveRestore size={24} className="text-red-600 mr-2"/>;
    const iconoVacio = esVenta ? <CheckCircle size={48} className="mx-auto mb-2 text-green-300"/> : <Trash2 size={48} className="mx-auto mb-2 text-red-300"/>;

    const itemsFiltrados = itemsOrdenados.filter(item => {
        const texto = (item.cliente || item.nombreCliente || '') + (item.folioLocal || item.id || '');
        return texto.toLowerCase().includes(busqueda.toLowerCase());
    });

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up border-t-8 ${esVenta ? 'border-green-500' : 'border-red-500'}`}>
                    <div className={`p-6 ${colorHeader} flex justify-between items-start border-b border-gray-100`}>
                        <div>
                            <h3 className="font-bold text-2xl flex items-center mb-1">{iconoHeader} {titulo}</h3>
                            <p className="text-sm opacity-80">{subtitulo}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm text-gray-500"><X size={20}/></button>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" placeholder="BUSCAR..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none bg-gray-50 focus:bg-white transition-all uppercase" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                        {!esVenta && items.length > 0 && (
                            <button onClick={() => setConfirmarVaciar(true)} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
                                <Trash2 size={18} /> Vaciar Todo
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {itemsFiltrados.length === 0 ? (
                            <div className="text-center py-12 opacity-50">{iconoVacio}<p className="text-gray-500 font-medium">{esVenta ? 'No hay ventas registradas.' : 'La papelera está vacía.'}</p></div>
                        ) : (
                            itemsFiltrados.map((item) => {
                                const horaCancelado = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Reciente';
                                return (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${esVenta ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{esVenta ? 'VENDIDO' : 'CANCELADO'}</span>
                                                <span className="text-xs font-mono text-gray-400 font-bold">{item.folioLocal || item.id}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-800 text-lg uppercase">{item.cliente || item.nombreCliente}</h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 items-center">
                                                <span><span className="font-bold text-gray-700">{item.items || item.cuenta.length}</span> productos</span>
                                                <span>•</span>
                                                <span>{item.origenMesaId ? `Mesa: ${item.nombreMesa}` : 'Para Llevar'}</span>
                                            </div>
                                            {esVenta ? (
                                                <p className="text-[10px] text-green-700 mt-1.5 flex items-center gap-1.5 font-bold bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100"><Clock size={11}/> Vendido a las {item.hora}</p>
                                            ) : (
                                                <p className="text-[10px] text-red-600 mt-1.5 flex items-center gap-1.5 font-bold bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100"><Clock size={11}/> Cancelado a las {horaCancelado}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button onClick={() => setItemParaRestaurar(item)} className="flex-1 sm:flex-none px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition"><RotateCcw size={16}/> {esVenta ? 'Deshacer' : 'Restaurar'}</button>
                                            {!esVenta && (<button onClick={() => setItemParaEliminar(item)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition flex items-center justify-center" title="Eliminar definitivamente"><Trash2 size={18}/></button>)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            <ModalConfirmacion isOpen={!!itemParaRestaurar} onClose={() => setItemParaRestaurar(null)} onConfirm={() => { if (itemParaRestaurar) { onRestaurar(itemParaRestaurar); setItemParaRestaurar(null); onClose(); } }} titulo={esVenta ? "¿Deshacer Venta?" : "¿Recuperar Cuenta?"} mensaje={itemParaRestaurar ? `La cuenta de ${itemParaRestaurar.cliente || itemParaRestaurar.nombreCliente} volverá a estar activo en ${itemParaRestaurar.origenMesaId ? 'su mesa original' : 'Para Llevar'}.` : ''} />
            <ModalConfirmacion isOpen={!!itemParaEliminar} onClose={() => setItemParaEliminar(null)} onConfirm={() => { if (itemParaEliminar) { onEliminarDePapelera(itemParaEliminar.id); setItemParaEliminar(null); } }} titulo="¿Eliminar definitivamente?" mensaje="Esta acción no se puede deshacer. El pedido desaparecerá para siempre." />
            <ModalConfirmacion isOpen={confirmarVaciar} onClose={() => setConfirmarVaciar(false)} onConfirm={() => { onVaciarPapelera(); setConfirmarVaciar(false); }} titulo="¿Vaciar Papelera?" mensaje="Se eliminarán TODOS los pedidos cancelados de hoy. Esta acción es irreversible." />
        </>
    );
};

export const ModalQR = ({ isOpen, onClose, titulo, subtitulo, valorQR }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[250] p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-bounce-in border-4 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900">{titulo}</h3>
                        <p className="text-gray-500 text-sm">{subtitulo}</p>
                    </div>
                    <button onClick={onClose}><X /></button>
                </div>
                
                {/* AQUÍ ESTÁ EL CAMBIO: Generador de QR Real */}
                <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center border-2 border-gray-100 shadow-inner">
                    <div style={{ height: "auto", margin: "0 auto", maxWidth: 180, width: "100%" }}>
                        <QRCode
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={valorQR || ""} // Aquí pasamos la URL real
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </div>

                <p className="text-xs text-gray-400 mb-6 font-mono break-all">{valorQR}</p>
                <button onClick={() => window.print()} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <Printer size={20} /> Imprimir QR
                </button>
            </div>
        </div>
    );
};

export const ModalNuevaCuentaMesa = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    const [nombre, setNombre] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in-up">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Nueva Cuenta Separada</h3>
                <input autoFocus placeholder="Nombre del cliente" className="w-full p-3 border rounded-lg mb-4" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())} />
                <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button><button onClick={() => { if (nombre) { onConfirm(nombre); setNombre(''); } }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Crear Cuenta</button></div>
            </div>
        </div>
    );
};

// --- MODAL FUSIÓN CUENTAS ---
export const ModalFusionCuentas = ({ isOpen, onClose, cuentas, onConfirmarFusion }) => {
    if (!isOpen) return null;
    const [cuentaDestino, setCuentaDestino] = useState('');
    const [cuentasOrigen, setCuentasOrigen] = useState([]);
    const [pasoConfirmacion, setPasoConfirmacion] = useState(false);

    useEffect(() => { if(!isOpen) { setCuentaDestino(''); setCuentasOrigen([]); setPasoConfirmacion(false); } }, [isOpen]);
    
    const toggleOrigen = (id) => { if (cuentasOrigen.includes(id)) { setCuentasOrigen(cuentasOrigen.filter(c => c !== id)); } else { setCuentasOrigen([...cuentasOrigen, id]); } };
    
    const disponiblesOrigen = cuentas.filter(c => c.id !== cuentaDestino);
    const nombreDestino = cuentas.find(c => c.id === cuentaDestino)?.cliente || '';

    const seleccionarTodas = () => { setCuentasOrigen(disponiblesOrigen.map(c => c.id)); };
    const deseleccionarTodas = () => { setCuentasOrigen([]); };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[250] p-4 backdrop-blur-md">
            <div className="bg-white p-0 rounded-3xl shadow-2xl w-full max-w-md animate-bounce-in overflow-hidden border-2 border-pink-100">
                <div className="bg-pink-50 p-4 flex justify-between items-center border-b border-pink-100">
                    <h3 className="text-lg font-bold text-pink-800 flex items-center gap-2">{pasoConfirmacion ? <Sparkles size={18} /> : <Merge size={18}/>} {pasoConfirmacion ? 'Confirmar Unión' : 'Unir Cuentas'}</h3>
                    <button onClick={onClose} className="text-pink-400 hover:text-pink-600"><X /></button>
                </div>
                <div className="p-6">
                    {!pasoConfirmacion ? (
                        <>
                            <div className="mb-5"><label className="text-xs font-bold text-gray-400 uppercase block mb-2">1. Cuenta Principal (La que paga)</label><select className="w-full p-3 border-2 border-orange-100 rounded-xl bg-white font-bold text-gray-700 focus:border-orange-400 outline-none" value={cuentaDestino} onChange={(e) => { setCuentaDestino(e.target.value); setCuentasOrigen([]); }}><option value="">Selecciona al pagador...</option>{cuentas.map(c => <option key={c.id} value={c.id}>{c.cliente} (${c.total})</option>)}</select></div>
                            {cuentaDestino && (
                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase block">2. Cuentas a unir</label>
                                        <div className="flex gap-2">
                                            <button onClick={seleccionarTodas} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">Todas</button>
                                            <button onClick={deseleccionarTodas} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 px-2 py-1 rounded transition">Ninguna</button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">{disponiblesOrigen.map(c => (<div key={c.id} onClick={() => toggleOrigen(c.id)} className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${cuentasOrigen.includes(c.id) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}><span className="text-gray-700 font-medium">{c.cliente} <span className="text-xs text-gray-400 font-normal">(${c.total})</span></span>{cuentasOrigen.includes(c.id) ? <div className="bg-orange-500 text-white rounded-full p-0.5"><CheckSquare size={16}/></div> : <Square size={20} className="text-gray-300"/>}</div>))}</div>
                                </div>
                            )}
                            <button onClick={() => setPasoConfirmacion(true)} disabled={!cuentaDestino || cuentasOrigen.length === 0} className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md flex justify-center items-center gap-2 ${!cuentaDestino || cuentasOrigen.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg'}`}>Siguiente <ArrowLeft size={18} className="rotate-180"/></button>
                        </>
                    ) : (
                        <div className="text-center animate-fade-in"><div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow"><Cake size={40} className="text-pink-600" /></div><h4 className="text-2xl font-bold text-gray-800 mb-2">¿Mezclamos los sabores?</h4><p className="text-gray-500 text-sm mb-6 leading-relaxed">Se unirán <strong className="text-orange-600">{cuentasOrigen.length}</strong> cuentas a la cuenta de <strong className="text-orange-600 text-lg">{nombreDestino}</strong>.</p><div className="flex gap-3"><button onClick={() => setPasoConfirmacion(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">Mejor no</button><button onClick={() => { onConfirmarFusion(cuentaDestino, cuentasOrigen); onClose(); }} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex justify-center items-center gap-2"><Sparkles size={18}/> ¡Sí, unir todo!</button></div></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODAL DIVIDIR ITEMS (MANUAL) ---
const ModalDividirItems = ({ isOpen, onClose, cuenta, onConfirm }) => {
    if (!isOpen || !cuenta) return null;
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [itemsSeleccionados, setItemsSeleccionados] = useState([]); 
    
    const toggleItem = (index) => {
        if (itemsSeleccionados.includes(index)) {
            setItemsSeleccionados(itemsSeleccionados.filter(i => i !== index));
        } else {
            setItemsSeleccionados([...itemsSeleccionados, index]);
        }
    };

    const handleConfirm = () => {
        if (nuevoNombre.trim().length < 2) { alert("Escribe un nombre válido."); return; }
        onConfirm(nuevoNombre.toUpperCase(), itemsSeleccionados);
        onClose();
    };

    const items = cuenta.cuenta || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[280] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up flex flex-col max-h-[85vh] border-t-8 border-purple-500">
                <div className="bg-purple-50 p-5 flex justify-between items-center border-b border-purple-100">
                    <div><h3 className="text-xl font-bold text-purple-900 flex items-center gap-2"><Split size={20}/> Separar por Items</h3><p className="text-xs text-purple-600 opacity-80">Mueve productos específicos a otra cuenta.</p></div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-purple-300 hover:text-purple-600 transition"><X size={18}/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    <div className="mb-4"><label className="text-xs font-bold text-gray-400 uppercase block mb-1">Nombre Nueva Cuenta</label><input autoFocus placeholder="Ej. AMIGO DE JUAN" className="w-full p-3 border-2 border-purple-100 rounded-xl bg-white font-bold text-gray-700 focus:border-purple-400 outline-none uppercase" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} /></div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Selecciona qué mover</label>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {items.length === 0 ? (<p className="p-4 text-center text-gray-400 text-sm">No hay productos.</p>) : (
                            items.map((item, index) => (
                                <div key={index} onClick={() => toggleItem(index)} className={`p-3 flex justify-between items-center border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${itemsSeleccionados.includes(index) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                    <div><span className="font-bold text-gray-700 text-sm">{item.cantidad || 1}x {item.nombre}</span><p className="text-xs text-gray-400">${(item.precio * (item.cantidad || 1)).toFixed(2)}</p></div>
                                    {itemsSeleccionados.includes(index) ? <div className="bg-purple-500 text-white rounded-full p-1"><CheckCheck size={14}/></div> : <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 bg-white"><button onClick={handleConfirm} disabled={!nuevoNombre || itemsSeleccionados.length === 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all ${!nuevoNombre || itemsSeleccionados.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}><Split size={20} /> Mover Items</button></div>
            </div>
        </div>
    );
};

// --- MODAL DESUNIR CUENTAS (HISTÓRICO) ---
const ModalDesunirCuentas = ({ isOpen, onClose, cuenta, onConfirm }) => {
    if (!isOpen || !cuenta || !cuenta.historicoFusion) return null;
    const [idsSeleccionados, setIdsSeleccionados] = useState([]);

    const toggleId = (id) => {
        if (idsSeleccionados.includes(id)) setIdsSeleccionados(idsSeleccionados.filter(i => i !== id));
        else setIdsSeleccionados([...idsSeleccionados, id]);
    };

    // --- NUEVAS FUNCIONES ---
    const seleccionarTodas = () => {
        setIdsSeleccionados(cuenta.historicoFusion.map(h => h.idOriginal));
    };

    const deseleccionarTodas = () => {
        setIdsSeleccionados([]);
    };
    // -----------------------

    const handleConfirm = () => {
        onConfirm(idsSeleccionados);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[280] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up flex flex-col max-h-[85vh] border-t-8 border-indigo-500">
                <div className="bg-indigo-50 p-5 flex justify-between items-center border-b border-indigo-100">
                    <div><h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2"><Undo2 size={20}/> Deshacer Unión</h3><p className="text-xs text-indigo-600 opacity-80">Restaura cuentas originales.</p></div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-indigo-300 hover:text-indigo-600 transition"><X size={18}/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                    
                    {/* --- AQUÍ ESTÁ EL CAMBIO VISUAL --- */}
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-sm text-gray-600 leading-tight">Separa cuentas de <strong>{cuenta.cliente}</strong>:</p>
                        <div className="flex gap-2">
                            <button onClick={seleccionarTodas} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition border border-transparent hover:border-blue-100">Todas</button>
                            <button onClick={deseleccionarTodas} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 px-2 py-1 rounded transition border border-transparent hover:border-gray-200">Ninguna</button>
                        </div>
                    </div>
                    {/* ---------------------------------- */}

                    <div className="space-y-2">
                        {cuenta.historicoFusion.map((hist) => (
                            <div key={hist.idOriginal} onClick={() => toggleId(hist.idOriginal)} className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${idsSeleccionados.includes(hist.idOriginal) ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-200 hover:border-indigo-200'}`}>
                                <div><p className="font-bold text-gray-800 uppercase">{hist.clienteOriginal}</p><p className="text-xs text-gray-500">{hist.items.length} items originalmente</p></div>
                                {idsSeleccionados.includes(hist.idOriginal) ? <div className="bg-indigo-500 text-white p-1 rounded-full"><Check size={16}/></div> : <div className="w-6 h-6 border-2 border-gray-200 rounded-full"></div>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-100 bg-white">
                    <button onClick={handleConfirm} disabled={idsSeleccionados.length === 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all ${idsSeleccionados.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}><Undo2 size={20} /> Separar Cuentas</button>
                </div>
            </div>
        </div>
    );
};

export const ModalNuevoLlevar = ({ isOpen, onClose, onConfirm }) => { if (!isOpen) return null; const [datos, setDatos] = useState({ nombre: '', telefono: '' }); const [error, setError] = useState(''); const handleSubmit = () => { if (datos.nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 letras.'); return; } if (datos.telefono.length !== 10) { setError('El teléfono debe tener 10 dígitos.'); return; } onConfirm(datos); setError(''); setDatos({ nombre: '', telefono: '' }); }; return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4 backdrop-blur-sm"> <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in"> <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={24} className="text-orange-600" /> Nuevo Pedido "Para Llevar"</h3> <p className="text-sm text-gray-500 mb-4">Ingresa los datos del cliente:</p> <div className="space-y-3 mb-4"> <input placeholder="Nombre Completo" className="w-full p-3 border rounded-lg uppercase" value={datos.nombre} onChange={e => { setDatos({ ...datos, nombre: e.target.value.toUpperCase() }); setError(''); }} /> <input placeholder="Teléfono (10 dígitos)" type="tel" className="w-full p-3 border rounded-lg" value={datos.telefono} onChange={e => { if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) { setDatos({ ...datos, telefono: e.target.value }); setError(''); } }} /> </div> {error && <p className="text-red-500 text-xs font-bold mb-3 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>} <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button><button onClick={handleSubmit} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Crear Pedido</button></div> </div> </div> ); };
export const ModalGestionarCategorias = ({ isOpen, onClose, categorias, setCategorias, productos, setProductos, mostrarNotificacion }) => { const [listaCategorias, setListaCategorias] = useState(categorias); const [modoEdicion, setModoEdicion] = useState(null); const [textoInput, setTextoInput] = useState(''); const [categoriaAEliminar, setCategoriaAEliminar] = useState(null); const itemArrastrado = useRef(null); const itemSobreElQueSeArrastra = useRef(null); useEffect(() => { setListaCategorias(categorias); }, [categorias]); const handleDragStart = (e, index) => { itemArrastrado.current = index; }; const handleDragEnter = (e, index) => { itemSobreElQueSeArrastra.current = index; }; const handleDragEnd = () => { const items = [...listaCategorias]; const itemMovido = items.splice(itemArrastrado.current, 1)[0]; items.splice(itemSobreElQueSeArrastra.current, 0, itemMovido); setListaCategorias(items); itemArrastrado.current = null; itemSobreElQueSeArrastra.current = null; }; const guardarCambiosOrden = () => { setCategorias(listaCategorias); mostrarNotificacion("Orden de categorías actualizado", "exito"); onClose(); }; const handleGuardarCategoria = () => { const nombreLimpio = textoInput.trim(); if (!nombreLimpio) return mostrarNotificacion("El nombre no puede estar vacío", "error"); if (listaCategorias.includes(nombreLimpio) && nombreLimpio !== modoEdicion) return mostrarNotificacion("Ya existe una categoría con ese nombre", "error"); if (modoEdicion === 'nueva') { const nuevaLista = [...listaCategorias, nombreLimpio]; setListaCategorias(nuevaLista); setCategorias(nuevaLista); mostrarNotificacion(`Categoría "${nombreLimpio}" creada`, "exito"); } else { const nuevaLista = listaCategorias.map(c => c === modoEdicion ? nombreLimpio : c); setListaCategorias(nuevaLista); setCategorias(nuevaLista); const nuevosProductos = productos.map(p => p.categoria === modoEdicion ? { ...p, categoria: nombreLimpio } : p); setProductos(nuevosProductos); mostrarNotificacion(`Categoría renombrada a "${nombreLimpio}"`, "exito"); } setModoEdicion(null); setTextoInput(''); }; const handleEliminarCategoria = (catToDelete) => { const productosEnCategoria = productos.filter(p => p.categoria === catToDelete).length; if (productosEnCategoria > 0) return mostrarNotificacion(`No puedes eliminar "${catToDelete}" porque tiene ${productosEnCategoria} productos.`, "error"); setCategoriaAEliminar(catToDelete); }; const confirmarEliminacion = () => { if (categoriaAEliminar) { const nuevaLista = listaCategorias.filter(c => c !== categoriaAEliminar); setListaCategorias(nuevaLista); setCategorias(nuevaLista); mostrarNotificacion("Categoría eliminada", "info"); setCategoriaAEliminar(null); } }; if (!isOpen) return null; return ( <> <div className="fixed inset-0 bg-black bg-opacity-50 z-[210] flex items-center justify-center backdrop-blur-sm p-4"> <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up"> <div className="bg-gray-800 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Settings size={20}/> Gestionar Categorías</h3><button onClick={onClose}><X size={20}/></button></div> <div className="p-4 bg-gray-50"> <ul className="space-y-2 mb-4"> {listaCategorias.map((cat, index) => ( <li key={cat} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="bg-white p-3 rounded-lg border flex justify-between items-center hover:shadow-sm cursor-grab active:cursor-grabbing group"> <div className="flex items-center gap-3"><GripVertical size={18} className="text-gray-400"/><span className="font-medium text-gray-700">{cat}</span></div> <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity"><button onClick={() => { setModoEdicion(cat); setTextoInput(cat); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Edit size={16}/></button><button onClick={() => handleEliminarCategoria(cat)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button></div> </li> ))} </ul> {modoEdicion ? ( <div className="flex gap-2 mb-4 bg-blue-50 p-2 rounded-lg border border-blue-100 animate-fade-in"> <input type="text" value={textoInput} onChange={e => setTextoInput(e.target.value)} className="flex-1 p-2 border rounded text-sm" placeholder="Nombre de categoría..." autoFocus onKeyDown={e => e.key === 'Enter' && handleGuardarCategoria()}/> <button onClick={handleGuardarCategoria} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Check size={18}/></button> <button onClick={() => { setModoEdicion(null); setTextoInput(''); }} className="bg-gray-300 text-gray-700 px-3 rounded hover:bg-gray-400"><X size={18}/></button> </div> ) : ( <button onClick={() => { setModoEdicion('nueva'); setTextoInput(''); }} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-orange-400 hover:text-orange-500 transition flex justify-center items-center gap-2 font-medium"><PlusCircle size={18}/> Añadir Nueva Categoría</button> )} </div> <div className="p-4 border-t flex justify-end gap-3 bg-white"><button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cerrar</button><button onClick={guardarCambiosOrden} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center gap-2"><Save size={18}/> Guardar Orden</button></div> </div> </div> <ModalConfirmacion isOpen={!!categoriaAEliminar} onClose={() => setCategoriaAEliminar(null)} onConfirm={confirmarEliminacion} titulo={`¿Eliminar "${categoriaAEliminar}"?`} mensaje="Esta acción eliminará la categoría permanentemente." /> </> ); };
export const ModalProducto = ({ isOpen, producto, onClose, onGuardar, onEliminar, categoriasDisponibles }) => { 
    if (!isOpen) return null; 
    
    const [form, setForm] = useState({ id: null, nombre: '', categoria: categoriasDisponibles[0] || 'Otros', precio: '', imagen: null, pausado: false }); 
    const [imagenPreview, setImagenPreview] = useState(null); 
    const [scale, setScale] = useState(1); 
    const [rotation, setRotation] = useState(0); 
    const [isDragging, setIsDragging] = useState(false); 
    const [position, setPosition] = useState({ x: 0, y: 0 }); 
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); 
    
    const imageRef = useRef(null); 
    const canvasRef = useRef(null); 
    const fileInputRef = useRef(null); 
    
    useEffect(() => { 
        if (producto) { 
            setForm({ ...producto }); 
            setImagenPreview(producto.imagen); 
        } else { 
            setForm({ id: null, nombre: '', categoria: categoriasDisponibles[0] || 'Otros', precio: '', imagen: null, pausado: false }); 
            setImagenPreview(null); 
        } 
        setScale(1); 
        setRotation(0); 
        setPosition({ x: 0, y: 0 }); 
    }, [producto, isOpen]); 
    
    const handleImageChange = (e) => { 
        const file = e.target.files[0]; 
        if (file) { 
            const reader = new FileReader(); 
            reader.onloadend = () => { 
                setImagenPreview(reader.result); 
                setScale(1); 
                setRotation(0); 
                setPosition({ x: 0, y: 0 }); 
            }; 
            reader.readAsDataURL(file); 
        } 
    }; 
    
    const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }; 
    const handleMouseMove = (e) => { if (isDragging) { setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); } }; 
    const handleMouseUp = () => { setIsDragging(false); };
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e) => {
        // 1. ESTO EVITA QUE SE MUEVA LA PANTALLA (SCROLL)
        if (e.cancelable) {
             e.preventDefault(); 
             e.stopPropagation();
        }

        if (isDragging) {
            const touch = e.touches[0];
            setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    }; 
    
    const rotate = (direction) => { setRotation(prev => prev + (direction === 'right' ? 90 : -90)); }; 
    
    const getCroppedImg = () => { 
        const canvas = canvasRef.current; 
        const image = imageRef.current; 
        if (!canvas || !image) return imagenPreview; 
        
        const ctx = canvas.getContext('2d'); 
        const containerSize = 250; 
        canvas.width = containerSize; 
        canvas.height = containerSize; 
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height); 
        
        ctx.save(); 
        const centerX = canvas.width / 2; 
        const centerY = canvas.height / 2; 
        ctx.translate(centerX + position.x, centerY + position.y); 
        ctx.rotate((rotation * Math.PI) / 180); 
        
        const visibleWidth = image.naturalWidth * scale; 
        const visibleHeight = image.naturalHeight * scale; 
        ctx.drawImage(image, -visibleWidth / 2, -visibleHeight / 2, visibleWidth, visibleHeight); 
        ctx.restore(); 
        
        return canvas.toDataURL('image/jpeg', 0.9); 
    }; 
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const finalImage = (imagenPreview && (scale !== 1 || position.x !== 0 || position.y !== 0 || rotation !== 0)) ? getCroppedImg() : imagenPreview; 
        const productoAGuardar = { ...form, precio: parseFloat(form.precio), imagen: finalImage, }; 
        onGuardar(productoAGuardar); 
        onClose(); 
    }; 
    
    const handleDelete = () => { onEliminar(producto.id); onClose(); }; 

    return ( 
        <div className="fixed inset-0 z-[220] overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up relative my-8 text-left">
                    <div className="bg-orange-600 p-6 text-white flex justify-between items-center rounded-t-2xl"> 
                        <h3 className="text-2xl font-bold flex items-center gap-2">{producto ? <Edit size={24}/> : <Plus size={24}/>} {producto ? 'Editar Producto' : 'Nuevo Producto'}</h3> 
                        <button type="button" onClick={onClose} className="hover:bg-orange-700 p-2 rounded-full transition"><X size={24} /></button> 
                    </div> 
                    
                    <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8"> 
                        <div className="space-y-5"> 
                            <div className="space-y-2"> 
                                <label className="flex items-center text-sm font-bold text-gray-700 gap-2"><Coffee size={16} className="text-orange-500"/> Nombre del Producto</label> 
                                <div className="relative"><input required type="text" placeholder="Ej. Cappuccino Grande" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-all font-medium" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /><AlignLeft size={18} className="absolute left-3 top-3.5 text-gray-400"/></div> 
                            </div> 
                            <div className="space-y-2"> 
                                <label className="flex items-center text-sm font-bold text-gray-700 gap-2"><DollarSign size={16} className="text-orange-500"/> Precio</label> 
                                <div className="relative"><input required type="number" step="0.01" min="0" placeholder="Ej. 45.00" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-all font-bold text-lg" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} /><Hash size={18} className="absolute left-3 top-3.5 text-gray-400"/></div> 
                            </div> 
                            <div className="space-y-2"> 
                                <label className="flex items-center text-sm font-bold text-gray-700 gap-2"><Tag size={16} className="text-orange-500"/> Categoría</label> 
                                <div className="relative"><select className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-all appearance-none bg-white font-medium" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>{categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><Filter size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/><ChevronRight size={18} className="absolute right-3 top-3.5 text-gray-400 rotate-90 pointer-events-none"/></div> 
                            </div> 
                            <div className="space-y-2"> 
                                <label className="flex items-center text-sm font-bold text-gray-700 gap-2"><AlignLeft size={16} className="text-orange-500"/> Descripción</label> 
                                <textarea placeholder="Ej. Con leche entera y canela..." className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 h-24" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /> 
                            </div> 
                        </div> 
                        
                        <div className="flex flex-col items-center justify-center md:border-l md:pl-8 border-gray-100"> 
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" /> 
                            {!imagenPreview ? ( 
                                <div onClick={() => fileInputRef.current.click()} className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all group"><Upload size={48} className="text-gray-300 group-hover:text-orange-400 mb-2 transition-colors"/><p className="text-gray-500 font-medium group-hover:text-orange-500">Click para subir imagen</p></div> 
                            ) : ( 
                                <div className="w-full flex flex-col items-center animate-fade-in"> 
                                    <div className="w-[250px] h-[250px] rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative cursor-move mb-4 group flex items-center justify-center touch-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}> 
                                        <img ref={imageRef} src={imagenPreview} alt="Preview" className="absolute transition-transform duration-75 ease-out origin-center" style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`, maxHeight: 'none', maxWidth: 'none' }} draggable="false" /><div className="absolute inset-0 border-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div> 
                                    </div> 
                                    <div className="w-full max-w-[250px] space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200"> 
                                        <div><label className="flex justify-between text-xs font-bold text-gray-600 mb-1">Zoom: <span>{(scale * 100).toFixed(0)}%</span></label><input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div> 
                                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-600">Rotar:</span><div className="flex gap-2"><button type="button" onClick={() => rotate('left')} className="p-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-600"><RotateCcw size={16}/></button><button type="button" onClick={() => rotate('right')} className="p-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-600"><RotateCw size={16}/></button></div></div> 
                                        <div className="flex gap-2 mt-2"><button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 py-1.5 text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 flex items-center justify-center gap-1"><ImageIcon size={12}/> Cambiar</button><button type="button" onClick={() => { setImagenPreview(null); fileInputRef.current.value = ''; }} className="flex-1 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 size={12}/> Quitar</button></div> 
                                    </div> 
                                    <canvas ref={canvasRef} style={{ display: 'none' }} /> 
                                </div> 
                            )} 
                        </div> 
                        
                        {/* --- FOOTER DE BOTONES MEJORADO --- */}
                        <div className="md:col-span-2 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl -mx-8 -mb-8 mt-4"> 
                            {producto ? (
                                // Layout EDICIÓN: Móvil (Grid 2 filas) / PC (Fila única separada)
                                <div className="grid grid-cols-2 gap-4 md:flex md:items-center">
                                    
                                    {/* 1. ELIMINAR: Izquierda (PC y Móvil) */}
                                    <button type="button" onClick={handleDelete} className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                                        <Trash2 size={20}/> <span className="hidden sm:inline">Eliminar</span><span className="sm:hidden">Borrar</span>
                                    </button>

                                    {/* 2. CANCELAR: Derecha (PC y Móvil) */}
                                    {/* 'md:ml-auto' empuja este botón y el siguiente a la derecha en PC */}
                                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors md:ml-auto">
                                        Cancelar
                                    </button>

                                    {/* 3. GUARDAR: Abajo completo (Móvil) / Derecha (PC) */}
                                    <button type="submit" className="col-span-2 w-full md:w-auto px-8 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 md:ml-4">
                                        <Check size={20}/> Guardar Cambios
                                    </button>
                                </div>
                            ) : (
                                // Layout CREAR: Simple (Cancelar y Crear juntos)
                                <div className="flex flex-col sm:flex-row justify-end gap-4">
                                     <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="w-full sm:w-auto px-8 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2">
                                        <Check size={20}/> Crear Producto
                                    </button>
                                </div>
                            )}
                        </div> 
                    </form> 
                </div> 
            </div>
        </div> 
    ); 
};

// Busca el componente VistaHubMesa (aprox línea 556) y reemplázalo con este:

export const VistaHubMesa = ({ mesa, onVolver, onAbrirCuenta, onCrearCuenta, onUnirCuentas }) => { 
    const [modalUnirOpen, setModalUnirOpen] = useState(false); 
    const [modalCrearOpen, setModalCrearOpen] = useState(false); 

    // --- CAMBIO: Ordenar cuentas (De la más antigua a la más reciente) ---
    const cuentasOrdenadas = useMemo(() => {
        if (!mesa || !mesa.cuentas) return [];
        return [...mesa.cuentas].sort((a, b) => {
            // Usamos timestamp si existe, si no, intentamos mantener el orden original
            const timeA = a.timestamp || 0;
            const timeB = b.timestamp || 0;
            return timeA - timeB; // Ascendente: Menor (más viejo) a Mayor (más nuevo)
        });
    }, [mesa.cuentas]);
    // ---------------------------------------------------------------------

    return ( 
        <div className="fixed inset-0 bg-gray-50 z-[50] flex flex-col animate-fade-in-up"> 
            <div className="bg-white p-4 shadow-md flex justify-between items-center"> 
                <div className="flex items-center gap-4">
                    <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{mesa.nombre}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500"><Users size={16} /> <span>{mesa.cuentas.length} cuentas activas</span></div>
                    </div>
                </div> 
                <div className="flex items-center gap-3">
                    {mesa.cuentas.length > 1 && (<button onClick={() => setModalUnirOpen(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-2"><Merge size={18}/> Unir Cuentas</button>)}
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold">Total Mesa: ${mesa.cuentas.reduce((acc, c) => acc + c.total, 0)}</div>
                </div> 
            </div> 
            <div className="flex-1 p-8 overflow-y-auto"> 
                {cuentasOrdenadas.length === 0 ? ( 
                    <div className="text-center py-20 opacity-50"><Users size={64} className="mx-auto mb-4 text-gray-400" /><h3 className="text-xl font-bold text-gray-600">Mesa Disponible</h3><p>No hay cuentas abiertas. Esperando clientes...</p></div> 
                ) : ( 
                    // Usamos cuentasOrdenadas en lugar de mesa.cuentas
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cuentasOrdenadas.map(cuenta => (
                            <div key={cuenta.id} onClick={() => onAbrirCuenta(mesa.id, cuenta.id)} className="bg-white border-l-8 border-orange-500 rounded-xl shadow-sm hover:shadow-md cursor-pointer p-6 transition-all transform hover:-translate-y-1 relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-800 uppercase">{cuenta.cliente}</h4>
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{cuenta.id}</span>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded-full text-orange-600"><Edit size={20} /></div>
                                </div>
                                <div className="mb-4 text-sm text-gray-500 max-h-24 overflow-hidden relative">
                                    {cuenta.cuenta.length === 0 ? <span className="italic opacity-50">Sin pedidos aún</span> : (
                                        <ul className="space-y-1">
                                            {cuenta.cuenta.slice(0, 3).map((item, idx) => (<li key={idx} className="flex justify-between"><span>{item.cantidad || 1}x {item.nombre}</span></li>))}
                                            {cuenta.cuenta.length > 3 && <li className="text-xs font-bold pt-1">...y {cuenta.cuenta.length - 3} más</li>}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex justify-between items-end border-t pt-4">
                                    <span className="text-sm text-gray-500">{cuenta.cuenta.length} items</span>
                                    <span className="text-2xl font-bold text-gray-900">${cuenta.total}</span>
                                </div>
                            </div>
                        ))}
                    </div> 
                )} 
            </div> 
            <div className="p-4 bg-white border-t border-gray-200">
                <button onClick={() => setModalCrearOpen(true)} className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2"><PlusCircle /> Agregar Cuenta Manualmente</button>
            </div> 
            <ModalFusionCuentas isOpen={modalUnirOpen} onClose={() => setModalUnirOpen(false)} cuentas={mesa.cuentas} onConfirmarFusion={(destino, origenes) => { onUnirCuentas(mesa.id, destino, origenes); setModalUnirOpen(false); }} /> 
            <ModalNuevaCuentaMesa isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} onConfirm={(nombre) => { onCrearCuenta(mesa.id, nombre); setModalCrearOpen(false); }} /> 
        </div> 
    ); 
};

// COMPONENTE PARA TOMAR LA ORDEN (COMANDA)
export const VistaDetalleCuenta = ({ sesion, productos, onCerrar, onAgregarProducto, onPagarCuenta, onActualizarProducto, onCancelarCuenta, onDividirCuentaManual, onDesunirCuentas }) => {
    if (!sesion) return null;
    const nombreCliente = sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente;
    const identificador = sesion.tipo === 'llevar' ? 'Para Llevar' : sesion.nombreMesa;
    
    const [montoRecibido, setMontoRecibido] = useState('');
    const [confirmacionPagoOpen, setConfirmacionPagoOpen] = useState(false);
    const [confirmacionCancelarOpen, setConfirmacionCancelarOpen] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false); 
    const [modalDividirManualOpen, setModalDividirManualOpen] = useState(false); 
    const [modalDesunirOpen, setModalDesunirOpen] = useState(false); 
    const [mostrarControles, setMostrarControles] = useState(true);
    const [comandaVisible, setComandaVisible] = useState(window.innerWidth >= 768);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [productoVerDetalles, setProductoVerDetalles] = useState(null); 
    
    // --- NUEVO ESTADO: CONTROL DE CONFIRMACIÓN AL ELIMINAR ITEM ---
    const [itemParaEliminar, setItemParaEliminar] = useState(null);

    // --- FUNCIÓN SEGURA PARA ACTUALIZAR ---
    const handleUpdate = (e, idItem, cantidad, origenItem) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!sesion.id || !idItem) {
            console.error("Error: Falta ID de sesión o de producto", { sesionId: sesion.id, idItem });
            return;
        }
        onActualizarProducto(sesion.id, idItem, cantidad, origenItem);
    };

    const handleImprimir = () => { 
        const datosTicket = { 
            id: sesion.id, 
            cliente: nombreCliente, 
            items: sesion.cuenta, 
            total: sesion.total || 0,
            recibido: montoRecibido, 
            cambio: montoRecibido ? parseFloat(montoRecibido) - (sesion.total || 0) : 0
        }; 
        imprimirTicket(datosTicket, 'ticket'); 
    };

    const handleConfirmarPago = () => {
        if (procesandoPago) return; 
        setProcesandoPago(true); 
        setConfirmacionPagoOpen(false); 
        onPagarCuenta(sesion); 
    };

    const total = sesion.total || 0;
    const cambio = montoRecibido ? parseFloat(montoRecibido) - total : 0;

    const productosFiltrados = useMemo(() => {
        const filtrados = productos.filter(p => {
            const matchNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const matchCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
            return matchNombre && matchCategoria;
        });
        return filtrados.sort((a, b) => {
            if (a.pausado && !b.pausado) return 1; 
            if (!a.pausado && b.pausado) return -1;
            return a.nombre.localeCompare(b.nombre);
        });
    }, [productos, busqueda, categoriaFiltro]);

    // Renderizado de items de la lista
    const renderListaItems = (itemsOrigen, esPersonal) => {
        return itemsOrigen.map((item, idx) => {
            const cantidad = item.cantidad || 1; 
            const subtotalItem = item.precio * cantidad; 
            const productoReal = productos.find(p => p.id === item.id); 
            const estaPausado = productoReal?.pausado;
            const origenItem = item.origen || (esPersonal ? 'personal' : 'cliente');

            return (
                <div key={`${esPersonal ? 'personal' : 'cliente'}-${idx}-${item.id}`} className={`flex justify-between items-start border-b ${esPersonal ? 'border-blue-100' : 'border-gray-100'} py-3 last:border-0`}>
                    <div className="flex flex-col pr-2 flex-1 justify-center">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm uppercase leading-tight">{item.nombre}</p>
                            {estaPausado && <span className="bg-red-100 text-red-600 text-[9px] px-1 rounded font-bold">PAUSADO</span>}
                        </div>
                        <p className={`text-xs mt-1 ${esPersonal ? 'text-blue-400' : 'text-gray-400'}`}>{item.categoria || 'General'}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        
                        {/* --- CAMBIO AQUÍ: Agregamos el desglose visual --- */}
                        <span className={`text-[10px] font-medium ${esPersonal ? 'text-blue-400' : 'text-gray-400'}`}>
                            ${item.precio} x {cantidad}
                        </span>
                        {/* ------------------------------------------------ */}
                        
                        <span className={`font-bold text-lg ${esPersonal ? 'text-blue-900' : 'text-gray-900'}`}>${subtotalItem.toFixed(2)}</span>
                        
                        <div className={`flex items-center gap-1 p-1 rounded-lg z-10 relative ${esPersonal ? 'bg-white border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                            {/* BOTÓN RESTAR CON CONFIRMACIÓN AL LLEGAR A CERO */}
                            <button type="button" onClick={(e) => {
                                if (cantidad === 1) {
                                    setItemParaEliminar({ item, cantidad: 1, origen: origenItem }); 
                                } else {
                                    handleUpdate(e, item.id, -1, origenItem);
                                }
                            }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white rounded-full transition border border-transparent hover:border-gray-200"><MinusCircle size={18}/></button>
                            
                            <span className="font-bold text-gray-700 text-sm w-6 text-center select-none">{cantidad}</span>
                            
                            {/* BOTÓN SUMAR (RESTAURADO PARA TODOS) */}
                            <button type="button" onClick={(e) => !estaPausado && handleUpdate(e, item.id, 1, origenItem)} className={`w-7 h-7 flex items-center justify-center rounded-full transition border border-transparent hover:border-gray-200 ${estaPausado ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-orange-600 hover:bg-white'}`}><PlusCircle size={18}/></button>

                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                            
                            {/* BOTÓN ELIMINAR CON CONFIRMACIÓN */}
                            <button type="button" onClick={(e) => setItemParaEliminar({ item, cantidad: cantidad, origen: origenItem })} className="w-7 h-7 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"><Trash2 size={18}/></button>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex animate-fade-in-up">
            {/* IZQUIERDA: MENÚ */}
            <div className={`${comandaVisible ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full overflow-hidden border-r border-gray-300 relative`}>
                <div className="bg-white p-4 shadow-sm z-20 flex justify-between items-center border-b border-gray-100">
                    <div><h2 className="text-2xl font-bold text-gray-800">Menú Comanda</h2><p className="text-sm text-gray-500">{identificador} • <span className="font-bold text-orange-600">{nombreCliente}</span></p></div>
                    <button onClick={onCerrar} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold"><ArrowLeft size={20} /> Volver</button>
                </div>
                <div className="bg-white/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-gray-200 shadow-sm">
                    <div className="relative mb-3"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-gray-400" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />{busqueda && (<button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>)}</div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1"><button onClick={() => setCategoriaFiltro('Todas')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === 'Todas' ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>Todas</button>{ORDEN_CATEGORIAS.map(cat => (<button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === cat ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>{cat}</button>))}</div>
                </div>
                
                {/* LISTA DE PRODUCTOS (GRID RESPONSIVO) */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {ORDEN_CATEGORIAS.map(cat => { 
                        if (categoriaFiltro !== 'Todas' && categoriaFiltro !== cat) return null; 
                        const prods = productosFiltrados.filter(p => p.categoria === cat); 
                        if (prods.length === 0) return null; 
                        
                        return (
                            <div key={cat} className="mb-8 animate-fade-in-up">
                                <h3 className="font-bold text-gray-800 text-xl border-b border-gray-200 mb-4 pb-2 flex items-center gap-2">
                                    {cat} <span className="text-xs font-normal text-white bg-orange-500 px-2 py-0.5 rounded-full shadow-sm">{prods.length}</span>
                                </h3>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {prods.map(prod => (
                                        <div key={prod.id} className="h-full">
                                            <CardProducto 
                                                producto={prod} 
                                                onClick={() => setProductoVerDetalles(prod)} // Abre modal
                                                onAdd={(p) => onAgregarProducto(sesion.id, p, 1)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!comandaVisible && (
                    <div className="absolute bottom-6 right-6 z-50 animate-bounce-in">
                        <button onClick={() => setComandaVisible(true)} className="bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-lg hover:bg-gray-800 transition transform hover:scale-105 border-2 border-orange-500">
                            <Receipt size={24} className="text-orange-400"/> <span>Ver Cuenta</span><span className="bg-white text-gray-900 px-2 py-0.5 rounded text-sm">${total.toFixed(2)}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* DERECHA: TICKET / CUENTA */}
            {comandaVisible && (
                <div className="w-full md:w-96 bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 animate-fade-in">
                    <div className="p-6 bg-gray-900 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className="text-xl font-bold">Comanda</h3><p className="text-gray-400 text-xs font-mono">{sesion.id}</p></div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setComandaVisible(false)} className="text-gray-400 hover:text-white transition p-1 rounded-md hover:bg-gray-800" title="Ocultar Comanda"><ChevronRight size={24} /></button>
                                <Receipt className="text-orange-400" />
                            </div>
                        </div>
                        <div className="bg-gray-800 p-2 rounded text-xs mb-2"><p className="text-gray-300">Cliente: <span className="text-white font-bold">{nombreCliente}</span></p>{sesion.telefono && <p className="text-gray-300">Tel: <span className="text-white">{sesion.telefono}</span></p>}</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {(!sesion.cuenta || sesion.cuenta.length === 0) ? ( 
                            <div className="text-center text-gray-400 py-10 italic">Cuenta vacía.<br />Selecciona productos.</div> 
                        ) : ( 
                            <>
                                {sesion.cuenta.some(i => i.origen !== 'personal') && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                                            <div className="bg-orange-100 p-1 rounded text-orange-600"><Smartphone size={12}/></div>
                                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Pedido Confirmado por Cliente</p>
                                        </div>
                                        <div className="space-y-1">
                                            {renderListaItems(sesion.cuenta.filter(i => i.origen !== 'personal'), false)}
                                        </div>
                                    </div>
                                )}
                                {sesion.cuenta.some(i => i.origen === 'personal') && (
                                    <div className="mb-2 mt-4">
                                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-blue-100 bg-blue-50/50 p-1 rounded-t">
                                            <div className="bg-blue-100 p-1 rounded text-blue-600"><Coffee size={12}/></div>
                                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Adicionales (Solicitado a Personal)</p>
                                        </div>
                                        <div className="space-y-1 bg-blue-50/20 p-2 rounded-b border border-t-0 border-blue-50">
                                            {renderListaItems(sesion.cuenta.filter(i => i.origen === 'personal'), true)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-200 transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-600">Total</span>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-gray-900">${sesion.total || 0}</span>
                                <button onClick={() => setMostrarControles(!mostrarControles)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600 transition" title={mostrarControles ? "Ocultar controles" : "Mostrar controles"}>
                                    {mostrarControles ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
                                </button>
                            </div>
                        </div>

                        {mostrarControles && (
                            <div className="animate-fade-in">
                                <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4 shadow-sm"><label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Calculator size={12}/> Calculadora de Cambio</label><div className="flex gap-3 items-center"><div className="flex-1"><input type="number" placeholder="Recibido..." className="w-full p-2 border rounded-lg font-bold text-gray-700 text-sm focus:border-orange-500 focus:outline-none" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} /></div><div className="flex-1 text-right"><p className="text-[10px] text-gray-400 uppercase font-bold">Cambio a dar</p><p className={`text-xl font-bold ${cambio < 0 ? 'text-red-400' : 'text-green-600'}`}>{montoRecibido ? cambio.toFixed(2) : '0.00'}</p></div></div></div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={handleImprimir} disabled={!sesion.cuenta || sesion.cuenta.length === 0} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex justify-center items-center gap-2 transition"><Printer size={20} /> Imprimir Cuenta</button>
                                    <button onClick={() => setConfirmacionPagoOpen(true)} disabled={!sesion.cuenta || sesion.cuenta.length === 0 || procesandoPago} className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${(!sesion.cuenta || sesion.cuenta.length === 0 || procesandoPago) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02]'}`}>{procesandoPago ? <Loader className="animate-spin" size={20} /> : <DollarSign size={20} />} {procesandoPago ? 'Procesando...' : 'Cerrar Cuenta y Pagar'}</button>
                                    
                                    <div className="flex gap-2">
                                        {sesion.tipo === 'mesa' && (<button onClick={() => setModalDividirManualOpen(true)} className="flex-1 mt-2 py-2 rounded-lg text-xs font-bold text-purple-500 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 flex justify-center items-center gap-1 transition"><Split size={14}/> Separar por Items</button>)}
                                        {sesion.tipo === 'mesa' && sesion.historicoFusion && sesion.historicoFusion.length > 0 && (<button onClick={() => setModalDesunirOpen(true)} className="flex-1 mt-2 py-2 rounded-lg text-xs font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 flex justify-center items-center gap-1 transition"><Undo2 size={14}/> Deshacer Unión</button>)}
                                        <button onClick={() => setConfirmacionCancelarOpen(true)} className="flex-1 mt-2 py-2 rounded-lg text-xs font-bold text-red-400 bg-red-50 hover:text-red-600 hover:bg-red-100 flex justify-center items-center gap-1 transition"><Trash2 size={14}/> Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALES */}
            <ModalInfoProducto 
                isOpen={!!productoVerDetalles} 
                onClose={() => setProductoVerDetalles(null)} 
                producto={productoVerDetalles} 
                onAgregar={(prod, cant) => onAgregarProducto(sesion.id, prod, cant)} 
            />
            
            <ModalConfirmacion isOpen={confirmacionPagoOpen} onClose={() => !procesandoPago && setConfirmacionPagoOpen(false)} onConfirm={handleConfirmarPago} titulo="¿Confirmar Cobro?" mensaje={`Se cerrará la cuenta de ${nombreCliente} por un total de $${total.toFixed(2)}.`} tipo="pago" />
            <ModalConfirmacion isOpen={confirmacionCancelarOpen} onClose={() => setConfirmacionCancelarOpen(false)} onConfirm={() => { onCancelarCuenta(sesion); setConfirmacionCancelarOpen(false); }} titulo="¿Cancelar Cuenta?" mensaje="La cuenta se moverá a la 'Papelera', tendrás el resto del día por si necesitas recuperarlo. Después se eliminará permanentemente." />
            
            <ModalDividirItems isOpen={modalDividirManualOpen} onClose={() => setModalDividirManualOpen(false)} cuenta={sesion} onConfirm={(nombre, items) => { onDividirCuentaManual(sesion.id, nombre, items); }} />
            <ModalDesunirCuentas isOpen={modalDesunirOpen} onClose={() => setModalDesunirOpen(false)} cuenta={sesion} onConfirm={(ids) => { onDesunirCuentas(sesion.idMesa, sesion.id, ids); }} />
            
            {/* NUEVO MODAL DE CONFIRMACIÓN PARA ELIMINAR ITEM */}
            <ModalConfirmacion 
                isOpen={!!itemParaEliminar} 
                onClose={() => setItemParaEliminar(null)} 
                onConfirm={() => {
                    if (itemParaEliminar) {
                        onActualizarProducto(sesion.id, itemParaEliminar.item.id, -itemParaEliminar.cantidad, itemParaEliminar.origen);
                        setItemParaEliminar(null);
                    }
                }}
                titulo="¿Eliminar Producto?" 
                mensaje={itemParaEliminar ? `¿Estás seguro de quitar "${itemParaEliminar.item.nombre}" de la cuenta?` : ''}
                tipo="eliminar" 
            />
        </div>
    );
};

// --- COMPONENTE GESTIÓN DE MESAS MODIFICADO ---
export const VistaGestionMesas = ({ mesas, onAgregarMesa, onEliminarMesa, servicioActivo }) => { // <--- (3) Recibimos servicioActivo
    const [qrData, setQrData] = useState(null); 
    const [mesaAEliminar, setMesaAEliminar] = useState(null); 
    
    // Estado para confirmar el cambio de switch
    const [confirmarSwitch, setConfirmarSwitch] = useState(false);

    // --- NUEVO ESTADO: Para controlar si se ve o no el simulador ---
    const [mostrarSimulador, setMostrarSimulador] = useState(false);

    return ( 
        <div className="p-8 h-screen overflow-y-auto relative"> 
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Configuración de Mesas</h2>
                
                {/* --- NUEVO BOTÓN INTERRUPTOR (TOGGLE) --- */}
                <button 
                    onClick={() => setConfirmarSwitch(true)}
                    className={`px-5 py-3 rounded-xl font-bold text-white shadow-md flex items-center gap-3 transition-all transform active:scale-95 ${servicioActivo ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <Power size={18} />
                    </div>
                    <div className="text-left leading-tight">
                        <span className="block text-[10px] uppercase opacity-80 font-bold">Estado QRs</span>
                        <span className="block text-sm">{servicioActivo ? 'ACTIVO (ON)' : 'APAGADO (OFF)'}</span>
                    </div>
                </button>
                {/* ---------------------------------------- */}
            </div>

            <div className="mb-10"> 
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-800 flex items-center"><Grid className="mr-2" /> Disposición de Mesas QR's</h3>
                    <button onClick={onAgregarMesa} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 flex items-center gap-2"><PlusCircle size={18} /> Agregar Mesa</button>
                </div> 
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"> 
                    {mesas.map(mesa => ( 
                        <div key={mesa.id} className={`relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[160px] bg-white transition group ${!servicioActivo ? 'opacity-50 border-gray-200 grayscale' : 'border-gray-200 hover:border-orange-300'}`}> 
                            <IconoQR size={40} className={`mb-2 transition-colors ${!servicioActivo ? 'text-gray-300' : 'text-gray-300 group-hover:text-orange-500'}`} /> 
                            <h3 className="font-bold text-lg text-gray-600">{mesa.nombre}</h3> 
                            <div className="flex gap-2 mt-3 w-full">
                                {/* --- CAMBIO 2: USAMOS LA FUNCIÓN DINÁMICA --- */}
                                <button onClick={() => setQrData({ titulo: mesa.nombre, sub: `Escanea para pedir en ${mesa.nombre}`, val: `${OBTENER_URL_BASE()}/mesa/${mesa.id}` })} className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded text-gray-700 font-bold">Ver/Imprimir QR</button>
                            </div> 
                            <button onClick={(e) => { e.stopPropagation(); setMesaAEliminar(mesa); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={14} /></button> 
                        </div> 
                    ))} 
                </div> 
            </div> 
            
            <div className="mt-8 border-t pt-8"> 
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ShoppingBag className="mr-2 text-orange-500" /> Código QR "Para Llevar"</h3> 
                <div className={`bg-orange-50 p-6 rounded-xl border border-orange-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${!servicioActivo ? 'opacity-50 grayscale' : ''}`}> 
    
    {/* Contenedor del Texto: Ocupa todo el ancho en móvil */}
    <div className="w-full md:flex-1">
        <h4 className="font-bold text-orange-900 text-lg mb-2">QR General para Mostrador</h4>
        <p className="text-sm text-orange-700 text-justify leading-relaxed">
            Utiliza este código para clientes que no ocupan mesa pero desean ordenar para llevar.
        </p>
    </div> 
    
    {/* Botón: Debajo del texto en móvil (full width), a la derecha en PC */}
    <button 
        onClick={() => setQrData({ titulo: "Para Llevar", sub: "Menú Digital General", val: `${OBTENER_URL_BASE()}/llevar` })} 
        className="w-full md:w-auto bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 flex items-center justify-center gap-2 transition-transform active:scale-95"
    >
        <IconoQR size={20} /> Ver/Imprimir QR
    </button> 
</div>
            </div> 
            
            {/* --- AQUÍ ESTÁ EL CAMBIO PRINCIPAL: SIMULADOR FLOTANTE --- */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
                {/* El contenedor del panel solo se renderiza si mostrarSimulador es true */}
                {mostrarSimulador && (
                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-72 mb-4 animate-fade-in-up pointer-events-auto"> 
                        <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                            <p className="text-xs font-bold uppercase text-orange-600 flex items-center gap-2"><Smartphone size={16}/> Simulador QR</p>
                            <button onClick={() => setMostrarSimulador(false)} className="text-gray-400 hover:text-gray-600"><ChevronDown size={16}/></button>
                        </div> 
                        <p className="text-[11px] text-gray-400 mb-3">Haz clic abajo para abrir la vista del cliente en una nueva pestaña.</p> 
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {mesas.map(m => (
                                <button key={m.id} onClick={() => window.open(`/mesa/${m.id}`, '_blank')} className="w-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-xs font-bold py-2 px-3 rounded-lg border border-gray-200 hover:border-blue-200 transition text-left flex items-center gap-2">
                                    <IconoQR size={14} className="opacity-50"/> Simular {m.nombre}
                                </button>
                            ))}
                        </div> 
                        <button onClick={() => window.open('/llevar', '_blank')} className="w-full bg-gray-900 text-white text-xs font-bold py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 transition shadow-lg border border-gray-900">
                            <ShoppingBag size={14}/> Simular "Para Llevar"
                        </button> 
                    </div> 
                )}

                {/* Botón flotante siempre visible (pequeño) */}
                <button 
                    onClick={() => setMostrarSimulador(!mostrarSimulador)} 
                    className={`pointer-events-auto h-12 px-4 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 border ${mostrarSimulador ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-600 border-orange-200 hover:text-orange-600'}`}
                    title="Herramientas de Simulación"
                >
                    {mostrarSimulador ? (
                        <>Cerrar <ChevronDown size={18}/></>
                    ) : (
                        <><Smartphone size={18} className="text-orange-500"/> <span className="text-xs">Simular</span></>
                    )}
                </button>
            </div>
            
            <ModalQR isOpen={!!qrData} onClose={() => setQrData(null)} titulo={qrData?.titulo} subtitulo={qrData?.sub} valorQR={qrData?.val} /> 
            <ModalConfirmacion isOpen={!!mesaAEliminar} onClose={() => setMesaAEliminar(null)} onConfirm={() => { onEliminarMesa(mesaAEliminar.id); setMesaAEliminar(null); }} titulo={`¿Eliminar ${mesaAEliminar?.nombre}?`} mensaje="Si eliminas esta mesa, el código QR dejará de funcionar. ¿Estás seguro?" /> 
            
            {/* --- MODAL CONFIRMACIÓN SWITCH --- */}
            <ModalConfirmacion 
                isOpen={confirmarSwitch} 
                onClose={() => setConfirmarSwitch(false)} 
                onConfirm={() => {
                    cambiarEstadoServicio(!servicioActivo);
                    setConfirmarSwitch(false);
                }} 
                titulo={servicioActivo ? "¿Apagar Servicio QR?" : "¿Activar Servicio QR?"} 
                mensaje={servicioActivo 
                    ? "Al apagarlo, los clientes verán una pantalla de 'Servicio Cerrado' al escanear los códigos y no podrán hacer pedidos." 
                    : "Los códigos QR volverán a funcionar y los clientes podrán ver el menú."}
                tipo={servicioActivo ? "eliminar" : "pago"} // Usamos "eliminar" para rojo y "pago" para verde
            />
        </div> 
    ); 
};

export const VistaMenuCafeteria = ({ productos, onGuardarProducto, onEliminarProducto }) => {
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [modalProductoOpen, setModalProductoOpen] = useState(false);
    const [productoAEditar, setProductoAEditar] = useState(null);
    const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
    const [categoriasOrdenadas, setCategoriasOrdenadas] = useState(CATEGORIAS_INICIALES);
    const [modalCategoriasOpen, setModalCategoriasOpen] = useState(false);
    const [verPausados, setVerPausados] = useState(false);
    const [productoParaEliminar, setProductoParaEliminar] = useState(null);

    useEffect(() => {
        const catsExistentes = [...new Set(productos.map(p => p.categoria))];
        const nuevasCats = catsExistentes.filter(c => !categoriasOrdenadas.includes(c));
        if (nuevasCats.length > 0) {
            setCategoriasOrdenadas([...categoriasOrdenadas, ...nuevasCats]);
        }
    }, [productos]);

    const mostrarNotificacion = (mensaje, tipo = 'exito') => {
        setNotificacion({ visible: true, mensaje, tipo });
        setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000);
    };

    const productosFiltrados = useMemo(() => {
        let filtrados = productos;
        if (verPausados) {
            filtrados = filtrados.filter(p => p.pausado);
        }
        if (busqueda) {
            filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
        }
        if (categoriaFiltro !== 'Todas') {
            filtrados = filtrados.filter(p => p.categoria === categoriaFiltro);
        }
        return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [productos, busqueda, categoriaFiltro, verPausados]);

    const toggleVerPausados = () => {
        if (!verPausados) {
            setCategoriaFiltro('Todas');
        }
        setVerPausados(!verPausados);
    };

    const handleGuardarWrapper = (prod) => {
        onGuardarProducto(prod);
    };

    const handleEliminarProductoWrapper = (id) => {
        setProductoParaEliminar(id);
    };

    const confirmarEliminacionDefinitiva = () => {
        if (productoParaEliminar) {
            onEliminarProducto(productoParaEliminar);
            setProductoParaEliminar(null);
            setModalProductoOpen(false); 
        }
    };

    const toggleDisponibilidad = (producto) => {
        const productoActualizado = { ...producto, pausado: !producto.pausado };
        onGuardarProducto(productoActualizado, false); 
        mostrarNotificacion(productoActualizado.pausado ? "Producto pausado" : "Producto activado", "info");
    };

    const cantidadPausados = productos.filter(p => p.pausado).length;

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50 pb-32">
            <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
            <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3"><Coffee size={40} className="text-orange-600"/> Menú de Cafetería</h2>
                <p className="text-gray-500 mt-1">Gestiona tus productos, precios y categorías.</p>
            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 sticky top-2 z-20">
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-start md:items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input type="text" placeholder="Buscar producto para editar..." className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        {busqueda && (<button onClick={() => setBusqueda('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>)}
                    </div>
                    
                    {/* --- AQUÍ ESTÁ EL CAMBIO: Grid en móvil, Flex en PC --- */}
                    <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex">
                        <button onClick={toggleVerPausados} className={`col-span-1 md:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-xs md:text-sm border ${verPausados ? 'bg-red-600 text-white border-red-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`} title={verPausados ? "Ver Todo" : "Ver Solo Pausados"}>
                            {verPausados ? <EyeOff size={16}/> : <PauseCircle size={16}/>} {verPausados ? "Todos" : "Pausados"}
                            {!verPausados && cantidadPausados > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 rounded-full">{cantidadPausados}</span>}
                        </button>
                        
                        <button onClick={() => setModalCategoriasOpen(true)} className="col-span-1 md:flex-none bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-xs md:text-sm">
                            <Settings size={16}/> Categorías
                        </button>
                        
                        <button onClick={() => { setProductoAEditar(null); setModalProductoOpen(true); }} className="col-span-2 md:flex-none bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-xs md:text-sm">
                            <PlusCircle size={16}/> Nuevo Producto
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => { setCategoriaFiltro('Todas'); setVerPausados(false); }} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === 'Todas' && !verPausados ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>Todas</button>
                    {categoriasOrdenadas.map(cat => (
                        <button key={cat} onClick={() => { setCategoriaFiltro(cat); setVerPausados(false); }} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === cat && !verPausados ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* GRID DE PRODUCTOS */}
            <div className="space-y-8 relative z-0">
                {verPausados ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
                        {productosFiltrados.length === 0 ? (
                            <div className="col-span-full w-full text-center py-12 opacity-60"><CheckCircle size={48} className="mx-auto mb-3 text-green-500"/><p className="text-gray-500 font-medium">¡Excelente! No hay productos pausados.</p><button onClick={() => setVerPausados(false)} className="mt-4 text-orange-600 text-sm font-bold hover:underline">Volver al menú</button></div>
                        ) : (
                            productosFiltrados.map(producto => (
                                <div key={producto.id} className="relative group overflow-hidden rounded-xl shadow-sm border border-gray-100"> 
                                    <CardProducto producto={producto} onClick={() => { setProductoAEditar(producto); setModalProductoOpen(true); }} />
                                    
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <button onClick={(e) => { e.stopPropagation(); toggleDisponibilidad(producto); }} className={`p-2 rounded-full shadow-lg border border-gray-200 transition-all transform hover:scale-110 ${producto.pausado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`} title={producto.pausado ? "Reanudar Venta" : "Pausar Venta"}>
                                            {producto.pausado ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                                        </button>
                                        
                                        <button onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setProductoAEditar(producto); 
                                            setModalProductoOpen(true); 
                                        }} className="p-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-blue-50 border border-gray-200 transform hover:scale-110 transition-all" title="Editar">
                                            <Edit size={18} />
                                        </button>

                                        <button onClick={(e) => { e.stopPropagation(); handleEliminarProductoWrapper(producto.id); }} className="p-2 bg-white text-red-600 rounded-full shadow-lg hover:bg-red-50 border border-gray-200 transform hover:scale-110 transition-all" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    categoriasOrdenadas.map(categoria => {
                        if (categoriaFiltro !== 'Todas' && categoriaFiltro !== categoria) return null;
                        const productosCat = productosFiltrados.filter(p => p.categoria === categoria);
                        if (productosCat.length === 0) return null;
                        return (
                            <section key={categoria} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Tag size={20} className="text-orange-500"/> {categoria} <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{productosCat.length}</span></h3>
                                    <button onClick={() => setModalCategoriasOpen(true)} className="text-gray-400 hover:text-orange-600 p-2 rounded-full hover:bg-orange-50 transition" title="Editar Categoría"><Edit size={16}/></button>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {productosCat.map(producto => (
                                        <div key={producto.id} className="relative group overflow-hidden rounded-xl shadow-sm border border-gray-50"> 
                                            <CardProducto producto={producto} onClick={() => { setProductoAEditar(producto); setModalProductoOpen(true); }} />
                                            
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                                <button onClick={(e) => { e.stopPropagation(); toggleDisponibilidad(producto); }} className={`p-2 rounded-full shadow-lg border border-gray-200 transition-all transform hover:scale-110 ${producto.pausado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`} title={producto.pausado ? "Reanudar Venta" : "Pausar Venta"}>
                                                    {producto.pausado ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                                                </button>
                                                
                                                <button onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setProductoAEditar(producto); 
                                                    setModalProductoOpen(true); 
                                                }} className="p-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-blue-50 border border-gray-200 transform hover:scale-110 transition-all" title="Editar">
                                                    <Edit size={18} />
                                                </button>

                                                <button onClick={(e) => { e.stopPropagation(); handleEliminarProductoWrapper(producto.id); }} className="p-2 bg-white text-red-600 rounded-full shadow-lg hover:bg-red-50 border border-gray-200 transform hover:scale-110 transition-all" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}
                {!verPausados && productosFiltrados.length === 0 && (
                    <div className="text-center py-12 opacity-60 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Search size={48} className="mx-auto mb-3 text-gray-300"/>
                        <p className="text-gray-500 font-medium">No encontramos productos con "{busqueda}".</p>
                        <button onClick={() => {setBusqueda(''); setCategoriaFiltro('Todas');}} className="mt-4 text-orange-600 text-sm font-bold hover:underline">Limpiar filtros</button>
                    </div>
                )}
            </div>

            <ModalProducto 
                isOpen={modalProductoOpen} 
                onClose={() => { setModalProductoOpen(false); setProductoAEditar(null); }} 
                producto={productoAEditar} 
                onGuardar={handleGuardarWrapper} 
                onEliminar={handleEliminarProductoWrapper} 
                categoriasDisponibles={categoriasOrdenadas} 
            />
            
            <ModalGestionarCategorias 
                isOpen={modalCategoriasOpen} 
                onClose={() => setModalCategoriasOpen(false)} 
                categorias={categoriasOrdenadas} 
                setCategorias={setCategoriasOrdenadas} 
                productos={productos} 
                setProductos={onGuardarProducto} 
                mostrarNotificacion={mostrarNotificacion} 
            />

            <ModalConfirmacion 
                isOpen={!!productoParaEliminar} 
                onClose={() => setProductoParaEliminar(null)} 
                onConfirm={confirmarEliminacionDefinitiva} 
                titulo="¿Eliminar Producto?" 
                mensaje="Esta acción eliminará el producto permanentemente del menú. ¿Estás seguro?" 
                tipo="eliminar"
            />
        </div>
    );
};
export const VistaInicioCafeteria = ({ mesas, pedidosLlevar, ventasHoy = [], cancelados = [], onSeleccionarMesa, onCrearLlevar, onAbrirLlevar, onRestaurarVenta, onDeshacerCancelacion, onVaciarPapelera, onEliminarDePapelera }) => { 
    const [modalLlevarOpen, setModalLlevarOpen] = useState(false); 
    const [modalHistorial, setModalHistorial] = useState({ open: false, tipo: 'vendidos' }); 
    const [modalCorteOpen, setModalCorteOpen] = useState(false); 
    
    const mesasOcupadas = mesas.filter(m => m.cuentas.length > 0).length; 
    const pedidosActivos = pedidosLlevar.length; 
    const cantidadVentas = ventasHoy.length; 
    const totalIngresos = ventasHoy.reduce((acc, v) => acc + v.total, 0);

    // --- CAMBIO: Ordenar pedidos Para Llevar (El más viejo arriba) ---
    const pedidosLlevarOrdenados = useMemo(() => {
        return [...pedidosLlevar].sort((a, b) => {
            // Prioridad 1: Timestamp (Fecha de creación)
            if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
            // Prioridad 2: Hora (String)
            if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
            // Fallback: ID (suponiendo ID secuencial)
            return (a.id || '').localeCompare(b.id || '');
        });
    }, [pedidosLlevar]);
    // ---------------------------------------------------------------

    return ( 
        <div className="p-4 md:p-8 bg-gray-50 min-h-full"> 
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Cafetería - Operaciones en Vivo</h2> 
            
            {/* ... (Las tarjetas de estadísticas se quedan igual) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8"> 
                <div className="p-6 rounded-xl shadow-sm border-l-4 border-orange-500 bg-white flex justify-between items-center transition-colors hover:bg-orange-50"><div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Mesas Ocupadas</p><p className="text-3xl font-bold text-gray-800 mt-2">{mesasOcupadas} / {mesas.length}</p></div><div className="text-orange-300 opacity-50"><Grid size={30} /></div></div> 
                <div className="p-6 rounded-xl shadow-sm border-l-4 border-blue-500 bg-white flex justify-between items-center transition-colors hover:bg-blue-50"><div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Para Llevar</p><p className="text-3xl font-bold text-gray-800 mt-2">{pedidosActivos}</p></div><div className="text-blue-300 opacity-50"><ShoppingBag size={30} /></div></div> 
                <div onClick={() => setModalHistorial({ open: true, tipo: 'vendidos' })} className="p-6 rounded-xl shadow-sm border-l-4 border-green-500 bg-white flex justify-between items-center cursor-pointer hover:bg-green-50 transition-colors group"><div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Vendidos Hoy</p><p className="text-3xl font-bold text-gray-800 mt-2">{cantidadVentas}</p></div><div className="text-green-300 opacity-50 group-hover:text-green-500 group-hover:opacity-100 transition"><CheckCircle size={30} /></div></div> 
                <div onClick={() => setModalHistorial({ open: true, tipo: 'cancelados' })} className="p-6 rounded-xl shadow-sm border-l-4 border-red-500 bg-white flex justify-between items-center cursor-pointer hover:bg-red-50 transition-colors group"><div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Papelera</p><p className="text-3xl font-bold text-gray-800 mt-2">{cancelados.length}</p></div><div className="text-red-300 opacity-50 group-hover:text-red-500 group-hover:opacity-100 transition"><ArchiveRestore size={30} /></div></div> 
                <div onClick={() => setModalCorteOpen(true)} className="p-6 rounded-xl shadow-sm border-l-4 border-emerald-500 bg-white flex justify-between items-center cursor-pointer hover:bg-emerald-50 transition-colors group"><div><p className="text-gray-500 text-xs uppercase font-bold tracking-wide">Total Caja Hoy</p><p className="text-3xl font-bold text-gray-800 mt-2">${totalIngresos.toFixed(0)}</p></div><div className="text-emerald-300 opacity-50 group-hover:text-emerald-500 group-hover:opacity-100 transition"><DollarSign size={30} /></div></div> 
            </div> 

            <div className="flex flex-col xl:flex-row gap-8"> 
                {/* SECCIÓN MESAS (Se mantienen estáticas por ubicación, el contenido de la mesa se ordenó en el otro componente) */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center"><Grid className="mr-2"/> Mesas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mesas.map(mesa => { 
                            const ocupada = mesa.cuentas.length > 0; 
                            const totalMesa = mesa.cuentas.reduce((acc, c) => acc + c.total, 0); 
                            return (
                                <div key={mesa.id} onClick={() => onSeleccionarMesa(mesa.id)} className={`p-6 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg min-h-[140px] ${ocupada ? 'bg-white border-orange-200 hover:border-orange-400' : 'bg-white border-gray-200 hover:border-green-400'}`}>
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-lg ${ocupada ? 'text-orange-700' : 'text-gray-600'}`}>{mesa.nombre}</h4>
                                        <div className={`w-3 h-3 rounded-full ${ocupada ? 'bg-orange-500 animate-pulse' : 'bg-green-400'}`}></div>
                                    </div>
                                    {ocupada ? (
                                        <div className="mt-2"><p className="text-2xl font-bold text-gray-800">${totalMesa}</p><p className="text-xs text-orange-600 font-bold bg-orange-50 inline-block px-2 py-1 rounded-lg mt-1">{mesa.cuentas.length} cuenta(s)</p></div>
                                    ) : (
                                        <div className="mt-auto"><p className="text-sm text-green-600 font-bold flex items-center bg-green-50 w-fit px-2 py-1 rounded-lg"><PlusCircle size={14} className="mr-1"/> Disponible</p></div>
                                    )}
                                </div>
                            ); 
                        })}
                    </div>
                </div> 
                
                {/* SECCIÓN PARA LLEVAR (AQUÍ APLICAMOS EL ORDEN) */}
                <div className="w-full xl:w-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-700 flex items-center"><ShoppingBag className="mr-2"/> Para Llevar</h3>
                        <button onClick={() => setModalLlevarOpen(true)} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-700 shadow-md transition-transform active:scale-95"><PlusCircle size={20}/></button>
                    </div>
                    {pedidosLlevarOrdenados.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p>No hay pedidos activos.</p></div>
                    ) : (
                        // Usamos pedidosLlevarOrdenados aquí
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                            {pedidosLlevarOrdenados.map(p => (
                                <div key={p.id} onClick={() => onAbrirLlevar(p.id)} className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 cursor-pointer bg-gray-50 hover:bg-white transition group relative">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{p.nombreCliente}</span>
                                        <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded text-gray-400">#{p.id.slice(-4)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">{p.telefono || 'Sin teléfono'}</span>
                                            {/* Opcional: Mostrar hora del pedido si lo deseas */}
                                            {p.hora && <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1 mt-1"><Clock size={10}/> {p.hora}</span>}
                                        </div>
                                        <span className="font-bold text-lg text-gray-900 bg-white px-2 rounded border border-gray-100">${p.cuenta.reduce((a,b)=>a+(b.precio * (b.cantidad || 1)),0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div> 
            </div> 
            
            {/* ... Modales (sin cambios) ... */}
            <ModalNuevoLlevar isOpen={modalLlevarOpen} onClose={() => setModalLlevarOpen(false)} onConfirm={(datos) => { onCrearLlevar(datos); setModalLlevarOpen(false); }} /> 
            <ModalHistorial isOpen={modalHistorial.open} onClose={() => setModalHistorial({ ...modalHistorial, open: false })} tipo={modalHistorial.tipo} items={modalHistorial.tipo === 'vendidos' ? ventasHoy : cancelados} onRestaurar={modalHistorial.tipo === 'vendidos' ? onRestaurarVenta : onDeshacerCancelacion} onVaciarPapelera={onVaciarPapelera} onEliminarDePapelera={onEliminarDePapelera} /> 
            <ModalCorteCaja isOpen={modalCorteOpen} onClose={() => setModalCorteOpen(false)} ventas={ventasHoy} /> 
        </div> 
    ); 
};