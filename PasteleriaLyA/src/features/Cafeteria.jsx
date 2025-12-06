import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Filter, Plus, Edit, Trash2, X, Image as ImageIcon, Upload, Check, 
    Coffee, ChevronRight, DollarSign, Hash, AlignLeft, Tag, RotateCw, RotateCcw, 
    GripVertical, Settings, PlusCircle, Save, AlertTriangle, Smartphone, ShoppingBag, 
    Grid, QrCode, ArrowLeft, Receipt, Users, Printer, Merge, CheckSquare, Square, 
    Cake, Sparkles, AlertCircle, Calculator, MinusCircle,
    CheckCircle, XCircle, Clock, Info, ArchiveRestore // <--- ÍCONO NUEVO AGREGADO
} from 'lucide-react';
import { Notificacion, CardStat, CardProducto, ModalConfirmacion } from '../components/Shared';
import { ORDEN_CATEGORIAS, imprimirTicket } from '../utils/config';

const CATEGORIAS_INICIALES = ['Bebidas Calientes', 'Bebidas Frías', 'Pastelería', 'Bocadillos', 'Otros'];

// --- COMPONENTE 1: MODAL CORTE DE CAJA (ESTILO CAFETERÍA - NARANJA/CAFÉ) ---
const ModalCorteCaja = ({ isOpen, onClose, ventas }) => {
    if (!isOpen) return null;
    const total = ventas.reduce((acc, v) => acc + v.total, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[260] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col">
                <div className="p-5 bg-orange-50 flex justify-between items-center border-b border-orange-100">
                    <div>
                        <h3 className="font-bold text-xl text-orange-900 flex items-center gap-2">
                            <Receipt size={20}/> Corte de Caja
                        </h3>
                        <p className="text-xs text-orange-600">Ingresos registrados hoy.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-orange-100 text-orange-400 transition shadow-sm"><X size={18}/></button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {ventas.length === 0 ? (
                        <div className="text-center py-12 opacity-40">
                            <DollarSign size={48} className="mx-auto mb-2 text-gray-400"/>
                            <p className="text-gray-500 text-sm">No hay ingresos registrados hoy.</p>
                        </div>
                    ) : (
                        ventas.map((venta) => (
                            <div key={venta.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm mb-0.5">{venta.id}</p>
                                    <p className="text-xs text-gray-500 mb-1.5">{venta.cliente}</p>
                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200 uppercase">
                                        VENTA
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-orange-700">+${venta.total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-orange-900 p-5 text-white flex justify-between items-center">
                    <span className="font-bold text-orange-100 text-sm uppercase tracking-wider">Total Recaudado</span>
                    <span className="font-bold text-2xl text-white">${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE 2: MODAL HISTORIAL (ESTILO VENDIDOS / PAPELERA) ---
const ModalHistorial = ({ isOpen, onClose, tipo, items, onRestaurar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [itemParaRestaurar, setItemParaRestaurar] = useState(null);

    useEffect(() => { if (isOpen) setBusqueda(''); }, [isOpen]);

    if (!isOpen) return null;

    const esVenta = tipo === 'vendidos';
    
    // --- CAMBIOS PARA QUE SE VEA COMO LA PAPELERA DE PASTELERÍA ---
    const titulo = esVenta ? 'Vendidos' : 'Papelera';
    const subtitulo = esVenta ? 'Historial de ventas del día.' : 'Las cuentas se eliminan automáticamente en 5 minutos.';
    const colorHeader = esVenta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
    
    // Icono del header (Check para vendidos, Cajita ArchiveRestore para Papelera)
    const iconoHeader = esVenta ? 
        <CheckCircle size={24} className="text-green-600 mr-2"/> : 
        <ArchiveRestore size={24} className="text-red-600 mr-2"/>;
    
    // Icono cuando está vacío (Check para vendidos, Bote de basura Trash2 para Papelera)
    const iconoVacio = esVenta ? 
        <CheckCircle size={48} className="mx-auto mb-2 text-green-300"/> : 
        <Trash2 size={48} className="mx-auto mb-2 text-red-300"/>;

    const itemsFiltrados = items.filter(item => {
        const texto = (item.cliente || item.nombreCliente || '') + (item.id || '');
        return texto.toLowerCase().includes(busqueda.toLowerCase());
    });

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                    <div className={`p-6 ${colorHeader} flex justify-between items-start border-b border-gray-100`}>
                        <div>
                            <h3 className="font-bold text-2xl flex items-center mb-1">{iconoHeader} {titulo}</h3>
                            <p className="text-sm opacity-80">{subtitulo}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition shadow-sm text-gray-500"><X size={20}/></button>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="BUSCAR..." 
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:outline-none bg-gray-50 focus:bg-white transition-all uppercase"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {itemsFiltrados.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                {iconoVacio}
                                <p className="text-gray-500 font-medium">
                                    {esVenta ? 'No hay ventas registradas.' : 'La papelera está vacía.'}
                                </p>
                            </div>
                        ) : (
                            itemsFiltrados.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${esVenta ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {esVenta ? 'VENDIDO' : 'CANCELADO'}
                                            </span>
                                            <span className="text-xs font-mono text-gray-400 font-bold">{item.id}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-lg uppercase">{item.cliente || item.nombreCliente}</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                            <span><span className="font-bold text-gray-700">{item.items || item.cuenta.length}</span> productos</span>
                                            <span>•</span>
                                            <span>{item.origenMesaId ? `Mesa: ${item.nombreMesa}` : 'Para Llevar'}</span>
                                        </div>
                                        {!esVenta && (
                                            <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-bold">
                                                <Clock size={10}/> Se borra en 5 min
                                            </p>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => setItemParaRestaurar(item)}
                                        className="shrink-0 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg font-bold text-sm flex items-center gap-2 transition w-full sm:w-auto justify-center"
                                    >
                                        <RotateCcw size={16}/> {esVenta ? 'Deshacer' : 'Restaurar'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ModalConfirmacion 
                isOpen={!!itemParaRestaurar}
                onClose={() => setItemParaRestaurar(null)}
                onConfirm={() => {
                    if (itemParaRestaurar) {
                        onRestaurar(itemParaRestaurar);
                        setItemParaRestaurar(null); 
                        onClose(); 
                    }
                }}
                titulo={esVenta ? "¿Deshacer Venta?" : "¿Recuperar Pedido?"}
                mensaje={itemParaRestaurar ? `El pedido de "${itemParaRestaurar.cliente || itemParaRestaurar.nombreCliente}" volverá a estar activo en ${itemParaRestaurar.origenMesaId ? 'su mesa original' : 'Para Llevar'}.` : ''}
            />
        </>
    );
};

export const ModalQR = ({ isOpen, onClose, titulo, subtitulo, valorQR }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[250] p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-bounce-in border-4 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-left"><h3 className="text-2xl font-bold text-gray-900">{titulo}</h3><p className="text-gray-500 text-sm">{subtitulo}</p></div>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl mb-4 flex items-center justify-center aspect-square"><QrCode size={180} className="text-white" /></div>
                <p className="text-xs text-gray-400 mb-6 font-mono break-all">{valorQR}</p>
                <button onClick={() => window.print()} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Printer size={20} /> Imprimir QR</button>
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

export const ModalFusionCuentas = ({ isOpen, onClose, cuentas, onConfirmarFusion }) => {
    if (!isOpen) return null;
    const [cuentaDestino, setCuentaDestino] = useState('');
    const [cuentasOrigen, setCuentasOrigen] = useState([]);
    const [pasoConfirmacion, setPasoConfirmacion] = useState(false);

    useEffect(() => { if(!isOpen) { setCuentaDestino(''); setCuentasOrigen([]); setPasoConfirmacion(false); } }, [isOpen]);
    const toggleOrigen = (id) => { if (cuentasOrigen.includes(id)) { setCuentasOrigen(cuentasOrigen.filter(c => c !== id)); } else { setCuentasOrigen([...cuentasOrigen, id]); } };
    const disponiblesOrigen = cuentas.filter(c => c.id !== cuentaDestino);
    const nombreDestino = cuentas.find(c => c.id === cuentaDestino)?.cliente || '';

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
                                <div className="mb-6"><label className="text-xs font-bold text-gray-400 uppercase block mb-2">2. Cuentas a unir (Se sumarán)</label><div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">{disponiblesOrigen.map(c => (<div key={c.id} onClick={() => toggleOrigen(c.id)} className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${cuentasOrigen.includes(c.id) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}><span className="text-gray-700 font-medium">{c.cliente} <span className="text-xs text-gray-400 font-normal">(${c.total})</span></span>{cuentasOrigen.includes(c.id) ? <div className="bg-orange-500 text-white rounded-full p-0.5"><CheckSquare size={16}/></div> : <Square size={20} className="text-gray-300"/>}</div>))}</div></div>
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

export const ModalNuevoLlevar = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    const [datos, setDatos] = useState({ nombre: '', telefono: '' });
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (datos.nombre.trim().length < 3) {
            setError('El nombre debe tener al menos 3 letras.');
            return;
        }
        if (datos.telefono.length !== 10) {
            setError('El teléfono debe tener 10 dígitos.');
            return;
        }
        onConfirm(datos);
        setError('');
        setDatos({ nombre: '', telefono: '' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={24} className="text-orange-600" /> Nuevo Pedido "Para Llevar"</h3>
                <p className="text-sm text-gray-500 mb-4">Ingresa los datos del cliente:</p>
                <div className="space-y-3 mb-4">
                    <input 
                        placeholder="Nombre Completo" 
                        className="w-full p-3 border rounded-lg uppercase" 
                        value={datos.nombre} 
                        onChange={e => { setDatos({ ...datos, nombre: e.target.value.toUpperCase() }); setError(''); }} 
                    />
                    <input 
                        placeholder="Teléfono (10 dígitos)" 
                        type="tel"
                        className="w-full p-3 border rounded-lg" 
                        value={datos.telefono} 
                        onChange={e => { 
                            if (/^\d*$/.test(e.target.value) && e.target.value.length <= 10) {
                                setDatos({ ...datos, telefono: e.target.value });
                                setError('');
                            }
                        }} 
                    />
                </div>
                {error && <p className="text-red-500 text-xs font-bold mb-3 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
                
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Crear Pedido</button>
                </div>
            </div>
        </div>
    );
};

const ModalGestionarCategorias = ({ isOpen, onClose, categorias, setCategorias, productos, setProductos, mostrarNotificacion }) => {
    const [listaCategorias, setListaCategorias] = useState(categorias);
    const [modoEdicion, setModoEdicion] = useState(null);
    const [textoInput, setTextoInput] = useState('');
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const itemArrastrado = useRef(null);
    const itemSobreElQueSeArrastra = useRef(null);

    useEffect(() => { setListaCategorias(categorias); }, [categorias]);

    const handleDragStart = (e, index) => { itemArrastrado.current = index; };
    const handleDragEnter = (e, index) => { itemSobreElQueSeArrastra.current = index; };
    const handleDragEnd = () => {
        const items = [...listaCategorias];
        const itemMovido = items.splice(itemArrastrado.current, 1)[0];
        items.splice(itemSobreElQueSeArrastra.current, 0, itemMovido);
        setListaCategorias(items);
        itemArrastrado.current = null;
        itemSobreElQueSeArrastra.current = null;
    };

    const guardarCambiosOrden = () => {
        setCategorias(listaCategorias);
        mostrarNotificacion("Orden de categorías actualizado", "exito");
        onClose();
    };

    const handleGuardarCategoria = () => {
        const nombreLimpio = textoInput.trim();
        if (!nombreLimpio) return mostrarNotificacion("El nombre no puede estar vacío", "error");
        if (listaCategorias.includes(nombreLimpio) && nombreLimpio !== modoEdicion) return mostrarNotificacion("Ya existe una categoría con ese nombre", "error");

        if (modoEdicion === 'nueva') {
            const nuevaLista = [...listaCategorias, nombreLimpio];
            setListaCategorias(nuevaLista);
            setCategorias(nuevaLista); 
            mostrarNotificacion(`Categoría "${nombreLimpio}" creada`, "exito");
        } else {
            const nuevaLista = listaCategorias.map(c => c === modoEdicion ? nombreLimpio : c);
            setListaCategorias(nuevaLista);
            setCategorias(nuevaLista);
            const nuevosProductos = productos.map(p => p.categoria === modoEdicion ? { ...p, categoria: nombreLimpio } : p);
            setProductos(nuevosProductos);
            mostrarNotificacion(`Categoría renombrada a "${nombreLimpio}"`, "exito");
        }
        setModoEdicion(null); setTextoInput('');
    };

    const handleEliminarCategoria = (catToDelete) => {
        const productosEnCategoria = productos.filter(p => p.categoria === catToDelete).length;
        if (productosEnCategoria > 0) return mostrarNotificacion(`No puedes eliminar "${catToDelete}" porque tiene ${productosEnCategoria} productos.`, "error");
        setCategoriaAEliminar(catToDelete);
    };

    const confirmarEliminacion = () => {
        if (categoriaAEliminar) {
            const nuevaLista = listaCategorias.filter(c => c !== categoriaAEliminar);
            setListaCategorias(nuevaLista);
            setCategorias(nuevaLista);
            mostrarNotificacion("Categoría eliminada", "info");
            setCategoriaAEliminar(null); 
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[210] flex items-center justify-center backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                    <div className="bg-gray-800 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Settings size={20}/> Gestionar Categorías</h3><button onClick={onClose}><X size={20}/></button></div>
                    <div className="p-4 bg-gray-50">
                        <ul className="space-y-2 mb-4">
                            {listaCategorias.map((cat, index) => (
                                <li key={cat} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} className="bg-white p-3 rounded-lg border flex justify-between items-center hover:shadow-sm cursor-grab active:cursor-grabbing group">
                                    <div className="flex items-center gap-3"><GripVertical size={18} className="text-gray-400"/><span className="font-medium text-gray-700">{cat}</span></div>
                                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity"><button onClick={() => { setModoEdicion(cat); setTextoInput(cat); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Edit size={16}/></button><button onClick={() => handleEliminarCategoria(cat)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={16}/></button></div>
                                </li>
                            ))}
                        </ul>
                        {modoEdicion ? (
                            <div className="flex gap-2 mb-4 bg-blue-50 p-2 rounded-lg border border-blue-100 animate-fade-in">
                                <input type="text" value={textoInput} onChange={e => setTextoInput(e.target.value)} className="flex-1 p-2 border rounded text-sm" placeholder="Nombre de categoría..." autoFocus onKeyDown={e => e.key === 'Enter' && handleGuardarCategoria()}/>
                                <button onClick={handleGuardarCategoria} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Check size={18}/></button>
                                <button onClick={() => { setModoEdicion(null); setTextoInput(''); }} className="bg-gray-300 text-gray-700 px-3 rounded hover:bg-gray-400"><X size={18}/></button>
                            </div>
                        ) : (
                            <button onClick={() => { setModoEdicion('nueva'); setTextoInput(''); }} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-orange-400 hover:text-orange-500 transition flex justify-center items-center gap-2 font-medium"><PlusCircle size={18}/> Añadir Nueva Categoría</button>
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-3 bg-white"><button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cerrar</button><button onClick={guardarCambiosOrden} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center gap-2"><Save size={18}/> Guardar Orden</button></div>
                </div>
            </div>

            <ModalConfirmacion 
                isOpen={!!categoriaAEliminar}
                onClose={() => setCategoriaAEliminar(null)}
                onConfirm={confirmarEliminacion}
                titulo={`¿Eliminar "${categoriaAEliminar}"?`}
                mensaje="Esta acción eliminará la categoría permanentemente."
            />
        </>
    );
};

export const ModalProducto = ({ isOpen, producto, onClose, onGuardar, onEliminar, categoriasDisponibles }) => {
    if (!isOpen) return null;

    const [form, setForm] = useState({ id: null, nombre: '', categoria: categoriasDisponibles[0] || 'Otros', precio: '', imagen: null });
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
        if (producto) { setForm(producto); setImagenPreview(producto.imagen); } 
        else { setForm({ id: null, nombre: '', categoria: categoriasDisponibles[0] || 'Otros', precio: '', imagen: null }); setImagenPreview(null); }
        setScale(1); setRotation(0); setPosition({ x: 0, y: 0 });
    }, [producto, isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { setImagenPreview(reader.result); setScale(1); setRotation(0); setPosition({ x: 0, y: 0 }); }; reader.readAsDataURL(file); }
    };

    const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); };
    const handleMouseMove = (e) => { if (isDragging) { setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); } };
    const handleMouseUp = () => { setIsDragging(false); };
    const rotate = (direction) => { setRotation(prev => prev + (direction === 'right' ? 90 : -90)); };

    const getCroppedImg = () => {
        const canvas = canvasRef.current; const image = imageRef.current; if (!canvas || !image) return imagenPreview;
        const ctx = canvas.getContext('2d'); const containerSize = 250; 
        canvas.width = containerSize; canvas.height = containerSize;
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX + position.x, centerY + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        const visibleWidth = image.naturalWidth * scale; const visibleHeight = image.naturalHeight * scale;
        ctx.drawImage(image, -visibleWidth / 2, -visibleHeight / 2, visibleWidth, visibleHeight);
        ctx.restore();

        return canvas.toDataURL('image/jpeg', 0.9);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalImage = (imagenPreview && (scale !== 1 || position.x !== 0 || position.y !== 0 || rotation !== 0)) ? getCroppedImg() : imagenPreview;
        onGuardar({ ...form, precio: parseFloat(form.precio), imagen: finalImage });
        onClose();
    };

    const handleDelete = () => { if(window.confirm("¿Seguro que quieres eliminar este producto?")) { onEliminar(producto.id); onClose(); } };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[220] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up my-8">
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
                                <div className="w-[250px] h-[250px] rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative cursor-move mb-4 group flex items-center justify-center" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                                    <img ref={imageRef} src={imagenPreview} alt="Preview" className="absolute transition-transform duration-75 ease-out origin-center" style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`, maxHeight: 'none', maxWidth: 'none' }} draggable="false" /><div className="absolute inset-0 border-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>
                                </div>
                                <div className="w-full max-w-[250px] space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <div><label className="flex justify-between text-xs font-bold text-gray-600 mb-1">Zoom: <span>{(scale * 100).toFixed(0)}%</span></label><input type="range" min="1" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-600">Rotar:</span><div className="flex gap-2"><button type="button" onClick={() => rotate('left')} className="p-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-600"><RotateCcw size={16}/></button><button type="button" onClick={() => rotate('right')} className="p-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-600"><RotateCw size={16}/></button></div></div>
                                    <div className="flex gap-2 mt-2"><button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 py-1.5 text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 flex items-center justify-center gap-1"><ImageIcon size={12}/> Cambiar</button><button type="button" onClick={() => { setImagenPreview(null); fileInputRef.current.value = ''; }} className="flex-1 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 size={12}/> Quitar</button></div>
                                </div>
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>
                        )}
                    </div>
                    {/* FOOTER DEL FORMULARIO */}
                    <div className="md:col-span-2 p-6 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl -mx-8 -mb-8 mt-4">
                        <div>{producto && (<button type="button" onClick={handleDelete} className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 size={20}/> Eliminar</button>)}</div>
                        <div className="flex gap-4"><button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors">Cancelar</button><button type="submit" className="px-8 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2"><Check size={20}/> {producto ? 'Guardar Cambios' : 'Crear Producto'}</button></div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const VistaHubMesa = ({ mesa, onVolver, onAbrirCuenta, onCrearCuenta, onUnirCuentas }) => {
    const [modalUnirOpen, setModalUnirOpen] = useState(false);
    const [modalCrearOpen, setModalCrearOpen] = useState(false);

    return (
        <div className="fixed inset-0 bg-gray-50 z-[50] flex flex-col animate-fade-in-up">
            <div className="bg-white p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-4"><button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button><div><h2 className="text-2xl font-bold text-gray-800">{mesa.nombre}</h2><div className="flex items-center gap-2 text-sm text-gray-500"><Users size={16} /> <span>{mesa.cuentas.length} cuentas activas</span></div></div></div>
                <div className="flex items-center gap-3">{mesa.cuentas.length > 1 && (<button onClick={() => setModalUnirOpen(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-2"><Merge size={18}/> Unir Cuentas</button>)}<div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold">Total Mesa: ${mesa.cuentas.reduce((acc, c) => acc + c.total, 0)}</div></div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                {mesa.cuentas.length === 0 ? (
                    <div className="text-center py-20 opacity-50"><Users size={64} className="mx-auto mb-4 text-gray-400" /><h3 className="text-xl font-bold text-gray-600">Mesa Disponible</h3><p>No hay cuentas abiertas. Esperando clientes...</p></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{mesa.cuentas.map(cuenta => (<div key={cuenta.id} onClick={() => onAbrirCuenta(mesa.id, cuenta.id)} className="bg-white border-l-8 border-orange-500 rounded-xl shadow-sm hover:shadow-md cursor-pointer p-6 transition-all transform hover:-translate-y-1 relative group"><div className="flex justify-between items-start mb-4"><div><h4 className="font-bold text-lg text-gray-800 uppercase">{cuenta.cliente}</h4><span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{cuenta.id}</span></div><div className="bg-orange-50 p-2 rounded-full text-orange-600"><Edit size={20} /></div></div><div className="mb-4 text-sm text-gray-500 max-h-24 overflow-hidden relative">{cuenta.cuenta.length === 0 ? <span className="italic opacity-50">Sin pedidos aún</span> : (<ul className="space-y-1">{cuenta.cuenta.slice(0, 3).map((item, idx) => (<li key={idx} className="flex justify-between"><span>{item.cantidad || 1}x {item.nombre}</span></li>))}{cuenta.cuenta.length > 3 && <li className="text-xs font-bold pt-1">...y {cuenta.cuenta.length - 3} más</li>}</ul>)}</div><div className="flex justify-between items-end border-t pt-4"><span className="text-sm text-gray-500">{cuenta.cuenta.length} items</span><span className="text-2xl font-bold text-gray-900">${cuenta.total}</span></div></div>))}</div>
                )}
            </div>
            <div className="p-4 bg-white border-t border-gray-200"><button onClick={() => setModalCrearOpen(true)} className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2"><PlusCircle /> Agregar Cuenta Manualmente</button></div>
            <ModalFusionCuentas isOpen={modalUnirOpen} onClose={() => setModalUnirOpen(false)} cuentas={mesa.cuentas} onConfirmarFusion={(destino, origenes) => { onUnirCuentas(mesa.id, destino, origenes); setModalUnirOpen(false); }} />
            <ModalNuevaCuentaMesa isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} onConfirm={(nombre) => { onCrearCuenta(mesa.id, nombre); setModalCrearOpen(false); }} />
        </div>
    );
};

export const VistaDetalleCuenta = ({ sesion, productos, onCerrar, onAgregarProducto, onPagarCuenta, onActualizarProducto, onCancelarCuenta }) => {
    if (!sesion) return null;
    const nombreCliente = sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente;
    const identificador = sesion.tipo === 'llevar' ? 'Para Llevar' : sesion.nombreMesa;
    
    // ESTADOS LOCALES
    const [montoRecibido, setMontoRecibido] = useState('');
    const [confirmacionPagoOpen, setConfirmacionPagoOpen] = useState(false);
    const [confirmacionCancelarOpen, setConfirmacionCancelarOpen] = useState(false);
    
    const handleImprimir = () => { const datosTicket = { id: sesion.id, cliente: nombreCliente, items: sesion.cuenta, total: sesion.total || 0 }; imprimirTicket(datosTicket, 'ticket'); };

    // Cálculos
    const total = sesion.total || 0;
    const cambio = montoRecibido ? parseFloat(montoRecibido) - total : 0;

    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex animate-fade-in-up">
            <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-300">
                <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-800">Menú Digital</h2><p className="text-sm text-gray-500">{identificador} • <span className="font-bold text-orange-600">{nombreCliente}</span></p></div><button onClick={onCerrar} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold"><ArrowLeft size={20} /> Volver</button></div>
                <div className="flex-1 overflow-y-auto p-6 bg-orange-50/30">{ORDEN_CATEGORIAS.map(cat => { const prods = productos.filter(p => p.categoria === cat); if (prods.length === 0) return null; return (<div key={cat} className="mb-8"><h3 className="font-bold text-orange-800 text-lg border-b border-orange-200 mb-3 pb-1">{cat}</h3><div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{prods.map(prod => (<div key={prod.id} onClick={() => onAgregarProducto(sesion.id, prod)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-orange-300 transition active:scale-95 flex flex-col items-center text-center"><div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-2 overflow-hidden">{prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('data:image')) ? <img src={prod.imagen} className="w-full h-full object-contain" alt={prod.nombre}/> : <span className="truncate w-full text-center">{prod.imagen}</span>}</div><h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{prod.nombre}</h4><span className="text-orange-600 font-bold">${prod.precio}</span></div>))}</div></div>) })}</div>
            </div>
            <div className="w-96 bg-white shadow-2xl flex flex-col h-full border-l border-gray-200">
                <div className="p-6 bg-gray-900 text-white"><div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold">Comanda</h3><p className="text-gray-400 text-xs font-mono">{sesion.id}</p></div><Receipt className="text-orange-400" /></div><div className="bg-gray-800 p-2 rounded text-xs mb-2"><p className="text-gray-300">Cliente: <span className="text-white font-bold">{nombreCliente}</span></p>{sesion.telefono && <p className="text-gray-300">Tel: <span className="text-white">{sesion.telefono}</span></p>}</div></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(!sesion.cuenta || sesion.cuenta.length === 0) ? (
                        <div className="text-center text-gray-400 py-10 italic">Cuenta vacía.<br />Selecciona productos del menú.</div>
                    ) : (
                        sesion.cuenta.map((item, idx) => {
                            const cantidad = item.cantidad || 1;
                            const subtotalItem = item.precio * cantidad;
                            return (
                                <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0">
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800 text-sm">{item.nombre}</p>
                                            
                                            {/* BOTÓN DE RESTAR / ELIMINAR ITEM */}
                                            <button 
                                                onClick={() => onActualizarProducto(sesion.id, item.id, -1)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition"
                                                title="Restar cantidad"
                                            >
                                                <MinusCircle size={16}/>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">{item.categoria}</p>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        {cantidad > 1 ? (
                                            <>
                                                <p className="font-bold text-gray-900 text-base">${subtotalItem.toFixed(2)}</p>
                                                <p className="text-xs text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                                    ${item.precio} x {cantidad}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="font-bold text-gray-700">${item.precio}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4"><span className="text-lg font-bold text-gray-600">Total</span><span className="text-3xl font-bold text-gray-900">${sesion.total || 0}</span></div>
                    
                    {/* --- CALCULADORA DE CAMBIO INTEGRADA --- */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4 shadow-sm">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Calculator size={12}/> Calculadora de Cambio</label>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1">
                                <input 
                                    type="number" 
                                    placeholder="Recibido..." 
                                    className="w-full p-2 border rounded-lg font-bold text-gray-700 text-sm focus:border-orange-500 focus:outline-none"
                                    value={montoRecibido}
                                    onChange={e => setMontoRecibido(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Cambio a dar</p>
                                <p className={`text-xl font-bold ${cambio < 0 ? 'text-red-400' : 'text-green-600'}`}>
                                    ${montoRecibido ? cambio.toFixed(2) : '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button onClick={handleImprimir} disabled={!sesion.cuenta || sesion.cuenta.length === 0} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex justify-center items-center gap-2 transition"><Printer size={20} /> Imprimir Cuenta</button>
                        
                        {/* BOTÓN CON CONFIRMACIÓN DE PAGO */}
                        <button 
                            onClick={() => setConfirmacionPagoOpen(true)} 
                            disabled={!sesion.cuenta || sesion.cuenta.length === 0} 
                            className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 ${!sesion.cuenta || sesion.cuenta.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            <DollarSign size={20} /> Cerrar Cuenta y Pagar
                        </button>

                        {/* BOTÓN DE CANCELAR CUENTA (MODIFICADO) */}
                        <button 
                            onClick={() => setConfirmacionCancelarOpen(true)}
                            className="mt-2 text-xs font-bold text-red-400 hover:text-red-600 hover:underline flex justify-center items-center gap-1"
                        >
                            <Trash2 size={12}/> Cancelar Pedido
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE PAGO */}
            <ModalConfirmacion 
                isOpen={confirmacionPagoOpen}
                onClose={() => setConfirmacionPagoOpen(false)}
                onConfirm={() => { onPagarCuenta(sesion); setConfirmacionPagoOpen(false); }}
                titulo="¿Confirmar Pago?"
                mensaje={`Se cerrará la cuenta de ${nombreCliente} por un total de $${total}. Esta acción no se puede deshacer.`}
            />

            {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN (MODIFICADO) */}
            <ModalConfirmacion 
                isOpen={confirmacionCancelarOpen}
                onClose={() => setConfirmacionCancelarOpen(false)}
                onConfirm={() => { onCancelarCuenta(sesion); setConfirmacionCancelarOpen(false); }}
                titulo="¿Cancelar Pedido?"
                mensaje="El pedido se moverá a la lista de 'Cancelados' durante 5 minutos por si necesitas recuperarlo. Después se eliminará permanentemente."
            />
        </div>
    );
};

export const VistaGestionMesas = ({ mesas, onAgregarMesa, onEliminarMesa }) => {
    const [qrData, setQrData] = useState(null);
    const [mesaAEliminar, setMesaAEliminar] = useState(null);

    return (
        <div className="p-8 h-screen overflow-y-auto relative">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración de Mesas</h2>
            
            {/* SECCIÓN 1: GRID DE MESAS */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-800 flex items-center"><Grid className="mr-2" /> Disposición de Mesas</h3>
                    <button onClick={onAgregarMesa} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 flex items-center gap-2"><PlusCircle size={18} /> Agregar Mesa</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mesas.map(mesa => (
                        <div key={mesa.id} className="relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[160px] bg-white border-gray-200 hover:border-orange-300 transition group">
                            <QrCode size={40} className="text-gray-300 mb-2 group-hover:text-orange-500 transition-colors" />
                            <h3 className="font-bold text-lg text-gray-600">{mesa.nombre}</h3>
                            <div className="flex gap-2 mt-3 w-full">
                                <button onClick={() => setQrData({ titulo: mesa.nombre, sub: `Escanea para pedir en ${mesa.nombre}`, val: `https://app.lya.com/mesa/${mesa.id}` })} className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded text-gray-700 font-bold">Ver QR</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setMesaAEliminar(mesa); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={14} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 2: QR PARA LLEVAR */}
            <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ShoppingBag className="mr-2 text-orange-500" /> Código QR "Para Llevar"</h3>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-orange-900">QR General para Mostrador</h4>
                        <p className="text-sm text-orange-700 max-w-md">Utiliza este código para clientes que no ocupan mesa pero desean ordenar para llevar.</p>
                    </div>
                    <button onClick={() => setQrData({ titulo: "Para Llevar", sub: "Menú Digital General", val: "https://app.lya.com/llevar" })} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 flex items-center gap-2"><QrCode size={20} /> Ver/Imprimir QR</button>
                </div>
            </div>
            
            {/* PANEL DE SIMULACIÓN FLOTANTE */}
            <div className="fixed bottom-6 right-6 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 z-50 w-72 animate-fade-in-up">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <p className="text-xs font-bold uppercase text-orange-600 flex items-center gap-2">
                        <Smartphone size={16}/> Simulador QR
                    </p>
                    <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">MODO DEV</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                    Haz clic abajo para abrir la vista del cliente en una nueva pestaña (como si escanearan el QR).
                </p>
                
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {mesas.map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => window.open(`/mesa/${m.id}`, '_blank')}
                            className="w-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-xs font-bold py-2 px-3 rounded-lg border border-gray-200 hover:border-blue-200 transition text-left flex items-center gap-2"
                        >
                            <QrCode size={14} className="opacity-50"/> Simular {m.nombre}
                        </button>
                    ))}
                </div>
                
                <button 
                    onClick={() => window.open('/llevar', '_blank')}
                    className="w-full bg-gray-900 text-white text-xs font-bold py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 transition shadow-lg border border-gray-900"
                >
                    <ShoppingBag size={14}/> Simular "Para Llevar"
                </button>
            </div>

            <ModalQR isOpen={!!qrData} onClose={() => setQrData(null)} titulo={qrData?.titulo} subtitulo={qrData?.sub} valorQR={qrData?.val} />
            <ModalConfirmacion isOpen={!!mesaAEliminar} onClose={() => setMesaAEliminar(null)} onConfirm={() => { onEliminarMesa(mesaAEliminar.id); setMesaAEliminar(null); }} titulo={`¿Eliminar ${mesaAEliminar?.nombre}?`} mensaje="Si eliminas esta mesa, el código QR dejará de funcionar. ¿Estás seguro?" />
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

    useEffect(() => {
        const catsExistentes = [...new Set(productos.map(p => p.categoria))];
        const nuevasCats = catsExistentes.filter(c => !categoriasOrdenadas.includes(c));
        if (nuevasCats.length > 0) { setCategoriasOrdenadas([...categoriasOrdenadas, ...nuevasCats]); }
    }, [productos]);

    const mostrarNotificacion = (mensaje, tipo = 'exito') => { setNotificacion({ visible: true, mensaje, tipo }); setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); };

    const productosFiltrados = useMemo(() => {
        return productos.filter(p => {
            const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const cumpleCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
            return cumpleBusqueda && cumpleCategoria;
        });
    }, [productos, busqueda, categoriaFiltro]);

    const handleGuardarWrapper = (prod) => { onGuardarProducto(prod); mostrarNotificacion(prod.id ? "Producto actualizado" : "Producto creado", "exito"); };
    const handleEliminarProductoWrapper = (id) => { if(window.confirm("¿Eliminar este producto permanentemente?")) { onEliminarProducto(id); } }

    return (
        <div className="p-8 min-h-screen bg-gray-50">
            <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-3"><Coffee size={40} className="text-orange-600"/> Menú de Cafetería</h2>
                    <p className="text-gray-500 mt-2">Gestiona tus productos, precios y categorías.</p>
                </div>
                
                {/* --- BOTONES DE MENÚ ADAPTABLES --- */}
                <div className="grid grid-cols-1 md:flex gap-3 w-full md:w-auto relative z-10">
                    <button onClick={() => setModalCategoriasOpen(true)} className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95">
                        <Settings size={20}/> Gestionar Categorías
                    </button>
                    <button onClick={() => { setProductoAEditar(null); setModalProductoOpen(true); }} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95">
                        <PlusCircle size={20}/> Nuevo Producto
                    </button>
                </div>
                {/* ---------------------------------- */}

            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 relative z-0"><div className="relative flex-1"><Search size={20} className="absolute left-3 top-3.5 text-gray-400" /><input type="text" placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:ring-0 transition-all" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div><div className="relative md:w-64"><Filter size={20} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" /><select className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:ring-0 transition-all appearance-none bg-white font-medium text-gray-700 cursor-pointer" value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}><option value="Todas">Todas las Categorías</option>{categoriasOrdenadas.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><ChevronRight size={20} className="absolute right-3 top-3.5 text-gray-400 rotate-90 pointer-events-none" /></div></div>
            
            {/* CARRUSEL HORIZONTAL DE PRODUCTOS */}
            <div className="space-y-8 relative z-0">
                {categoriasOrdenadas.map(categoria => {
                    const productosCat = productosFiltrados.filter(p => p.categoria === categoria);
                    if (productosCat.length === 0 && categoriaFiltro !== 'Todas' && categoriaFiltro !== categoria) return null;
                    if (productosCat.length === 0 && busqueda) return null;

                    return (
                        <section key={categoria} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                            <div className="flex items-center justify-between mb-6 border-b pb-4">
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Tag size={24} className="text-orange-500"/> {categoria}
                                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{productosCat.length}</span>
                                </h3>
                                <button onClick={() => setModalCategoriasOpen(true)} className="text-gray-400 hover:text-orange-600 p-2 rounded-full hover:bg-orange-50 transition" title="Editar Categoría"><Edit size={18}/></button>
                            </div>
                            
                            {productosCat.length > 0 ? (
                                // CONTENEDOR FLEX CON SCROLL HORIZONTAL
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                    {productosCat.map(producto => (
                                        // WRAPPER CON SHRINK-0 PARA QUE NO SE ENCOJA
                                        <div key={producto.id} className="relative group shrink-0">
                                            <CardProducto producto={producto} onClick={() => { setProductoAEditar(producto); setModalProductoOpen(true); }} />
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); setProductoAEditar(producto); setModalProductoOpen(true); }} className="p-2 bg-white text-blue-600 rounded-full shadow-sm hover:bg-blue-50 border border-gray-200" title="Editar"><Edit size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleEliminarProductoWrapper(producto.id); }} className="p-2 bg-white text-red-600 rounded-full shadow-sm hover:bg-red-50 border border-gray-200" title="Eliminar"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8 italic bg-gray-50 rounded-xl border border-dashed">No hay productos en esta categoría que coincidan con la búsqueda.</p>
                            )}
                        </section>
                    );
                })}
            </div>

            <ModalProducto isOpen={modalProductoOpen} onClose={() => { setModalProductoOpen(false); setProductoAEditar(null); }} producto={productoAEditar} onGuardar={handleGuardarWrapper} onEliminar={onEliminarProducto} categoriasDisponibles={categoriasOrdenadas} />
            <ModalGestionarCategorias isOpen={modalCategoriasOpen} onClose={() => setModalCategoriasOpen(false)} categorias={categoriasOrdenadas} setCategorias={setCategoriasOrdenadas} productos={productos} setProductos={onGuardarProducto} mostrarNotificacion={mostrarNotificacion} />
        </div>
    );
};

export const VistaInicioCafeteria = ({ 
    mesas, 
    pedidosLlevar, 
    ventasHoy = [], 
    cancelados = [], 
    onSeleccionarMesa, 
    onCrearLlevar, 
    onAbrirLlevar,
    onRestaurarVenta, 
    onDeshacerCancelacion 
}) => {
    const [modalLlevarOpen, setModalLlevarOpen] = useState(false);
    const [modalHistorial, setModalHistorial] = useState({ open: false, tipo: 'vendidos' });
    const [modalCorteOpen, setModalCorteOpen] = useState(false);

    // CÁLCULOS
    const mesasOcupadas = mesas.filter(m => m.cuentas.length > 0).length;
    const pedidosActivos = pedidosLlevar.length;
    
    // 1. Cantidad de tickets (Vendidos Hoy)
    const cantidadVentas = ventasHoy.length; 
    
    // 2. Dinero total (Corte de Caja)
    const totalIngresos = ventasHoy.reduce((acc, v) => acc + v.total, 0);

    return (
        <div className="p-4 md:p-8 h-screen overflow-y-auto bg-gray-50">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Cafetería - Operaciones en Vivo</h2>
            
            {/* --- GRID DE 5 TARJETAS (ORDENADO) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                
                {/* 1. MESAS OCUPADAS */}
                <CardStat 
                    titulo="Mesas Ocupadas" 
                    valor={`${mesasOcupadas} / ${mesas.length}`} 
                    color="bg-orange-100 text-orange-800" 
                    icon={<Grid size={24} />} 
                />
                
                {/* 2. PARA LLEVAR (Activos) */}
                <CardStat 
                    titulo="Para Llevar" 
                    valor={pedidosActivos} 
                    color="bg-blue-100 text-blue-800" 
                    icon={<ShoppingBag size={24} />} 
                />

                {/* 3. VENDIDOS HOY (Cantidad / Historial con Buscador) */}
                <div 
                    onClick={() => setModalHistorial({ open: true, tipo: 'vendidos' })}
                    className="cursor-pointer transition-transform active:scale-95"
                >
                    <CardStat 
                        titulo="Vendidos Hoy" 
                        valor={cantidadVentas} 
                        subtext="Tickets cerrados"
                        color="bg-green-100 text-green-800 border border-green-200 hover:border-green-400" 
                        icon={<CheckCircle size={24} />} 
                    />
                </div>

                {/* 4. CANCELADOS (Papelera temporal) */}
                <div 
                    onClick={() => setModalHistorial({ open: true, tipo: 'cancelados' })}
                    className="cursor-pointer transition-transform active:scale-95"
                >
                    <CardStat 
                        titulo="Cancelados (5m)" 
                        valor={cancelados.length} 
                        subtext="Recuperables"
                        color="bg-red-100 text-red-800 border border-red-200 hover:border-red-400" 
                        icon={<XCircle size={24} />} 
                    />
                </div>

                {/* 5. TOTAL CAJA (HOY) (Corte de Caja - Dinero) */}
                <div 
                    onClick={() => setModalCorteOpen(true)}
                    className="cursor-pointer transition-transform active:scale-95"
                >
                    <CardStat 
                        titulo="Total Caja (Hoy)" 
                        valor={`$${totalIngresos}`} 
                        subtext="Ingreso del día"
                        color="bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-400" 
                        icon={<DollarSign size={24} />} 
                    />
                </div>
            </div>

            {/* --- SECCIÓN PRINCIPAL (MESAS Y LLEVAR) --- */}
            <div className="flex flex-col xl:flex-row gap-8">
                {/* LADO IZQUIERDO: MESAS */}
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
                                        <div className="mt-2">
                                            <p className="text-2xl font-bold text-gray-800">${totalMesa}</p>
                                            <p className="text-xs text-orange-600 font-bold bg-orange-50 inline-block px-2 py-1 rounded-lg mt-1">{mesa.cuentas.length} cuenta(s)</p>
                                        </div>
                                    ) : (
                                        <div className="mt-auto">
                                            <p className="text-sm text-green-600 font-bold flex items-center bg-green-50 w-fit px-2 py-1 rounded-lg"><PlusCircle size={14} className="mr-1"/> Disponible</p>
                                        </div>
                                    )}
                                </div>
                            ); 
                        })}
                    </div>
                </div>

                {/* LADO DERECHO: PARA LLEVAR */}
                <div className="w-full xl:w-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-700 flex items-center"><ShoppingBag className="mr-2"/> Para Llevar</h3>
                        <button onClick={() => setModalLlevarOpen(true)} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-700 shadow-md transition-transform active:scale-95"><PlusCircle size={20}/></button>
                    </div>
                    {pedidosLlevar.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p>No hay pedidos activos.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {pedidosLlevar.map(p => (
                                <div key={p.id} onClick={() => onAbrirLlevar(p.id)} className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 cursor-pointer bg-gray-50 hover:bg-white transition group">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{p.nombreCliente}</span>
                                        <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded text-gray-400">#{p.id.slice(-4)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">{p.telefono || 'Sin teléfono'}</span>
                                        <span className="font-bold text-lg text-gray-900 bg-white px-2 rounded border border-gray-100">${p.cuenta.reduce((a,b)=>a+(b.precio * (b.cantidad || 1)),0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALES --- */}
            <ModalNuevoLlevar 
                isOpen={modalLlevarOpen} 
                onClose={() => setModalLlevarOpen(false)} 
                onConfirm={(datos) => { onCrearLlevar(datos); setModalLlevarOpen(false); }} 
            />

            <ModalHistorial 
                isOpen={modalHistorial.open}
                onClose={() => setModalHistorial({ ...modalHistorial, open: false })}
                tipo={modalHistorial.tipo}
                items={modalHistorial.tipo === 'vendidos' ? ventasHoy : cancelados}
                onRestaurar={modalHistorial.tipo === 'vendidos' ? onRestaurarVenta : onDeshacerCancelacion}
            />

            <ModalCorteCaja
                isOpen={modalCorteOpen}
                onClose={() => setModalCorteOpen(false)}
                ventas={ventasHoy}
            />
        </div>
    );
};