import React, { useState, useMemo } from 'react';
import { ShoppingBag, PlusCircle, MinusCircle, Trash2, ArrowRight, CheckCircle, Coffee, AlertCircle, ArrowLeft, Receipt, DollarSign, Phone, Package } from 'lucide-react';
import { ORDEN_CATEGORIAS } from '../utils/config';

// COMPONENTE: PANTALLA INICIAL (LOGIN)
const PantallaLogin = ({ onIngresar, mesaNombre }) => {
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [error, setError] = useState('');

    // Detectamos si es "Para Llevar" buscando la palabra clave en el nombre de la mesa/zona
    const esParaLlevar = mesaNombre.toLowerCase().includes('llevar');

    const handleChangeNombre = (e) => {
        setNombre(e.target.value.toUpperCase());
        if (error) setError('');
    };

    const handleChangeTelefono = (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 10) {
            setTelefono(val);
            if (error) setError('');
        }
    };

    const handleContinuar = () => {
        if (nombre.trim().length < 3) {
            setError("Por favor, ingresa un nombre válido (mínimo 3 letras).");
            return;
        }
        
        // Validación de teléfono SOLO si es para llevar
        if (esParaLlevar && telefono.length !== 10) {
            setError("El teléfono debe ser de 10 dígitos para avisarte.");
            return;
        }

        onIngresar(nombre, telefono);
    };

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee size={32} className="text-orange-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Bienvenido a <span className="italic font-serif text-orange-600">LyA</span></h1>
                <p className="text-orange-500 font-medium italic mb-6 text-sm">¡Satisface tu antojo hoy!</p>
                <p className="text-gray-500 mb-6 text-sm">Estás en: <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">{mesaNombre}</span></p>
                
                <div className="text-left space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Nombre</label>
                        <input 
                            value={nombre}
                            onChange={handleChangeNombre}
                            placeholder="Ej. JUAN PÉREZ"
                            className="w-full p-4 border-2 border-orange-100 rounded-xl font-bold text-gray-700 focus:border-orange-500 focus:outline-none transition-colors uppercase"
                        />
                    </div>
                    
                    {/* CAMPO DE TELÉFONO (SOLO VISIBLE SI ES PARA LLEVAR) */}
                    {esParaLlevar && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Tu Teléfono (Para avisarte)</label>
                            <input 
                                value={telefono}
                                onChange={handleChangeTelefono}
                                placeholder="10 DÍGITOS"
                                type="tel"
                                inputMode="numeric"
                                className="w-full p-4 border-2 border-orange-100 rounded-xl font-bold text-gray-700 focus:border-orange-500 focus:outline-none transition-colors"
                            />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 animate-bounce-in">
                        <AlertCircle size={16}/> {error}
                    </div>
                )}

                <button 
                    onClick={handleContinuar}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                        nombre.length >= 3 && (!esParaLlevar || telefono.length === 10) 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    Comenzar a Pedir
                </button>
            </div>
        </div>
    );
};

// COMPONENTE: CARRITO FLOTANTE Y CONFIRMACIÓN
const CarritoFlotante = ({ cuenta, onUpdateCantidad, onEliminar, onConfirmar }) => {
    const [confirmando, setConfirmando] = useState(false);
    const total = cuenta.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    if (cuenta.length === 0) return null;

    if (confirmando) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-end sm:items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-bounce-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">¿Confirmar Pedido?</h3>
                    <p className="text-gray-600 mb-4 text-sm">Se enviará a cocina inmediatamente. Revisa que todo esté correcto.</p>
                    <div className="max-h-60 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-xl">
                        {cuenta.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm mb-2 border-b border-gray-100 pb-2 last:border-0">
                                <span>{item.cantidad}x {item.nombre}</span>
                                <span className="font-bold">${item.precio * item.cantidad}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-orange-600">${total}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmando(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600">Volver</button>
                        <button onClick={onConfirmar} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg">Sí, Pedir</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 rounded-t-3xl z-50">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setConfirmando(true)}>
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {cuenta.reduce((acc, i) => acc + i.cantidad, 0)}
                        </div>
                        <span className="font-bold text-gray-800">Ver Pedido</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">${total}</span>
                </div>
                
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {cuenta.map((item) => (
                        <div key={item.tempId} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-800">{item.nombre}</p>
                                <p className="text-xs text-orange-600 font-bold">${item.precio}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => item.cantidad > 1 ? onUpdateCantidad(item.tempId, -1) : onEliminar(item.tempId)} className="text-gray-400 hover:text-red-500"><MinusCircle size={20}/></button>
                                <span className="font-bold w-4 text-center">{item.cantidad}</span>
                                <button onClick={() => onUpdateCantidad(item.tempId, 1)} className="text-orange-600"><PlusCircle size={20}/></button>
                            </div>
                            <button onClick={() => onEliminar(item.tempId)} className="ml-3 text-red-400 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <button onClick={() => setConfirmando(true)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
                    Confirmar Pedido <ArrowRight size={20}/>
                </button>
            </div>
        </div>
    );
};

// COMPONENTE: RESUMEN DE CUENTA TOTAL
const VistaMiCuentaTotal = ({ cuentaAcumulada, onVolver }) => {
    if (!cuentaAcumulada) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500">No hay consumos registrados aún.</p>
            <button onClick={onVolver} className="mt-4 text-orange-600 font-bold">Volver al menú</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-gray-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onVolver} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowLeft size={20}/></button>
                    <h2 className="text-xl font-bold">Mi Cuenta</h2>
                    <div className="w-10"></div> {/* Espaciador */}
                </div>
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-1">Total a Pagar</p>
                    <p className="text-5xl font-bold text-white">${cuentaAcumulada.total}</p>
                    <p className="text-orange-400 text-xs font-bold mt-2 uppercase tracking-wide">{cuentaAcumulada.cliente}</p>
                </div>
            </div>

            <div className="flex-1 px-6 -mt-8 relative z-20 pb-24 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
                    <h3 className="text-gray-800 font-bold border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <Receipt size={18} className="text-orange-500"/> Detalle de Consumo
                    </h3>
                    {cuentaAcumulada.cuenta.length === 0 ? (
                        <p className="text-gray-400 text-center text-sm py-4">Aún no has pedido nada.</p>
                    ) : (
                        cuentaAcumulada.cuenta.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="bg-orange-100 text-orange-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{item.cantidad || 1}</span>
                                    <span className="text-gray-700 font-medium">{item.nombre}</span>
                                </div>
                                <span className="font-bold text-gray-900">${item.precio * (item.cantidad || 1)}</span>
                            </div>
                        ))
                    )}
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">
                    * Si deseas pagar, solicita la cuenta al mesero o acércate a caja.
                </p>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0">
                <button onClick={onVolver} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg">
                    Seguir Pidiendo
                </button>
            </div>
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

    // Detectar si es para llevar
    const esParaLlevar = useMemo(() => mesa?.nombre.toLowerCase().includes('llevar'), [mesa]);

    // Obtener la cuenta real acumulada del cliente en esta mesa
    const miCuentaAcumulada = useMemo(() => {
        if (!mesa || !nombreCliente) return null;
        return mesa.cuentas.find(c => c.cliente === nombreCliente);
    }, [mesa, nombreCliente]);

    const agregarAlCarrito = (producto) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { ...producto, cantidad: 1, tempId: Date.now() }];
        });
    };

    const actualizarCantidad = (tempId, delta) => {
        setCarrito(prev => prev.map(item => {
            if (item.tempId === tempId) {
                return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
            }
            return item;
        }));
    };

    const eliminarItem = (tempId) => {
        setCarrito(prev => prev.filter(item => item.tempId !== tempId));
    };

    const confirmarPedido = () => {
        onRealizarPedido(mesa.id, nombreCliente, carrito, telefonoCliente);
        setPedidoEnviado(true);
        setCarrito([]);
    };

    // 1. Pantalla Login
    if (!nombreCliente) {
        return <PantallaLogin mesaNombre={mesa.nombre} onIngresar={(n, t) => { setNombreCliente(n); setTelefonoCliente(t); }} />;
    }

    // 2. Pantalla Ver Cuenta Total
    if (viendoCuentaTotal) {
        return <VistaMiCuentaTotal cuentaAcumulada={miCuentaAcumulada} onVolver={() => { setViendoCuentaTotal(false); setPedidoEnviado(false); }} />;
    }

    // 3. Pantalla Pedido Enviado (Éxito)
    if (pedidoEnviado) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={60} className="text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Pedido Recibido!</h2>
                <p className="text-gray-600 mb-6">Gracias <strong>{nombreCliente}</strong>.</p>
                
                {/* --- MENSAJE CONDICIONAL SEGÚN TIPO DE PEDIDO --- */}
                {esParaLlevar ? (
                    // MENSAJE PARA LLEVAR
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 max-w-sm w-full mb-8 text-left">
                        <div className="flex items-start gap-3 mb-4">
                            <ShoppingBag className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600">Estamos preparando tus alimentos para llevar.</p>
                        </div>
                        <div className="flex items-start gap-3 mb-4">
                            <DollarSign className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600 font-bold">Por favor, acércate a caja para realizar tu pago y esperar tu entrega.</p>
                        </div>
                        {telefonoCliente && (
                            <div className="flex items-start gap-3">
                                <Phone className="text-green-600 mt-1 shrink-0" size={20}/>
                                <p className="text-sm text-gray-600">Te llamaremos al <strong>{telefonoCliente}</strong> cuando esté listo.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // MENSAJE PARA MESA (CON NOTA EDUCADA SOBRE LLEVAR)
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 max-w-sm w-full mb-8 text-left">
                        <div className="flex items-start gap-3 mb-4">
                            <Coffee className="text-green-600 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-600">Tus alimentos llegarán pronto a tu mesa. ¡Disfruta!</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="text-orange-500 mt-1 shrink-0" size={20}/>
                            <p className="text-sm text-gray-500 italic">
                                ¿Deseas llevar algo a casa? Si necesitas empaquetar algún producto o pedir algo extra para llevar, por favor coméntalo a nuestro personal o en caja.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={() => setPedidoEnviado(false)} className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-green-700 transition">
                        Pedir más cosas
                    </button>
                    <button onClick={() => setViendoCuentaTotal(true)} className="bg-white border-2 border-green-200 text-green-700 font-bold py-3 px-8 rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2">
                        <Receipt size={18}/> Ver mi Cuenta
                    </button>
                </div>
            </div>
        );
    }

    // 4. Pantalla Menú Principal
    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header Cliente */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-gray-800 leading-tight">Menú Digital</h2>
                    <p className="text-xs text-gray-500">Hola, <span className="font-bold text-orange-600">{nombreCliente}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Botón para ver cuenta desde el menú también */}
                    {miCuentaAcumulada && (
                        <button onClick={() => setViendoCuentaTotal(true)} className="bg-orange-50 text-orange-600 p-2 rounded-lg font-bold flex items-center gap-1 text-xs border border-orange-100">
                            <DollarSign size={14}/> {miCuentaAcumulada.total}
                        </button>
                    )}
                    <button onClick={onSalir} className="text-xs bg-gray-100 p-2 rounded text-gray-500">Salir</button>
                </div>
            </div>

            {/* Menú */}
            <div className="p-4">
                {ORDEN_CATEGORIAS.map(cat => {
                    const prods = productos.filter(p => p.categoria === cat);
                    if (prods.length === 0) return null;
                    return (
                        <div key={cat} className="mb-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-3">{cat}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {prods.map(prod => (
                                    <div key={prod.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                                            {prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('data:image')) ? (
                                                <img src={prod.imagen} className="w-full h-full object-contain" alt={prod.nombre}/>
                                            ) : (
                                                prod.imagen
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-800">{prod.nombre}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-1">{prod.descripcion}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="font-bold text-orange-600">${prod.precio}</span>
                                                <button onClick={() => agregarAlCarrito(prod)} className="bg-orange-100 text-orange-700 p-2 rounded-full hover:bg-orange-200 transition">
                                                    <PlusCircle size={20}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <CarritoFlotante 
                cuenta={carrito} 
                onUpdateCantidad={actualizarCantidad} 
                onEliminar={eliminarItem} 
                onConfirmar={confirmarPedido}
            />
        </div>
    );
};