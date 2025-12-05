import React, { useState, useEffect } from 'react';
import { Smartphone, ShoppingBag, Grid, PlusCircle, QrCode, X, ArrowLeft, Receipt, DollarSign, Coffee, Edit, Upload, Users, Printer, Merge, CheckSquare, Square, Cake, Sparkles } from 'lucide-react';
import { CardStat } from '../components/Shared';
import { ORDEN_CATEGORIAS, imprimirTicket } from '../utils/config';

// --- 1. MODALES EXCLUSIVOS CAFETERÍA ---

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
                <div className="bg-gray-900 p-4 rounded-xl mb-4 flex items-center justify-center aspect-square">
                    <QrCode size={180} className="text-white" />
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
                <p className="text-sm text-gray-500 mb-4">Ingresa un nombre para identificar esta cuenta (ej. "Familia Pérez" o "Juan").</p>
                <input autoFocus placeholder="Nombre del cliente / Identificador" className="w-full p-3 border rounded-lg mb-4" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                    <button onClick={() => { if (nombre) { onConfirm(nombre); setNombre(''); } }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Crear Cuenta</button>
                </div>
            </div>
        </div>
    );
};

export const ModalFusionCuentas = ({ isOpen, onClose, cuentas, onConfirmarFusion }) => {
    if (!isOpen) return null;
    
    const [cuentaDestino, setCuentaDestino] = useState('');
    const [cuentasOrigen, setCuentasOrigen] = useState([]);
    const [pasoConfirmacion, setPasoConfirmacion] = useState(false);

    useEffect(() => {
        if(!isOpen) {
            setCuentaDestino('');
            setCuentasOrigen([]);
            setPasoConfirmacion(false);
        }
    }, [isOpen]);

    const toggleOrigen = (id) => {
        if (cuentasOrigen.includes(id)) {
            setCuentasOrigen(cuentasOrigen.filter(c => c !== id));
        } else {
            setCuentasOrigen([...cuentasOrigen, id]);
        }
    };

    const handlePreConfirmar = () => {
        if (cuentaDestino && cuentasOrigen.length > 0) {
            setPasoConfirmacion(true);
        }
    };

    const handleFinalizar = () => {
        onConfirmarFusion(cuentaDestino, cuentasOrigen);
        onClose();
    };

    const disponiblesOrigen = cuentas.filter(c => c.id !== cuentaDestino);
    const nombreDestino = cuentas.find(c => c.id === cuentaDestino)?.cliente || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[250] p-4 backdrop-blur-md">
            <div className="bg-white p-0 rounded-3xl shadow-2xl w-full max-w-md animate-bounce-in overflow-hidden border-2 border-pink-100">
                <div className="bg-pink-50 p-4 flex justify-between items-center border-b border-pink-100">
                    <h3 className="text-lg font-bold text-pink-800 flex items-center gap-2">
                        {pasoConfirmacion ? <Sparkles size={18} /> : <Merge size={18}/>} 
                        {pasoConfirmacion ? 'Confirmar Unión' : 'Unir Cuentas'}
                    </h3>
                    <button onClick={onClose} className="text-pink-400 hover:text-pink-600"><X /></button>
                </div>

                <div className="p-6">
                    {!pasoConfirmacion ? (
                        <>
                            <div className="mb-5">
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">1. Cuenta Principal (La que paga)</label>
                                <select 
                                    className="w-full p-3 border-2 border-orange-100 rounded-xl bg-white font-bold text-gray-700 focus:border-orange-400 outline-none"
                                    value={cuentaDestino}
                                    onChange={(e) => { setCuentaDestino(e.target.value); setCuentasOrigen([]); }}
                                >
                                    <option value="">Selecciona al pagador...</option>
                                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.cliente} (${c.total})</option>)}
                                </select>
                            </div>

                            {cuentaDestino && (
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-2">2. Cuentas a unir (Se sumarán)</label>
                                    <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                                        {disponiblesOrigen.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => toggleOrigen(c.id)}
                                                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${cuentasOrigen.includes(c.id) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <span className="text-gray-700 font-medium">{c.cliente} <span className="text-xs text-gray-400 font-normal">(${c.total})</span></span>
                                                {cuentasOrigen.includes(c.id) ? <div className="bg-orange-500 text-white rounded-full p-0.5"><CheckSquare size={16}/></div> : <Square size={20} className="text-gray-300"/>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => setCuentasOrigen(disponiblesOrigen.map(c => c.id))} className="text-xs text-orange-600 font-bold hover:underline">Seleccionar Todas</button>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handlePreConfirmar}
                                disabled={!cuentaDestino || cuentasOrigen.length === 0}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md flex justify-center items-center gap-2 ${!cuentaDestino || cuentasOrigen.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg'}`}
                            >
                                Siguiente <ArrowLeft size={18} className="rotate-180"/>
                            </button>
                        </>
                    ) : (
                        <div className="text-center animate-fade-in">
                            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                <Cake size={40} className="text-pink-600" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">¿Mezclamos los sabores?</h4>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Se unirán <strong className="text-orange-600">{cuentasOrigen.length}</strong> cuentas a la cuenta de <strong className="text-orange-600 text-lg">{nombreDestino}</strong>. 
                                <br/><span className="text-xs text-gray-400 mt-2 block">¡Ideal para compartir el postre!</span>
                            </p>

                            <div className="flex gap-3">
                                <button onClick={() => setPasoConfirmacion(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    Mejor no
                                </button>
                                <button onClick={handleFinalizar} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex justify-center items-center gap-2">
                                    <Sparkles size={18}/> ¡Sí, unir todo!
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ModalNuevoLlevar = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    const [datos, setDatos] = useState({ nombre: '', telefono: '' });
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={24} className="text-orange-600" /> Nuevo Pedido "Para Llevar"</h3>
                <p className="text-sm text-gray-500 mb-4">Simulando escaneo QR Mostrador. Datos del cliente:</p>
                <input placeholder="Nombre Completo" className="w-full p-3 border rounded-lg mb-3" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value.toUpperCase() })} />
                <input placeholder="Teléfono" className="w-full p-3 border rounded-lg mb-4" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                    <button onClick={() => { if (datos.nombre && datos.telefono) onConfirm(datos); }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Crear Pedido</button>
                </div>
            </div>
        </div>
    );
};

export const ModalProducto = ({ producto, isOpen, onClose, onGuardar }) => {
    if (!isOpen) return null;
    const [form, setForm] = useState({ ...producto });
    useEffect(() => { if (producto) setForm({ ...producto }); else setForm({ nombre: '', descripcion: '', precio: '', categoria: 'Pasteles', imagen: '🍰', zoom: 100 }); }, [producto, isOpen]);
    const handleSave = (e) => { e.preventDefault(); onGuardar(form); };
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result })); reader.readAsDataURL(file); } };
    const esImagen = (str) => str && (str.startsWith('http') || str.startsWith('data:image'));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[220] p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-orange-600 p-4 flex justify-between text-white"><h3 className="font-bold">Editar Producto</h3><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/30">
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                            <div style={{ transform: `scale(${form.zoom / 100})` }} className={`text-8xl ${esImagen(form.imagen) ? 'w-full h-full' : ''}`}>{esImagen(form.imagen) ? <img src={form.imagen} className="w-full h-full object-contain" /> : form.imagen}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border"><label className="text-xs font-bold uppercase mb-2 block">Zoom</label><input type="range" min="50" max="200" value={form.zoom} onChange={(e) => setForm({ ...form, zoom: e.target.value })} className="w-full accent-orange-600" /></div>
                        <label className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg cursor-pointer block text-center"><Upload size={20} className="inline mr-2" /> Subir Foto <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} /></label>
                    </div>
                    <div className="space-y-4">
                        <input required placeholder="Nombre" className="w-full p-3 border rounded-lg" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" placeholder="Precio" className="w-full p-3 border rounded-lg font-bold text-orange-600" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} />
                            <select className="w-full p-3 border rounded-lg bg-white" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>{ORDEN_CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select>
                        </div>
                        <textarea placeholder="Descripción" className="w-full p-3 border rounded-lg h-32" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                        <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- 2. VISTAS PRINCIPALES ---

// VISTA: HUB MESA (Cuentas Separadas)
export const VistaHubMesa = ({ mesa, onVolver, onAbrirCuenta, onCrearCuenta, onUnirCuentas }) => {
    const [modalUnirOpen, setModalUnirOpen] = useState(false);
    const [modalCrearOpen, setModalCrearOpen] = useState(false);

    return (
        <div className="fixed inset-0 bg-gray-50 z-[50] flex flex-col animate-fade-in-up">
            <div className="bg-white p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft /></button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{mesa.nombre}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={16} /> <span>{mesa.cuentas.length} cuentas activas</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {mesa.cuentas.length > 1 && (
                        <button onClick={() => setModalUnirOpen(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-2">
                            <Merge size={18}/> Unir Cuentas
                        </button>
                    )}
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold">
                        Total Mesa: ${mesa.cuentas.reduce((acc, c) => acc + c.total, 0)}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {mesa.cuentas.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Users size={64} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-bold text-gray-600">Mesa Disponible</h3>
                        <p>No hay cuentas abiertas. Esperando clientes...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mesa.cuentas.map(cuenta => (
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
                                            {cuenta.cuenta.slice(0, 3).map((item, idx) => (
                                                <li key={idx} className="flex justify-between">
                                                    <span>{item.cantidad || 1}x {item.nombre}</span>
                                                </li>
                                            ))}
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
                <button onClick={() => setModalCrearOpen(true)} className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2">
                    <PlusCircle /> Agregar Cuenta Manualmente
                </button>
            </div>
            
            <ModalFusionCuentas 
                isOpen={modalUnirOpen} 
                onClose={() => setModalUnirOpen(false)} 
                cuentas={mesa.cuentas} 
                onConfirmarFusion={(destino, origenes) => { onUnirCuentas(mesa.id, destino, origenes); setModalUnirOpen(false); }} 
            />

            <ModalNuevaCuentaMesa
                isOpen={modalCrearOpen}
                onClose={() => setModalCrearOpen(false)}
                onConfirm={(nombre) => { onCrearCuenta(mesa.id, nombre); setModalCrearOpen(false); }}
            />
        </div>
    );
};

// VISTA: PUNTO DE VENTA (POS) - CON IMPRESIÓN DE TICKET
export const VistaDetalleCuenta = ({ sesion, productos, onCerrar, onAgregarProducto, onPagarCuenta }) => {
    if (!sesion) return null;
    const nombreCliente = sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente;
    const identificador = sesion.tipo === 'llevar' ? 'Para Llevar' : sesion.nombreMesa;

    // FUNCIÓN DE IMPRESIÓN EN POS
    const handleImprimir = () => {
        const datosTicket = {
            id: sesion.id,
            cliente: nombreCliente,
            items: sesion.cuenta,
            total: sesion.total || 0
        };
        imprimirTicket(datosTicket, 'ticket');
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex animate-fade-in-up">
            <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-300">
                <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Menú Digital</h2>
                        <p className="text-sm text-gray-500">{identificador} • <span className="font-bold text-orange-600">{nombreCliente}</span></p>
                    </div>
                    <button onClick={onCerrar} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold"><ArrowLeft size={20} /> Volver</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-orange-50/30">
                    {ORDEN_CATEGORIAS.map(cat => {
                        const prods = productos.filter(p => p.categoria === cat);
                        if (prods.length === 0) return null;
                        return (
                            <div key={cat} className="mb-8">
                                <h3 className="font-bold text-orange-800 text-lg border-b border-orange-200 mb-3 pb-1">{cat}</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {prods.map(prod => (
                                        <div key={prod.id} onClick={() => onAgregarProducto(sesion.id, prod)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-orange-300 transition active:scale-95 flex flex-col items-center text-center">
                                            <div className="text-4xl mb-2">{prod.imagen}</div>
                                            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{prod.nombre}</h4>
                                            <span className="text-orange-600 font-bold">${prod.precio}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="w-96 bg-white shadow-2xl flex flex-col h-full">
                <div className="p-6 bg-gray-900 text-white">
                    <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold">Comanda</h3><p className="text-gray-400 text-xs font-mono">{sesion.id}</p></div><Receipt className="text-orange-400" /></div>
                    <div className="bg-gray-800 p-2 rounded text-xs mb-2">
                        <p className="text-gray-300">Cliente: <span className="text-white font-bold">{nombreCliente}</span></p>
                        {sesion.telefono && <p className="text-gray-300">Tel: <span className="text-white">{sesion.telefono}</span></p>}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {(!sesion.cuenta || sesion.cuenta.length === 0) ? <div className="text-center text-gray-400 py-10 italic">Cuenta vacía.<br />Selecciona productos.</div> : (
                        sesion.cuenta.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{item.nombre}</p>
                                    <p className="text-xs text-gray-500">{item.categoria}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-700">${item.precio}</p>
                                    {item.cantidad > 1 && <p className="text-xs text-orange-600 font-bold">x{item.cantidad}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4"><span className="text-lg font-bold text-gray-600">Total</span><span className="text-3xl font-bold text-gray-900">${sesion.total || 0}</span></div>
                    
                    <div className="flex flex-col gap-2">
                        {/* BOTÓN DE IMPRIMIR */}
                        <button onClick={handleImprimir} disabled={!sesion.cuenta || sesion.cuenta.length === 0} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                            <Printer size={20} /> Imprimir Cuenta
                        </button>
                        
                        <button onClick={() => onPagarCuenta(sesion)} disabled={!sesion.cuenta || sesion.cuenta.length === 0} className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 ${!sesion.cuenta || sesion.cuenta.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                            <DollarSign size={20} /> Cerrar Cuenta y Pagar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// VISTA: CONFIGURACIÓN DE MESAS Y QR
export const VistaGestionMesas = ({ mesas, onAgregarMesa, onEliminarMesa }) => {
    const [qrData, setQrData] = useState(null);

    return (
        <div className="p-8 h-screen overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración de Mesas</h2>
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-800 flex items-center"><Grid className="mr-2" /> Disposición de Mesas</h3>
                    <button onClick={onAgregarMesa} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 flex items-center gap-2"><PlusCircle size={18} /> Agregar Mesa</button>
                </div>
                <p className="text-gray-500 text-sm mb-6">Administra las mesas físicas y genera sus códigos QR. Los clientes pueden escanear estos códigos para abrir una cuenta en esa mesa.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mesas.map(mesa => (
                        <div key={mesa.id} className="relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[160px] bg-white border-gray-200 hover:border-orange-300 transition group">
                            <QrCode size={40} className="text-gray-300 mb-2 group-hover:text-orange-500 transition-colors" />
                            <h3 className="font-bold text-lg text-gray-600">{mesa.nombre}</h3>
                            <div className="flex gap-2 mt-3 w-full">
                                <button onClick={() => setQrData({ titulo: mesa.nombre, sub: `Escanea para pedir en ${mesa.nombre}`, val: `https://app.lya.com/mesa/${mesa.id}` })} className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 py-2 rounded text-gray-700 font-bold">Ver QR</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onEliminarMesa(mesa.id); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={14} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><ShoppingBag className="mr-2 text-orange-500" /> Código QR "Para Llevar"</h3>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-orange-900">QR General para Mostrador</h4>
                        <p className="text-sm text-orange-700 max-w-md">Utiliza este código para clientes que no ocupan mesa pero desean ordenar para llevar desde su celular.</p>
                    </div>
                    <button onClick={() => setQrData({ titulo: "Para Llevar", sub: "Menú Digital General", val: "https://app.lya.com/llevar" })} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 flex items-center gap-2"><QrCode size={20} /> Ver/Imprimir QR</button>
                </div>
            </div>

            <ModalQR isOpen={!!qrData} onClose={() => setQrData(null)} titulo={qrData?.titulo} subtitulo={qrData?.sub} valorQR={qrData?.val} />
        </div>
    );
};

// VISTA: GESTIÓN DE MENÚ
export const VistaMenuCafeteria = ({ productos, onGuardarProducto }) => {
    const [productoEdit, setProductoEdit] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const categorias = [...new Set(productos.map(p => p.categoria))];
    const abrirNuevo = () => { setProductoEdit(null); setModalAbierto(true); };
    const abrirEditar = (prod) => { setProductoEdit(prod); setModalAbierto(true); };

    return (
        <div className="p-8 h-screen overflow-y-auto bg-orange-50/50">
            <div className="flex justify-between items-center mb-8">
                <div className="bg-orange-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex-1 mr-6">
                    <div className="relative z-10"><h2 className="text-3xl font-serif font-bold mb-1">Menú Digital</h2><p className="text-orange-100">Gestión de Productos por Sección</p></div>
                    <Coffee className="absolute right-[-10px] bottom-[-20px] text-orange-700 opacity-20" size={120} />
                </div>
                <button onClick={abrirNuevo} className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-2 transition transform active:scale-95"><PlusCircle size={24} /> Nuevo Producto</button>
            </div>
            {categorias.map(cat => (
                <div key={cat} className="mb-10">
                    <div className="flex items-center gap-4 mb-4"><h3 className="text-2xl font-bold text-orange-800 border-b-2 border-orange-200 pb-1">{cat}</h3><button onClick={() => { setProductoEdit({ categoria: cat }); setModalAbierto(true); }} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition">+ Agregar en {cat}</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productos.filter(p => p.categoria === cat).map(prod => (
                            <div key={prod.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-orange-100 flex flex-col">
                                <div className="h-40 bg-orange-50 flex items-center justify-center overflow-hidden relative">
                                    <div style={{ transform: `scale(${prod.zoom ? prod.zoom / 100 : 1})` }} className="text-6xl transition-transform duration-300">
                                        {prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('data:image')) ? (
                                            <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-contain" />
                                        ) : prod.imagen}
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => abrirEditar(prod)} className="bg-white p-2 rounded-full shadow text-blue-600 hover:bg-blue-50"><Edit size={16} /></button></div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="font-bold text-gray-800 text-lg mb-1">{prod.nombre}</h4>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{prod.descripcion || 'Sin descripción'}</p>
                                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100"><span className="text-xl font-bold text-orange-700">${prod.precio}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <ModalProducto isOpen={modalAbierto} onClose={() => setModalAbierto(false)} producto={productoEdit} onGuardar={(prod) => { onGuardarProducto(prod); setModalAbierto(false); }} />
        </div>
    );
};

// VISTA: INICIO DASHBOARD CAFETERÍA
export const VistaInicioCafeteria = ({ mesas, pedidosLlevar, onSeleccionarMesa, onCrearLlevar, onAbrirLlevar }) => {
    const [modalLlevarOpen, setModalLlevarOpen] = useState(false);
    
    const mesasOcupadas = mesas.filter(m => m.cuentas.length > 0).length;
    const pedidosActivos = pedidosLlevar.length;

    return (
        <div className="p-8 h-screen overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Cafetería - Operaciones en Vivo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <CardStat titulo="Mesas Ocupadas" valor={`${mesasOcupadas} / ${mesas.length}`} color="bg-orange-100 text-orange-800" icon={<Grid size={30} />} />
                <CardStat titulo="Pedidos Para Llevar" valor={pedidosActivos} color="bg-blue-100 text-blue-800" icon={<ShoppingBag size={30} />} />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* COLUMNA IZQUIERDA: MESAS */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center"><Grid className="mr-2"/> Mesas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mesas.map(mesa => {
                            const ocupada = mesa.cuentas.length > 0;
                            const totalMesa = mesa.cuentas.reduce((acc, c) => acc + c.total, 0);
                            return (
                                <div 
                                    key={mesa.id} 
                                    onClick={() => onSeleccionarMesa(mesa.id)}
                                    className={`p-6 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg min-h-[140px]
                                        ${ocupada ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200 hover:border-green-400'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-lg ${ocupada ? 'text-red-700' : 'text-green-700'}`}>{mesa.nombre}</h4>
                                        <div className={`w-3 h-3 rounded-full ${ocupada ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                    </div>
                                    
                                    {ocupada ? (
                                        <div className="mt-2">
                                            <p className="text-2xl font-bold text-red-600">${totalMesa}</p>
                                            <p className="text-xs text-red-400 font-bold">{mesa.cuentas.length} cuenta(s) abierta(s)</p>
                                        </div>
                                    ) : (
                                        <div className="mt-auto">
                                            <p className="text-sm text-green-600 font-bold flex items-center"><PlusCircle size={14} className="mr-1"/> Abrir Mesa</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* COLUMNA DERECHA: PARA LLEVAR */}
                <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-700 flex items-center"><ShoppingBag className="mr-2"/> Para Llevar</h3>
                        <button onClick={() => setModalLlevarOpen(true)} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-700"><PlusCircle size={20}/></button>
                    </div>

                    {pedidosLlevar.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p>No hay pedidos activos.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pedidosLlevar.map(p => (
                                <div key={p.id} onClick={() => onAbrirLlevar(p.id)} className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 cursor-pointer bg-gray-50 hover:bg-white transition">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800">{p.nombreCliente}</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">{p.id}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">{p.telefono}</span>
                                        <span className="font-bold text-orange-600">${p.cuenta.reduce((a,b)=>a+b.precio,0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <ModalNuevoLlevar isOpen={modalLlevarOpen} onClose={() => setModalLlevarOpen(false)} onConfirm={(datos) => { onCrearLlevar(datos); setModalLlevarOpen(false); }} />
        </div>
    );
};