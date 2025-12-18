import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    ShoppingBag, PlusCircle, MinusCircle, Trash2, ArrowRight, CheckCircle, 
    Coffee, AlertCircle, ArrowLeft, Receipt, DollarSign, Phone, Package, 
    LogOut, UserCheck, Info, Box, X, Search, Filter, Download, Clock, XCircle,
    ChevronUp, ChevronDown, WifiOff, ServerOff, HelpCircle, RefreshCw, Loader, BookOpen, Lock
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
        const nombreLimpio = nombre.trim();
        const palabras = nombreLimpio.split(/\s+/);

        if (palabras.length < 2) {
            setError("Por favor, ingresa tu NOMBRE y APELLIDO (Ej. Carlos Pérez).");
            return;
        }
        
        if (nombreLimpio.length < 5) {
            setError("El nombre es muy corto.");
            return;
        }

        if (esParaLlevar && telefono.length !== 10) {
            setError("El teléfono debe ser de 10 dígitos para avisarte.");
            return;
        }
        if (accion) accion(nombre, telefono);
    };

    return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-gradient-bg">
        <style>{`
            .animate-gradient-bg {
                background: linear-gradient(-45deg, #fb923c, #f472b6, #fbbf24, #fb7185);
                background-size: 400% 400%;
                animation: gradient 15s ease infinite;
            }
            @keyframes gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `}</style>

        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-fade-in-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-pink-500"></div>

                <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
                    <Coffee size={32} className="text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Bienvenido a <span className="italic font-serif text-orange-600">LyA</span></h1>
                <p className="text-orange-500 font-medium italic mb-6 text-sm">¡Satisface tu antojo hoy!</p>
                <p className="text-gray-500 mb-6 text-sm">Estás en: <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{mesaNombre}</span></p>
                
                <div className="text-left space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Nombre y Apellido</label>
                        <input 
                            value={nombre} 
                            onChange={handleChangeNombre} 
                            placeholder="Ej. JUAN PÉREZ" 
                            className={`w-full p-4 border rounded-xl font-bold text-gray-700 focus:outline-none transition-colors uppercase bg-gray-50 focus:bg-white ${mensajeBienvenida ? 'border-green-500 bg-green-50' : 'border-gray-200 focus:border-orange-500'}`} 
                        />
                        {mensajeBienvenida && (<p className="text-xs text-green-600 font-bold mt-2 flex items-center animate-bounce-in"><UserCheck size={12} className="mr-1"/> {mensajeBienvenida}</p>)}
                    </div>
                    {esParaLlevar && (<div className="animate-fade-in"><label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Teléfono</label><input value={telefono} onChange={handleChangeTelefono} placeholder="10 DÍGITOS" type="tel" inputMode="numeric" className="w-full p-4 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl font-bold text-gray-700 focus:border-orange-500 focus:outline-none transition-colors" /></div>)}
                </div>
                {error && (<div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 animate-bounce-in border border-red-100"><AlertCircle size={16} className="shrink-0"/> {error}</div>)}
                
                {!tieneCuentaActiva ? (
                    <button type="button" onClick={() => validarYEjecutar(onIngresar)} className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${nombre.trim().includes(' ') && (!esParaLlevar || telefono.length === 10) ? 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700' : 'bg-gray-300 cursor-not-allowed'}`}>
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
            
            <div className="mt-8 text-white/80 font-bold text-xs">
                © 2025 Pastelería y Cafetería LyA
            </div>
        </div>
    );
};

// --- CARRITO FLOTANTE ---
const CarritoFlotante = ({ cuenta, onUpdateCantidad, onEliminar, onConfirmar, enviando }) => {
    const [confirmando, setConfirmando] = useState(false);
    const [expandido, setExpandido] = useState(false); 
    
    const total = cuenta.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad)), 0);
    const totalItems = cuenta.reduce((acc, i) => acc + Number(i.cantidad), 0);

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
                                <span className="font-bold text-gray-900">${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-300">
                            <span>Total</span>
                            <span className="text-orange-600">${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setConfirmando(false)} 
                            disabled={enviando}
                            className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Volver
                        </button>
                        <button 
                            onClick={onConfirmar} 
                            disabled={enviando}
                            className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 ${
                                enviando ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {enviando ? (
                                <>
                                    <Loader className="animate-spin" size={20}/> Procesando...
                                </>
                            ) : 'Sí, Pedir'}
                        </button>
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
                                        <p className="text-xs text-orange-600 font-bold">
                                            ${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}
                                        </p>
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
const VistaMiCuentaTotal = ({ cuentaAcumulada, onVolver, onSolicitarSalida, onVerMenu }) => {
    
    if (!cuentaAcumulada) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500">No hay consumos registrados aún.</p>
            <button onClick={onVolver} className="mt-4 text-orange-600 font-bold">Volver</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col animate-gradient-bg">
            <style>{`
                .animate-gradient-bg {
                    background: linear-gradient(-45deg, #fb923c, #f472b6, #fbbf24, #fb7185);
                    background-size: 400% 400%;
                    animation: gradient 15s ease infinite;
                }
            `}</style>

            <div className="bg-white/95 backdrop-blur-sm text-gray-800 p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10 border-b border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onVolver} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition flex items-center gap-1 text-xs font-bold pl-3 pr-4 shadow-sm">
                        <ArrowLeft size={16}/> Volver
                    </button>
                    <h2 className="text-xl font-bold">Mi Cuenta</h2>
                    <button onClick={onSolicitarSalida} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition shadow-sm">
                        <LogOut size={18} />
                    </button>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1 uppercase font-bold tracking-widest">Total a Pagar</p>
                    <p className="text-5xl font-bold text-orange-600">${cuentaAcumulada.total}</p>
                    <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-wide">{cuentaAcumulada.cliente}</p>
                </div>
            </div>

            <div className="flex-1 px-6 -mt-8 relative z-20 pb-12 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
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
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        ${item.precio} x {item.cantidad || 1}
                                                    </p>
                                                    <span className="font-bold text-gray-900">
                                                        ${(item.precio * (item.cantidad || 1)).toFixed(2)}
                                                    </span>
                                                </div>
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
                                                <div className="text-right">
                                                    <p className="text-[10px] text-blue-400 font-medium">
                                                        ${item.precio} x {item.cantidad || 1}
                                                    </p>
                                                    <span className="font-bold text-gray-900">
                                                        ${(item.precio * (item.cantidad || 1)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <div className="space-y-4 mt-6">
                    <button 
                        onClick={onVerMenu} 
                        className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-blue-100 hover:bg-blue-50 transition shadow-sm"
                    >
                        <BookOpen size={20} /> Ver Menú (Solo Lectura)
                    </button>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center shadow-sm animate-fade-in-up">
                        <p className="text-yellow-800 font-bold text-sm flex flex-col items-center gap-1">
                            <span>💁‍♂️</span>
                            Para pagar, solicita la cuenta al mesero o acércate a caja.
                        </p>
                    </div>

                    <div className="bg-white/80 border border-blue-100 rounded-xl p-6 flex flex-col gap-3 items-center justify-center text-center shadow-sm animate-fade-in-up delay-75">
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

// --- PANTALLA DE DESPEDIDA (MODIFICADA: EFECTO PALPITAR) ---
const PantallaDespedida = ({ cuentaCerrada, onFinalizar, tiempoRestante }) => {
    const esCancelado = cuentaCerrada.estado === 'Cancelado';

    if (esCancelado) {
        return (
            <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center text-red-900 animate-fade-in-up">
                
                {/* CAMBIO: Contenedor relativo para el efecto de palpitar */}
                <div className="relative mb-6">
                    {/* Círculo pulsante detrás (Onda expansiva) */}
                    <div className="absolute inset-0 bg-red-300 rounded-full animate-ping opacity-75"></div>
                    
                    {/* Icono Principal */}
                    <div className="relative w-24 h-24 bg-red-100 rounded-full flex items-center justify-center z-10">
                        <XCircle size={60} className="text-red-600" />
                    </div>
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
            
            {/* CAMBIO: Contenedor relativo para el efecto de palpitar */}
            <div className="relative mb-6">
                {/* Círculo pulsante detrás (Onda expansiva blanca) */}
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50"></div>
                
                {/* Icono Principal */}
                <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center z-10 backdrop-blur-sm">
                    <CheckCircle size={60} className="text-white" />
                </div>
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
export const VistaCliente = ({ mesa, productos, onRealizarPedido, onSalir, servicioActivo = true, tienePedidoActivo = false }) => {
    const [nombreCliente, setNombreCliente] = useState(() => localStorage.getItem('lya_cliente_nombre') || null);
    const [telefonoCliente, setTelefonoCliente] = useState(() => localStorage.getItem('lya_cliente_telefono') || null);
    
    const [carrito, setCarrito] = useState(() => {
        try {
            const guardado = localStorage.getItem('lya_carrito_temp');
            if (guardado) {
                const datosSucios = JSON.parse(guardado);
                return datosSucios.map(item => ({
                    ...item,
                    precio: Number(item.precio),
                    cantidad: Number(item.cantidad)
                }));
            }
            return [];
        } catch (e) {
            return [];
        }
    });

    const [pedidoEnviado, setPedidoEnviado] = useState(false);
    const [viendoCuentaTotal, setViendoCuentaTotal] = useState(false); 
    const [viendoMenuSoloLectura, setViendoMenuSoloLectura] = useState(false);
    const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
    const [confirmarSalida, setConfirmarSalida] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errorConfirmacion, setErrorConfirmacion] = useState(null); 
    const timerRef = useRef(null);
    const [ultimoEstadoCuenta, setUltimoEstadoCuenta] = useState(null);
    const [mostrarDespedida, setMostrarDespedida] = useState(false);
    const [tiempoDespedida, setTiempoDespedida] = useState(10); 
    const [busqueda, setBusqueda] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [productoVerDetalles, setProductoVerDetalles] = useState(null);

    const lanzarNotificacion = (mensaje, tipo = 'info', duracion = 4000) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setNotificacion({ visible: true, mensaje, tipo });
        timerRef.current = setTimeout(() => {
            setNotificacion(prev => ({...prev, visible: false}));
            timerRef.current = null;
        }, duracion);
    };

    const esParaLlevar = useMemo(() => mesa?.nombre.toLowerCase().includes('llevar'), [mesa]);
    
    const miCuentaAcumulada = useMemo(() => {
        if (!mesa || !nombreCliente) return null;
        return mesa.cuentas.find(c => c.cliente === nombreCliente);
    }, [mesa, nombreCliente]);

    useEffect(() => {
        localStorage.setItem('lya_carrito_temp', JSON.stringify(carrito));
    }, [carrito]);

    useEffect(() => {
        if (nombreCliente && mesa) {
            const cuentaActiva = mesa.cuentas.find(c => c.cliente === nombreCliente);
            if (cuentaActiva) {
                setPedidoEnviado(true);
            }
        }
    }, [nombreCliente, mesa]);

    useEffect(() => {
        if (miCuentaAcumulada) {
            setUltimoEstadoCuenta(miCuentaAcumulada);
        } 
        else if (nombreCliente && ultimoEstadoCuenta && !mostrarDespedida && !confirmarSalida) {
            setMostrarDespedida(true);
        }
    }, [miCuentaAcumulada, nombreCliente, ultimoEstadoCuenta, mostrarDespedida, confirmarSalida]);

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
        localStorage.removeItem('lya_cliente_nombre');
        localStorage.removeItem('lya_cliente_telefono');
        localStorage.removeItem('lya_carrito_temp'); 

        setNombreCliente(null);
        setTelefonoCliente(null);
        setUltimoEstadoCuenta(null);
        setPedidoEnviado(false);
        setViendoCuentaTotal(false);
        setViendoMenuSoloLectura(false); 
        setMostrarDespedida(false);
        setTiempoDespedida(10);
        onSalir();
    };

    const handleLoginExitoso = (nombre, telefono) => {
        localStorage.setItem('lya_cliente_nombre', nombre);
        if (telefono) localStorage.setItem('lya_cliente_telefono', telefono);
        setNombreCliente(nombre);
        setTelefonoCliente(telefono);
    };

    const handleIngresoConCuentaExistente = (n, t) => {
        localStorage.setItem('lya_cliente_nombre', n);
        if (t) localStorage.setItem('lya_cliente_telefono', t);
        setNombreCliente(n);
        setTelefonoCliente(t);
        setPedidoEnviado(true);
    };

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

    const agregarAlCarrito = (producto, qty = 1) => {
        if (producto.pausado) return;
        
        const itemExistente = carrito.find(item => item.id === producto.id);
        const cantidadFinal = itemExistente ? (itemExistente.cantidad + qty) : qty;

        setCarrito(prev => {
            const itemEnCarrito = prev.find(item => item.id === producto.id);
            if (itemEnCarrito) { 
                return prev.map(item => item.id === producto.id ? { ...item, cantidad: Number(item.cantidad) + Number(qty) } : item); 
            }
            return [...prev, { ...producto, precio: Number(producto.precio), cantidad: Number(qty), tempId: Date.now() }];
        });

        lanzarNotificacion(`¡${producto.nombre} agregado! ${cantidadFinal > 1 ? `(x${cantidadFinal})` : ''}`, 'exito', 2000);
    };

    const actualizarCantidad = (tempId, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.tempId === tempId) {
                const nuevaCantidad = Number(item.cantidad) + delta;
                return { ...item, cantidad: Math.max(1, nuevaCantidad) };
            }
            return item;
        }));
    };

    const eliminarItem = (tempId) => { setCarrito(prev => prev.filter(item => item.tempId !== tempId)); };
    
    const confirmarPedido = async () => { 
        if (!navigator.onLine) {
            setErrorConfirmacion('offline');
            return;
        }
        setEnviando(true);
        try {
            await new Promise((resolve, reject) => {
                const minTime = new Promise(res => setTimeout(res, 1000));
                const checkInternet = fetch("https://www.google.com/favicon.ico?" + new Date().getTime(), {
                    mode: "no-cors",
                    cache: "no-store"
                });
                Promise.all([minTime, checkInternet])
                    .then(() => resolve())
                    .catch(() => reject(new Error("Sin internet real")));
            });
        } catch (e) {
            setEnviando(false);
            setErrorConfirmacion('offline');
            return; 
        }

        try {
            await onRealizarPedido(mesa.id, nombreCliente, carrito, telefonoCliente); 
            setPedidoEnviado(true); 
            setCarrito([]); 
            localStorage.removeItem('lya_carrito_temp'); 
            setEnviando(false);
            setErrorConfirmacion(null);
        } catch (err) {
            console.error("Error al confirmar pedido:", err);
            setErrorConfirmacion('error');
            setEnviando(false);
        }
    };
    
    const cerrarModalError = () => {
        if (!enviando) {
            setErrorConfirmacion(null);
        }
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

    if (!servicioActivo && !tienePedidoActivo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Lock size={40} className="text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Servicio Cerrado</h2>
                <p className="text-gray-500 max-w-xs mx-auto mb-8">
                    El sistema de pedidos por QR no está disponible en este momento. Por favor, acércate al mostrador.
                </p>
                <div className="text-xs text-gray-400 font-medium">
                    Horario de atención finalizado o en pausa.
                </div>
                <button onClick={onSalir} className="mt-8 text-gray-400 underline text-sm">Salir del sistema</button>
            </div>
        );
    }

    if (!nombreCliente) { 
        return <PantallaLogin 
            mesaNombre={mesa.nombre} 
            onIngresar={handleLoginExitoso} 
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
                    onVerMenu={() => {
                        setViendoCuentaTotal(false);
                        setViendoMenuSoloLectura(true);
                    }}
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

    if (pedidoEnviado && !viendoMenuSoloLectura) { 
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-gradient-bg relative">
                <style>{`
                    .animate-gradient-bg {
                        background: linear-gradient(-45deg, #fb923c, #f472b6, #fbbf24, #fb7185);
                        background-size: 400% 400%;
                        animation: gradient 15s ease infinite;
                    }
                `}</style>
                
                <button onClick={() => setConfirmarSalida(true)} className="absolute top-6 right-6 p-2 bg-white/50 text-red-600 rounded-full hover:bg-white transition">
                    <LogOut size={20} />
                </button>

                {/* CAMBIO: Efecto palpitar en Pedido Activo */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-40"></div>
                    <div className="relative w-24 h-24 bg-white/80 rounded-full flex items-center justify-center z-10 backdrop-blur-sm">
                        <CheckCircle size={60} className="text-green-500" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 shadow-sm">¡Pedido Activo!</h2>
                <p className="text-white/90 mb-6 font-medium">Hola <strong>{nombreCliente}</strong>.</p>
                
                {esParaLlevar ? (
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mb-8 text-left space-y-4">
                        
                        <div className="flex items-start gap-3">
                            <ShoppingBag className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600 text-justify">
                                Estamos preparando tus alimentos para llevar.
                            </p>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <DollarSign className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600 font-bold text-justify">
                                Por favor, acércate a caja para realizar tu pago y esperar tu entrega.
                            </p>
                        </div>
                        
                        {telefonoCliente && (
                            <div className="flex items-start gap-3">
                                <Phone className="text-green-600 mt-1 shrink-0" size={20}/>
                                <div>
                                    <p className="text-sm text-gray-600 text-justify">
                                        Te llamaremos al <strong>{telefonoCliente}</strong> cuando tu pedido esté listo.
                                    </p>
                                    <p className="text-xs text-gray-400 italic mt-1 text-justify">
                                        (Siempre y cuando el personal esté desocupado o disponible para llamar).
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-3 items-start bg-green-50 p-3 rounded-lg border border-green-100">
                            <Info className="text-green-700 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-green-800 font-medium leading-relaxed text-justify">
                                Por preferencia, te recomendamos <strong>esperar cerca o acercarte a caja</strong> a preguntar por tu pedido para evitar demoras.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mb-8 text-left">
                        <div className="flex items-start gap-3 mb-4">
                            <Coffee className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600 text-justify">
                                Tus alimentos llegarán pronto a tu mesa. ¡Disfruta!
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="text-orange-500 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-500 italic text-justify">
                                ¿Deseas llevar algo a casa? Si necesitas empaquetar algún producto o pedir algo extra para llevar, por favor coméntalo a nuestro personal o en caja.
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl text-center shadow-lg">
                        <div className="flex justify-center mb-2 text-blue-500"><Info size={24} /></div>
                        <p className="text-blue-800 text-sm font-bold mb-1">
                            ¿Olvidaste algo?
                        </p>
                        <p className="text-blue-700 text-xs font-medium leading-relaxed">
                            Si deseas agregar más productos, por favor <strong>avisa a nuestro personal</strong> o <strong>acércate a caja</strong> para sumarlo a tu comanda actual.
                        </p>
                    </div>

                    <button onClick={() => setViendoCuentaTotal(true)} className="bg-white text-green-700 font-bold py-3 px-8 rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2 shadow-lg">
                        <Receipt size={18}/> Ver mi Cuenta
                    </button>
                    
                    <button onClick={() => setViendoMenuSoloLectura(true)} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg">
                        <BookOpen size={18}/> Ver Menú (Solo Lectura)
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
        <div className="min-h-screen bg-gray-50 relative animate-gradient-bg"> 
            
            <style>{`
                .animate-gradient-bg {
                    background: linear-gradient(-45deg, #fb923c, #f472b6, #fbbf24, #fb7185);
                    background-size: 400% 400%;
                    animation: gradient 15s ease infinite;
                }
            `}</style>

            <div className="relative z-10 pb-32">
                <Notificacion data={notificacion} onClose={() => setNotificacion({...notificacion, visible: false})} />
                
                {viendoMenuSoloLectura && (
                    <div className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-30 shadow-md text-center">
                        <p className="text-sm font-bold flex items-center justify-center gap-2">
                            <Info size={18} className="shrink-0" />
                            Modo Consulta: Para pedir más, avisa al personal.
                        </p>
                    </div>
                )}

                <div className={`bg-white p-4 ${viendoMenuSoloLectura ? 'sticky top-[48px]' : 'sticky top-0'} z-20 shadow-sm flex justify-between items-center border-b border-gray-100`}>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="font-bold text-gray-800 leading-tight">Menú Digital</h2>
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border border-orange-200">
                                {mesa.nombre}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Hola, <span className="font-bold text-gray-800">{nombreCliente}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        {viendoMenuSoloLectura ? (
                            <button onClick={() => setViendoMenuSoloLectura(false)} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs border border-blue-100 hover:bg-blue-100">
                                <ArrowLeft size={14}/> Volver a mi Pedido
                            </button>
                        ) : (
                            <>
                                {miCuentaAcumulada && (<button onClick={() => setViendoCuentaTotal(true)} className="bg-orange-50 text-orange-600 p-2 rounded-lg font-bold flex items-center gap-1 text-xs border border-orange-100"><DollarSign size={14}/> {miCuentaAcumulada.total}</button>)}
                                <button onClick={() => setConfirmarSalida(true)} className="text-xs bg-gray-100 p-2 rounded text-gray-500 hover:bg-red-50 hover:text-red-500 transition">Salir</button>
                            </>
                        )}
                    </div>
                </div>

                <div className={`bg-white ${viendoMenuSoloLectura ? 'sticky top-[121px]' : 'sticky top-[73px]'} z-10 px-4 py-3 border-b border-gray-200 shadow-sm`}>
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
                                <h3 className="font-bold text-xl text-orange-700 bg-white p-3 rounded-xl shadow-sm mb-4 flex items-center gap-2 border border-orange-100">
                                {cat} 
                                <span className="text-xs font-normal text-white bg-orange-400 px-2 py-0.5 rounded-full">
                                    {prods.length}
                                </span>
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {prods.map(prod => (
                                        <div key={prod.id} className="h-full">
                                            <CardProducto 
                                                producto={prod} 
                                                onClick={() => setProductoVerDetalles(prod)} 
                                                onAdd={viendoMenuSoloLectura ? null : (p) => agregarAlCarrito(p)} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {productosFiltrados.length === 0 && (
                        <div className="text-center py-10 opacity-80 bg-white/50 rounded-xl">
                            <Search size={48} className="mx-auto mb-3 text-gray-400"/>
                            <p className="text-gray-600 font-medium">No encontramos productos con "{busqueda}".</p>
                            <button onClick={() => {setBusqueda(''); setCategoriaFiltro('Todas');}} className="mt-4 text-orange-600 text-sm font-bold hover:underline">Ver todo el menú</button>
                        </div>
                    )}
                </div>

                {!viendoMenuSoloLectura && (
                    <CarritoFlotante 
                        cuenta={carrito} 
                        onUpdateCantidad={actualizarCantidad} 
                        onEliminar={eliminarItem} 
                        onConfirmar={confirmarPedido} 
                        enviando={enviando}
                    />
                )}
                
                <ModalInfoProducto 
                    isOpen={!!productoVerDetalles} 
                    onClose={() => setProductoVerDetalles(null)} 
                    producto={productoVerDetalles} 
                    onAgregar={viendoMenuSoloLectura ? null : agregarAlCarrito} 
                />

                <ModalConfirmacion 
                    isOpen={confirmarSalida}
                    onClose={() => setConfirmarSalida(false)}
                    onConfirm={handleSalidaCompleta}
                    titulo="¿Cerrar Sesión?"
                    mensaje="Si ya confirmó algo, tu cuenta seguirá abierta y activa en el sistema para que nuestro personal lo atienda. Puedes volver a ingresar con tu nombre."
                    tipo="eliminar" 
                />

                {errorConfirmacion && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
                            <div className={`p-6 text-center ${errorConfirmacion === 'offline' ? 'bg-red-50' : 'bg-orange-50'}`}>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${errorConfirmacion === 'offline' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                    {errorConfirmacion === 'offline' ? <WifiOff size={32} /> : <ServerOff size={32} />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                    {errorConfirmacion === 'offline' ? '¡Sin Conexión!' : 'Algo salió mal'}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {errorConfirmacion === 'offline' 
                                        ? 'Parece que perdiste la conexión a internet justo antes de enviar tu pedido.' 
                                        : 'Hubo un problema técnico al comunicarse con la cocina.'}
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
                                    <div className="text-blue-500 shrink-0 mt-0.5"><HelpCircle size={20} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">¿Qué puedes hacer?</p>
                                        <p className="text-sm text-gray-600">
                                            {esParaLlevar
                                                ? 'Por favor, acércate a CAJA y muéstrales esta pantalla para que tomen tu pedido manualmente.'
                                                : 'Por favor, llama a un MESERO y muéstrale esta pantalla. Él tomará tu orden enseguida.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={cerrarModalError}
                                        disabled={enviando}
                                        className="py-3 px-4 rounded-xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cerrar
                                    </button>
                                    <button 
                                        onClick={confirmarPedido}
                                        disabled={enviando}
                                        className={`py-3 px-4 rounded-xl font-bold transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2 ${
                                            enviando 
                                            ? 'bg-gray-700 text-gray-300 cursor-wait' 
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {enviando ? (
                                            <>
                                                <Loader size={18} className="animate-spin" /> Verificando...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={18} /> Reintentar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};