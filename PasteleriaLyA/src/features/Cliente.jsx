import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    ShoppingBag, PlusCircle, MinusCircle, Trash2, ArrowRight, CheckCircle, 
    Coffee, AlertCircle, ArrowLeft, Receipt, DollarSign, Phone, Package, 
    LogOut, UserCheck, Info, Box, X, Search, Filter, Download, Clock, XCircle,
    ChevronUp, ChevronDown 
} from 'lucide-react';
import { ORDEN_CATEGORIAS, generarTicketPDF } from '../utils/config'; 
import { Notificacion, ModalConfirmacion, CardProducto, ModalInfoProducto } from '../components/Shared';

// --- PANTALLA LOGIN ---
const PantallaLogin = ({ onIngresar, onVerCuentaDirecta, mesaNombre, onSalir, cuentasActivas = [] }) => {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [error, setError] = useState('');
    const [mensajeBienvenida, setMensajeBienvenida] = useState('');
    const [tieneCuentaActiva, setTieneCuentaActiva] = useState(false);

    const esParaLlevar = mesaNombre.toLowerCase().includes('llevar');

    const handleChangeNombre = (e) => {
        const valor = e.target.value.toUpperCase();
        if (/^[A-ZÑÁÉÍÓÚ\s]*$/.test(valor)) {
            setNombre(valor);
            if (error) setError('');
            const cuentaExistente = cuentasActivas.find(c => c.cliente === valor);
            if (cuentaExistente) {
                setMensajeBienvenida(`¡Hola de nuevo! Tienes una cuenta activa.`);
                setTieneCuentaActiva(true);
            } else {
                setMensajeBienvenida('');
                setTieneCuentaActiva(false);
            }
        }
    };

    const handleChangeTelefono = (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 10) {
            setTelefono(val);
            if (error) setError('');
        }
    };

    const validarYEjecutar = (accion) => {
        if (nombre.trim().length < 3) {
            setError("Por favor, ingresa un nombre válido (mínimo 3 letras).");
            return;
        }
        if (esParaLlevar && telefono.length !== 10) {
            setError("El teléfono debe ser de 10 dígitos para avisarte.");
            return;
        }
        if (accion) accion(nombre, telefono);
    };

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center animate-fade-in-up">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee size={32} className="text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Bienvenido a <span className="italic font-serif text-orange-600">LyA</span></h1>
                <p className="text-orange-500 font-medium italic mb-6 text-sm">¡Satisface tu antojo hoy!</p>
                <p className="text-gray-500 mb-6 text-sm">Estás en: <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{mesaNombre}</span></p>
                
                <div className="text-left space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Nombre</label>
                        <input value={nombre} onChange={handleChangeNombre} placeholder="Ej. JUAN PÉREZ" className={`w-full p-4 border-2 rounded-xl font-bold text-gray-700 focus:outline-none transition-colors uppercase ${mensajeBienvenida ? 'border-green-500 bg-green-50' : 'border-orange-100 focus:border-orange-500'}`} />
                        {mensajeBienvenida && (<p className="text-xs text-green-600 font-bold mt-2 flex items-center animate-bounce-in"><UserCheck size={12} className="mr-1"/> {mensajeBienvenida}</p>)}
                    </div>
                    {esParaLlevar && (<div className="animate-fade-in"><label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Teléfono</label><input value={telefono} onChange={handleChangeTelefono} placeholder="10 DÍGITOS" type="tel" inputMode="numeric" className="w-full p-4 border-2 border-orange-100 rounded-xl font-bold text-gray-700 focus:border-orange-500 focus:outline-none transition-colors" /></div>)}
                </div>
                {error && (<div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 animate-bounce-in"><AlertCircle size={16}/> {error}</div>)}
                
                {!tieneCuentaActiva ? (
                    <button type="button" onClick={() => validarYEjecutar(onIngresar)} className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${nombre.length >= 3 && (!esParaLlevar || telefono.length === 10) ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                        Comenzar a Pedir
                    </button>
                ) : (
                    <button type="button" onClick={() => validarYEjecutar(onVerCuentaDirecta)} className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg animate-pulse">
                        <Receipt size={20} /> Ver Estatus de mi Pedido
                    </button>
                )}

                <button type="button" onClick={onSalir} className="mt-4 w-full py-3 rounded-xl font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100">
                    <LogOut size={18} /> Salir
                </button>
            </div>
        </div>
    );
};

// --- CARRITO FLOTANTE (COLAPSABLE / EXPANDIBLE) ---
const CarritoFlotante = ({ cuenta, onUpdateCantidad, onEliminar, onConfirmar }) => {
    const [confirmando, setConfirmando] = useState(false);
    const [expandido, setExpandido] = useState(false); 
    
    const total = cuenta.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalItems = cuenta.reduce((acc, i) => acc + i.cantidad, 0);

    if (cuenta.length === 0) return null;

    if (confirmando) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">¿Confirmar Pedido?</h3>
                    <p className="text-gray-600 mb-4 text-sm">Se enviará a cocina inmediatamente.</p>
                    <div className="max-h-60 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 custom-scrollbar">
                        {cuenta.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm mb-2 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-700"><span className="font-bold">{item.cantidad}x</span> {item.nombre}</span>
                                <span className="font-bold text-gray-900">${(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-300">
                            <span>Total</span>
                            <span className="text-orange-600">${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmando(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Volver</button>
                        <button onClick={onConfirmar} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition transform active:scale-95">Sí, Pedir</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 transition-all duration-300 rounded-t-2xl border-t border-gray-100 ${expandido ? 'p-4' : 'p-0'}`}>
            <div className="max-w-md mx-auto">
                <div 
                    onClick={() => setExpandido(!expandido)} 
                    className={`flex justify-between items-center cursor-pointer select-none ${expandido ? 'mb-4 border-b border-gray-100 pb-3' : 'p-4 active:bg-gray-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm animate-bounce-in">
                            {totalItems}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                Ver Pedido {expandido ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronUp size={16} className="text-orange-500 animate-bounce"/>}
                            </span>
                            {!expandido && <span className="text-[10px] text-gray-400 font-medium">Tocá para desplegar</span>}
                        </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">${total.toFixed(2)}</span>
                </div>
                
                {expandido && (
                    <div className="animate-fade-in-up">
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {cuenta.map((item) => (
                                <div key={item.tempId} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                                    <div className="flex-1 pr-2">
                                        <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.nombre}</p>
                                        <p className="text-xs text-orange-600 font-bold">${item.precio}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                                        <button onClick={() => item.cantidad > 1 ? onUpdateCantidad(item.tempId, -1) : onEliminar(item.tempId)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition"><MinusCircle size={18}/></button>
                                        <span className="font-bold w-4 text-center text-sm">{item.cantidad}</span>
                                        <button onClick={() => onUpdateCantidad(item.tempId, 1)} className="w-6 h-6 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded transition"><PlusCircle size={18}/></button>
                                    </div>
                                    <button onClick={() => onEliminar(item.tempId)} className="ml-2 text-red-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setConfirmando(true)} 
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition transform active:scale-95"
                        >
                            Confirmar Pedido <ArrowRight size={20}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- VISTA MI CUENTA TOTAL ---
const VistaMiCuentaTotal = ({ cuentaAcumulada, onVolver, onSolicitarSalida }) => {
    
    if (!cuentaAcumulada) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500">No hay consumos registrados aún.</p>
            <button onClick={onVolver} className="mt-4 text-orange-600 font-bold">Volver</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-gray-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onVolver} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition flex items-center gap-1 text-xs font-bold pl-3 pr-4">
                        <ArrowLeft size={16}/> Volver
                    </button>
                    <h2 className="text-xl font-bold">Mi Cuenta</h2>
                    <button onClick={onSolicitarSalida} className="p-2 bg-red-500/20 text-red-200 rounded-full hover:bg-red-500/40 transition">
                        <LogOut size={18} />
                    </button>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Total a Pagar</p>
                    <p className="text-5xl font-bold text-white">${cuentaAcumulada.total}</p>
                    <p className="text-orange-400 text-xs font-bold mt-2 uppercase tracking-wide">{cuentaAcumulada.cliente}</p>
                </div>
            </div>

            <div className="flex-1 px-6 -mt-8 relative z-20 pb-12 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h3 className="text-gray-800 font-bold flex items-center gap-2">
                            <Receipt size={18} className="text-orange-500"/> Detalle de Consumo
                        </h3>
                    </div>
                    
                    {cuentaAcumulada.cuenta.length === 0 ? (
                        <p className="text-gray-400 text-center text-sm py-4">Aún no has pedido nada.</p>
                    ) : (
                        <>
                            {cuentaAcumulada.cuenta.some(i => i.origen !== 'personal') && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Tu Pedido Confirmado
                                    </p>
                                    <div className="space-y-3">
                                        {cuentaAcumulada.cuenta.filter(i => i.origen !== 'personal').map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-orange-100 text-orange-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{item.cantidad || 1}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-700 font-medium">{item.nombre}</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-900">${(item.precio * (item.cantidad || 1))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cuentaAcumulada.cuenta.some(i => i.origen === 'personal') && (
                                <div className="bg-blue-50/50 -mx-2 p-3 rounded-xl border border-blue-50">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Agregado por Personal
                                    </p>
                                    <div className="space-y-3">
                                        {cuentaAcumulada.cuenta.filter(i => i.origen === 'personal').map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm border-b border-blue-100 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{item.cantidad || 1}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-700 font-medium">{item.nombre}</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-900">${(item.precio * (item.cantidad || 1))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <div className="space-y-4 mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center shadow-sm animate-fade-in-up">
                        <p className="text-yellow-800 font-bold text-sm flex flex-col items-center gap-1">
                            <span>💁‍♂️</span>
                            Para pagar, solicita la cuenta al mesero o acércate a caja.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col gap-3 items-center justify-center text-center shadow-sm animate-fade-in-up delay-75">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 text-base mb-1">¿Deseas algo más?</h4>
                            <p className="text-sm text-blue-700 leading-relaxed px-4">
                                Si quieres agregar más productos a tu orden, por favor <strong>coméntalo a nuestro personal</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PANTALLA DE DESPEDIDA ---
const PantallaDespedida = ({ cuentaCerrada, onFinalizar, tiempoRestante }) => {
    const esCancelado = cuentaCerrada.estado === 'Cancelado';

    if (esCancelado) {
        return (
            <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center text-red-900 animate-fade-in-up">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
                    <XCircle size={60} className="text-red-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Pedido Cancelado</h2>
                <p className="text-red-700 text-lg mb-8 max-w-xs mx-auto">
                    Tu orden ha sido cancelada por el establecimiento.
                </p>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 w-full max-w-sm mb-8">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Anulado</p>
                    <p className="text-3xl font-bold text-gray-400 line-through decoration-red-500 decoration-2">
                        ${cuentaCerrada.total}
                    </p>
                    <p className="text-xs text-red-400 mt-2 font-medium italic">
                        No se generó cobro.
                    </p>
                </div>
                <div className="flex flex-col items-center gap-2 text-red-400 text-sm">
                    <Clock size={20} className="animate-pulse"/>
                    <p>Cerrando sesión en {tiempoRestante}...</p>
                </div>
                <button 
                    onClick={onFinalizar}
                    className="mt-8 text-red-600 hover:text-red-800 font-bold underline transition"
                >
                    Salir ahora
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center p-8 text-center text-white animate-fade-in-up">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                <CheckCircle size={60} className="text-white" />
            </div>
            
            <h2 className="text-4xl font-bold mb-2">¡Gracias por tu visita!</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xs mx-auto">Tu cuenta ha sido cerrada correctamente. Esperamos verte pronto.</p>
            
            <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm mb-8">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pagado</p>
                <p className="text-4xl font-bold text-green-600 mb-4">${cuentaCerrada.total}</p>
                
                <button 
                    onClick={() => generarTicketPDF(cuentaCerrada)} 
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                >
                    <Download size={20} /> Descargar Ticket Final
                </button>
            </div>

            <div className="flex flex-col items-center gap-2 text-green-200 text-sm">
                <Clock size={20} className="animate-pulse"/>
                <p>Cerrando sesión en {tiempoRestante} segundos...</p>
            </div>

            <button 
                onClick={onFinalizar}
                className="mt-8 text-white/60 hover:text-white font-bold underline decoration-white/30 hover:decoration-white transition"
            >
                Salir ahora
            </button>
        </div>
    );
};

// COMPONENTE PRINCIPAL VISTA CLIENTE
export const VistaCliente = ({ mesa, productos, onRealizarPedido, onSalir }) => {
    const [nombreCliente, setNombreCliente] = useState(null);
    const [telefonoCliente, setTelefonoCliente] = useState(null);
    const [carrito, setCarrito] = useState([]);
    const [pedidoEnviado, setPedidoEnviado] = useState(false);
    const [viendoCuentaTotal, setViendoCuentaTotal] = useState(false); 
    const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
    const [confirmarSalida, setConfirmarSalida] = useState(false);
    
    // --- ESTADOS PARA EL CIERRE DE CUENTA ---
    const [ultimoEstadoCuenta, setUltimoEstadoCuenta] = useState(null);
    const [mostrarDespedida, setMostrarDespedida] = useState(false);
    const [tiempoDespedida, setTiempoDespedida] = useState(10); 

    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [productoVerDetalles, setProductoVerDetalles] = useState(null);

    const esParaLlevar = useMemo(() => mesa?.nombre.toLowerCase().includes('llevar'), [mesa]);
    
    const miCuentaAcumulada = useMemo(() => {
        if (!mesa || !nombreCliente) return null;
        return mesa.cuentas.find(c => c.cliente === nombreCliente);
    }, [mesa, nombreCliente]);

    // --- EFECTO: DETECTAR CIERRE DE CUENTA ---
    useEffect(() => {
        if (miCuentaAcumulada) {
            setUltimoEstadoCuenta(miCuentaAcumulada);
        } 
        else if (nombreCliente && ultimoEstadoCuenta && !mostrarDespedida && !confirmarSalida) {
            setMostrarDespedida(true);
        }
    }, [miCuentaAcumulada, nombreCliente, ultimoEstadoCuenta, mostrarDespedida, confirmarSalida]);

    // --- EFECTO: CONTADOR DE DESPEDIDA ---
    useEffect(() => {
        let intervalo;
        if (mostrarDespedida && tiempoDespedida > 0) {
            intervalo = setInterval(() => {
                setTiempoDespedida(prev => prev - 1);
            }, 1000);
        } else if (tiempoDespedida === 0) {
            handleSalidaCompleta();
        }
        return () => clearInterval(intervalo);
    }, [mostrarDespedida, tiempoDespedida]);

    const handleSalidaCompleta = () => {
        setNombreCliente(null);
        setTelefonoCliente(null);
        setUltimoEstadoCuenta(null);
        setPedidoEnviado(false);
        setViendoCuentaTotal(false);
        setMostrarDespedida(false);
        setTiempoDespedida(10);
        onSalir();
    };

    // --- EFECTO: LIMPIAR CARRITO SI SE PAUSA UN PRODUCTO ---
    useEffect(() => {
        if (carrito.length > 0) {
            const itemsValidos = carrito.filter(itemCarrito => {
                const productoReal = productos.find(p => p.id === itemCarrito.id);
                return productoReal && !productoReal.pausado;
            });

            if (itemsValidos.length !== carrito.length) {
                setCarrito(itemsValidos);
                setNotificacion({ visible: true, mensaje: "Se eliminaron productos de tu carrito porque se acaban de agotar.", tipo: 'warning' });
                setTimeout(() => setNotificacion(prev => ({...prev, visible: false})), 4000);
            }
        }
    }, [productos, carrito]); 

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

    // FUNCIÓN AGREGAR (SIN NOTIFICACIÓN AHORA)
    const agregarAlCarrito = (producto, qty = 1) => {
        if (producto.pausado) return;
        setCarrito(prev => {
            const itemEnCarrito = prev.find(item => item.id === producto.id);
            if (itemEnCarrito) { return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + qty } : item); }
            return [...prev, { ...producto, cantidad: qty, tempId: Date.now() }];
        });
        // Feedback silenciado a petición del usuario
    };

    const actualizarCantidad = (tempId, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.tempId === tempId) {
                const nuevaCantidad = item.cantidad + delta;
                return { ...item, cantidad: Math.max(1, nuevaCantidad) };
            }
            return item;
        }));
    };

    const eliminarItem = (tempId) => { setCarrito(prev => prev.filter(item => item.tempId !== tempId)); };
    
    const confirmarPedido = () => { 
        onRealizarPedido(mesa.id, nombreCliente, carrito, telefonoCliente); 
        setPedidoEnviado(true); 
        setCarrito([]); 
    };
    
    const handleIngresoConCuentaExistente = (n, t) => {
        setNombreCliente(n);
        setTelefonoCliente(t);
        setPedidoEnviado(true);
    };

    if (mostrarDespedida && ultimoEstadoCuenta) {
        return (
            <PantallaDespedida 
                cuentaCerrada={ultimoEstadoCuenta} 
                tiempoRestante={tiempoDespedida}
                onFinalizar={handleSalidaCompleta}
            />
        );
    }

    if (!nombreCliente) { 
        return <PantallaLogin 
            mesaNombre={mesa.nombre} 
            onIngresar={(n, t) => { setNombreCliente(n); setTelefonoCliente(t); }} 
            onVerCuentaDirecta={handleIngresoConCuentaExistente} 
            onSalir={onSalir} 
            cuentasActivas={mesa.cuentas} 
        />; 
    }

    if (viendoCuentaTotal) { 
        return (
            <>
                <VistaMiCuentaTotal 
                    cuentaAcumulada={miCuentaAcumulada} 
                    onVolver={() => setViendoCuentaTotal(false)}
                    onSolicitarSalida={() => setConfirmarSalida(true)}
                />
                <ModalConfirmacion 
                    isOpen={confirmarSalida}
                    onClose={() => setConfirmarSalida(false)}
                    onConfirm={handleSalidaCompleta} 
                    titulo="¿Cerrar Sesión?"
                    mensaje="Tu cuenta seguirá abierta y activa en el sistema. Puedes volver a ingresar con tu nombre."
                    tipo="eliminar" 
                />
            </>
        ); 
    }

    if (pedidoEnviado) { 
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up relative">
                <button onClick={() => setConfirmarSalida(true)} className="absolute top-6 right-6 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                    <LogOut size={20} />
                </button>

                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle size={60} className="text-green-600" /></div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Pedido Activo!</h2>
                <p className="text-gray-600 mb-6">Hola <strong>{nombreCliente}</strong>.</p>
                {esParaLlevar ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 max-w-sm w-full mb-8 text-left space-y-4">
                        <div className="flex items-start gap-3"><ShoppingBag className="text-green-600 mt-1 shrink-0" size={20}/><p className="text-sm text-gray-600">Estamos preparando tus alimentos para llevar.</p></div>
                        <div className="flex items-start gap-3"><DollarSign className="text-green-600 mt-1 shrink-0" size={20}/><p className="text-sm text-gray-600 font-bold">Por favor, acércate a caja para realizar tu pago y esperar tu entrega.</p></div>
                        {telefonoCliente && (<div className="flex items-start gap-3"><Phone className="text-green-600 mt-1 shrink-0" size={20}/><div><p className="text-sm text-gray-600">Te llamaremos al <strong>{telefonoCliente}</strong> cuando esté listo.</p><p className="text-xs text-gray-400 italic mt-1">(Solo si el personal se encuentra disponible para llamar).</p></div></div>)}
                        <div className="flex gap-3 items-start bg-green-50 p-3 rounded-lg border border-green-100"><Info className="text-green-700 shrink-0 mt-0.5" size={18} /><p className="text-xs text-green-800 font-medium leading-relaxed">Por preferencia, te recomendamos <strong>esperar cerca o acercarte a caja</strong> a preguntar por tu pedido para evitar demoras.</p></div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 max-w-sm w-full mb-8 text-left">
                        <div className="flex items-start gap-3 mb-4"><Coffee className="text-green-600 mt-1 shrink-0" size={20}/><p className="text-sm text-gray-600">Tus alimentos llegarán pronto a tu mesa. ¡Disfruta!</p></div>
                        <div className="flex items-start gap-3"><Package className="text-orange-500 mt-1 shrink-0" size={20}/><p className="text-sm text-gray-500 italic">¿Deseas llevar algo a casa? Si necesitas empaquetar algún producto o pedir algo extra para llevar, por favor coméntalo a nuestro personal o en caja.</p></div>
                    </div>
                )}
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center shadow-sm">
                        <div className="flex justify-center mb-2 text-blue-500"><Info size={24} /></div>
                        <p className="text-blue-800 text-sm font-bold mb-1">
                            ¿Olvidaste algo?
                        </p>
                        <p className="text-blue-700 text-xs font-medium leading-relaxed">
                            Si deseas agregar más productos, por favor <strong>avisa a nuestro personal</strong> o <strong>acércate a caja</strong> para sumarlo a tu comanda actual.
                        </p>
                        <p className="text-blue-600 text-[10px] mt-2 italic">
                            ¡Estaremos encantados de atenderte!
                        </p>
                    </div>

                    <button onClick={() => setViendoCuentaTotal(true)} className="bg-white border-2 border-green-200 text-green-700 font-bold py-3 px-8 rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        <Receipt size={18}/> Ver mi Cuenta
                    </button>
                </div>

                <ModalConfirmacion 
                    isOpen={confirmarSalida}
                    onClose={() => setConfirmarSalida(false)}
                    onConfirm={handleSalidaCompleta}
                    titulo="¿Cerrar Sesión?"
                    mensaje="Si ya confirmó algo, tu cuenta seguirá abierta y activa en el sistema para que nuestro personal la atienda. Puedes volver a ingresar con tu nombre."
                    tipo="eliminar" 
                />
            </div>
        ); 
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <Notificacion data={notificacion} onClose={() => setNotificacion({...notificacion, visible: false})} />
            
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center border-b border-gray-100">
                <div>
                    <h2 className="font-bold text-gray-800 leading-tight">Menú Digital</h2>
                    <p className="text-xs text-gray-500">Hola, <span className="font-bold text-orange-600">{nombreCliente}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    {miCuentaAcumulada && (<button onClick={() => setViendoCuentaTotal(true)} className="bg-orange-50 text-orange-600 p-2 rounded-lg font-bold flex items-center gap-1 text-xs border border-orange-100"><DollarSign size={14}/> {miCuentaAcumulada.total}</button>)}
                    <button onClick={() => setConfirmarSalida(true)} className="text-xs bg-gray-100 p-2 rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition">Salir</button>
                </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm sticky top-[73px] z-10 px-4 py-3 border-b border-gray-200 shadow-sm">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="¿Qué se te antoja hoy?" 
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-gray-400"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => setCategoriaFiltro('Todas')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === 'Todas' ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>Todas</button>
                    {ORDEN_CATEGORIAS.map(cat => (<button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${categoriaFiltro === cat ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300'}`}>{cat}</button>))}
                </div>
            </div>

            <div className="p-4">
                {ORDEN_CATEGORIAS.map(cat => {
                    if (categoriaFiltro !== 'Todas' && categoriaFiltro !== cat) return null;
                    const prods = productosFiltrados.filter(p => p.categoria === cat);
                    if (prods.length === 0) return null;

                    return (
                        <div key={cat} className="mb-8 animate-fade-in-up">
                            <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                                {cat} <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{prods.length}</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {prods.map(prod => (
                                    <div key={prod.id} className="h-full">
                                        <CardProducto 
                                            producto={prod} 
                                            onClick={() => setProductoVerDetalles(prod)} 
                                            onAdd={(p) => agregarAlCarrito(p)} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {productosFiltrados.length === 0 && (
                    <div className="text-center py-10 opacity-60">
                        <Search size={48} className="mx-auto mb-3 text-gray-300"/>
                        <p className="text-gray-500 font-medium">No encontramos productos con "{busqueda}".</p>
                        <button onClick={() => {setBusqueda(''); setCategoriaFiltro('Todas');}} className="mt-4 text-orange-600 text-sm font-bold hover:underline">Ver todo el menú</button>
                    </div>
                )}
            </div>

            <CarritoFlotante cuenta={carrito} onUpdateCantidad={actualizarCantidad} onEliminar={eliminarItem} onConfirmar={confirmarPedido} />
            
            <ModalInfoProducto 
                isOpen={!!productoVerDetalles} 
                onClose={() => setProductoVerDetalles(null)} 
                producto={productoVerDetalles} 
                onAgregar={agregarAlCarrito} 
            />

            <ModalConfirmacion 
                isOpen={confirmarSalida}
                onClose={() => setConfirmarSalida(false)}
                onConfirm={handleSalidaCompleta}
                titulo="¿Cerrar Sesión?"
                mensaje="Si ya confirmó algo, tu cuenta seguirá abierta y activa en el sistema para que nuestro personal lo atienda. Puedes volver a ingresar con tu nombre."
                tipo="eliminar" 
            />
        </div>
    );
};