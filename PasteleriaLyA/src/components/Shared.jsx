import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, BarChart3, Coffee, Cake, PlusCircle, Grid, UtensilsCrossed, ArrowLeft, PanelLeftClose, 
    AlertCircle, CheckCircle, X, Trash2, ShoppingBag, CalendarDays, Calculator, Eye, Calendar as CalendarIcon, 
    Printer, FileText, CalendarRange, Menu, LogOut, DollarSign, Monitor, Users, Box, PauseCircle, Shield
} from 'lucide-react';
import { imprimirTicket, formatearFechaLocal } from '../utils/config';

// --- NOTIFICACIÓN FLOTANTE (RESPONSIVE) ---
export const Notificacion = ({ data, onClose }) => {
    if (!data.visible) return null;
    const estilos = {
        exito: "bg-green-600 border-green-700 text-white",
        error: "bg-red-500 border-red-600 text-white",
        info: "bg-blue-600 border-blue-700 text-white",
        warning: "bg-yellow-500 border-yellow-600 text-white"
    };
    return (
        <div className={`fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-[300] flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl border-b-4 animate-bounce-in transition-all duration-300 max-w-[90vw] md:max-w-md ${estilos[data.tipo] || estilos.info}`}>
            {data.tipo === 'error' ? <AlertCircle size={20} className="flex-shrink-0" /> : <CheckCircle size={20} className="flex-shrink-0" />}
            <span className="font-semibold text-xs md:text-sm break-words flex-1">{data.mensaje}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"><X size={16} /></button>
        </div>
    );
};

// --- TARJETA DE ESTADÍSTICAS (RESPONSIVE) ---
export const CardStat = ({ titulo, valor, color, icon }) => (
    <div className={`p-4 md:p-6 rounded-xl shadow-sm border-l-4 ${color.split(' ')[0].replace('bg-', 'border-')} bg-white flex justify-between items-center w-full`}>
        <div className="flex-1">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wide truncate">{titulo}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2 truncate">{valor}</p>
        </div>
        {icon && <div className="text-gray-300 opacity-50 ml-2 flex-shrink-0">{icon}</div>}
    </div>
);

// --- TARJETA DE PRODUCTO (ACTUALIZADA: PAUSADO = AGOTADO) ---
export const CardProducto = ({ producto, onClick }) => {
    const esImagen = (str) => str && (str.startsWith('http') || str.startsWith('data:image'));
    const estaPausado = producto.pausado === true;

    return (
        <div 
            onClick={!estaPausado ? onClick : undefined} 
            className={`bg-white rounded-xl shadow-sm transition-all duration-300 overflow-hidden group border flex flex-col w-full min-w-[130px] sm:min-w-[150px] md:w-48 flex-shrink-0 md:flex-shrink relative ${estaPausado ? 'border-red-100 bg-gray-50 cursor-not-allowed opacity-80' : 'border-orange-100 hover:shadow-lg cursor-pointer'}`}
        >
            <div className="h-24 sm:h-28 bg-orange-50/50 flex items-center justify-center overflow-hidden relative p-3">
                <div 
                    style={{ transform: `scale(${producto.zoom ? producto.zoom / 100 : 1})` }} 
                    className={`w-full h-full flex items-center justify-center transition-transform duration-300 ${!estaPausado ? 'group-hover:scale-110' : 'grayscale'}`}
                >
                    {esImagen(producto.imagen) ? (
                        <img 
                            src={producto.imagen} 
                            alt={producto.nombre} 
                            className="w-full h-full object-contain drop-shadow-sm"
                        />
                    ) : (
                        <span className="text-4xl sm:text-5xl overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-center select-none">
                            {producto.imagen || '☕'}
                        </span>
                    )}
                </div>
                {estaPausado && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-lg transform -rotate-12 border border-white/30 tracking-wider flex items-center gap-1">
                            AGOTADO
                        </span>
                    </div>
                )}
            </div>
            
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    <h4 className={`font-bold text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5em] ${estaPausado ? 'text-gray-400' : 'text-gray-800'}`}>
                        {producto.nombre}
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-2 line-clamp-2 hidden sm:block">
                        {producto.descripcion}
                    </p>
                </div>
                
                <div className="flex justify-between items-end border-t border-gray-100 pt-2 mt-1">
                    <span className={`text-sm sm:text-base font-bold ${estaPausado ? 'text-gray-400 line-through' : 'text-orange-600'}`}>
                        ${producto.precio}
                    </span>
                    
                    {!estaPausado && (
                        <div className="bg-orange-100 text-orange-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                            <PlusCircle size={16} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTES DE NAVEGACIÓN Y LAYOUT ---

const BotonNav = ({ icon, label, active, onClick, colorTheme = "pink" }) => {
    let activeClass, hoverClass;
    if (colorTheme === "orange") {
        activeClass = "bg-orange-600 text-white shadow-md";
        hoverClass = "hover:bg-orange-700 text-orange-100";
    } else if (colorTheme === "gray") {
        activeClass = "bg-gray-700 text-white shadow-md";
        hoverClass = "hover:bg-gray-800 text-gray-200";
    } else {
        activeClass = "bg-pink-700 text-white shadow-md";
        hoverClass = "hover:bg-pink-800 text-pink-100";
    }
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${active ? activeClass : hoverClass}`}>
            {icon} <span className="font-medium whitespace-nowrap truncate">{label}</span>
        </button>
    );
};

// --- SIDEBAR MODIFICADO PARA NAVEGACIÓN DIRECTA ENTRE MÓDULOS ---
export const Sidebar = ({ modo, vistaActual, setVistaActual, setModo, isOpen, toggleSidebar, onLogout, escala, setEscala }) => {
    let colorBg, colorText, themeBtn;
    if (modo === 'cafeteria') { colorBg = "bg-orange-900"; colorText = "text-orange-200"; themeBtn = "orange"; } 
    else if (modo === 'admin') { colorBg = "bg-gray-900"; colorText = "text-gray-200"; themeBtn = "gray"; } 
    else { colorBg = "bg-pink-900"; colorText = "text-pink-200"; themeBtn = "pink"; }
    
    const handleNavClick = (action) => { if (window.innerWidth < 768) { toggleSidebar(); } action(); };

    return (
        <>
            {isOpen && (<div className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300" onClick={toggleSidebar} />)}
            <aside className={`${isOpen ? 'translate-x-0 w-64 md:w-64 lg:w-72' : '-translate-x-full w-0 md:w-0'} ${colorBg} text-white h-full flex flex-col shadow-2xl transition-all duration-300 overflow-hidden fixed md:relative z-50 md:z-auto`}>
                
                {/* HEADER SIDEBAR */}
                <div className="p-4 md:p-6 text-center flex-shrink-0 relative group">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>LyA</h1>
                    <p className={`text-xs ${colorText} uppercase tracking-widest font-bold`}>{modo === 'admin' ? 'Administración' : modo === 'pasteleria' ? 'Modo Pastelería' : 'Modo Cafetería'}</p>
                    <button onClick={toggleSidebar} className="absolute top-4 right-2 p-2 hover:bg-white/10 rounded-full hidden md:block text-white/50 hover:text-white transition"><PanelLeftClose size={20} /></button>
                </div>
                {isOpen && (<button onClick={toggleSidebar} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full md:hidden"><X size={20} className="text-white" /></button>)}
                
                {/* NAVEGACIÓN PRINCIPAL */}
                <nav className="flex-1 overflow-y-auto px-3 md:px-4 py-2 space-y-1 custom-scrollbar no-scrollbar">
                    
                    {/* MENÚ ESPECÍFICO SEGÚN EL MODO ACTUAL */}
                    {modo === 'admin' && (
                        <>
                            <BotonNav icon={<LayoutDashboard size={18}/>} label="Inicio Admin" active={vistaActual === 'inicio'} onClick={() => handleNavClick(() => setVistaActual('inicio'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<BarChart3 size={18}/>} label="Reporte Comparativo" active={vistaActual === 'ventas'} onClick={() => handleNavClick(() => setVistaActual('ventas'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<Users size={18}/>} label="Gestión Usuarios" active={vistaActual === 'usuarios'} onClick={() => handleNavClick(() => setVistaActual('usuarios'))} colorTheme={themeBtn}/>
                        </>
                    )}
                    
                    {modo === 'pasteleria' && (
                        <>
                            <BotonNav icon={<LayoutDashboard size={18}/>} label="Inicio" active={vistaActual === 'inicio'} onClick={() => handleNavClick(() => setVistaActual('inicio'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<PlusCircle size={18}/>} label="Nuevo Pedido" active={vistaActual === 'pedidos'} onClick={() => handleNavClick(() => setVistaActual('pedidos'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<CalendarRange size={18}/>} label="Agenda Pedidos" active={vistaActual === 'agenda'} onClick={() => handleNavClick(() => setVistaActual('agenda'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<BarChart3 size={18}/>} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => handleNavClick(() => setVistaActual('ventas'))} colorTheme={themeBtn}/>
                        </>
                    )}
                    
                    {modo === 'cafeteria' && (
                        <>
                            <BotonNav icon={<LayoutDashboard size={18}/>} label="Inicio" active={vistaActual === 'inicio'} onClick={() => handleNavClick(() => setVistaActual('inicio'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<Grid size={18}/>} label="Punto de Venta (QR)" active={vistaActual === 'mesas'} onClick={() => handleNavClick(() => setVistaActual('mesas'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<UtensilsCrossed size={18}/>} label="Gestión de Menú" active={vistaActual === 'menu'} onClick={() => handleNavClick(() => setVistaActual('menu'))} colorTheme={themeBtn}/>
                            <BotonNav icon={<BarChart3 size={18}/>} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => handleNavClick(() => setVistaActual('ventas'))} colorTheme={themeBtn}/>
                        </>
                    )}

                    {/* SEPARATOR & QUICK ACCESS LINKS (VISIBLES EN TODOS LOS MODOS) */}
                    <div className="my-4 border-t border-white/20"></div>
                    <p className="text-[10px] text-white/50 uppercase font-bold mb-2 px-2 tracking-wider">Cambiar de Área</p>

                    {modo !== 'admin' && (
                        <button onClick={() => handleNavClick(() => { setModo('admin'); setVistaActual('inicio'); })} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white group">
                            <Shield size={18} className="group-hover:text-gray-200"/>
                            <span className="text-sm truncate">Administración</span>
                        </button>
                    )}

                    {modo !== 'pasteleria' && (
                        <button onClick={() => handleNavClick(() => { setModo('pasteleria'); setVistaActual('inicio'); })} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-pink-300 hover:text-white group">
                            <Cake size={18} className="group-hover:text-pink-200"/>
                            <span className="text-sm truncate">Pastelería</span>
                        </button>
                    )}

                    {modo !== 'cafeteria' && (
                        <button onClick={() => handleNavClick(() => { setModo('cafeteria'); setVistaActual('inicio'); })} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-orange-300 hover:text-white group">
                            <Coffee size={18} className="group-hover:text-orange-200"/>
                            <span className="text-sm truncate">Cafetería</span>
                        </button>
                    )}

                </nav>

                {/* FOOTER SIDEBAR */}
                <div className="mt-auto px-3 md:px-4 py-4 space-y-2 border-t border-white/10">
                    <div className="bg-black/20 rounded-xl p-3 mb-2">
                        <p className="text-[10px] uppercase font-bold text-white/60 mb-2 flex items-center gap-1"><Monitor size={10} /> Tamaño de Vista</p>
                        <div className="flex gap-1">
                            <button onClick={() => setEscala('grande')} className={`flex-1 py-1 text-xs font-bold rounded ${escala === 'grande' ? 'bg-white text-gray-900 shadow' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>G</button>
                            <button onClick={() => setEscala('mediano')} className={`flex-1 py-1 text-xs font-bold rounded ${escala === 'mediano' ? 'bg-white text-gray-900 shadow' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>M</button>
                            <button onClick={() => setEscala('pequeno')} className={`flex-1 py-1 text-xs font-bold rounded ${escala === 'pequeno' ? 'bg-white text-gray-900 shadow' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>P</button>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-red-200 hover:text-red-100">
                        <LogOut size={18}/><span className="font-medium text-sm truncate">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

// --- LAYOUT PRINCIPAL (MODIFICADO PARA GUARDAR PREFERENCIA) ---
export const LayoutConSidebar = ({ children, modo, vistaActual, setVistaActual, setModo, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    
    // --- LÓGICA DE ESCALA: Lee de localStorage o usa 'pequeno' por defecto ---
    const [escala, setEscala] = useState(() => {
        const guardado = localStorage.getItem('lya_escala_pref');
        return guardado || 'pequeno'; // Si no hay nada guardado, usa 'pequeno'
    });

    // Efecto para guardar la preferencia cada vez que cambie
    useEffect(() => {
        localStorage.setItem('lya_escala_pref', escala);
    }, [escala]);

    const zoom = useMemo(() => { 
        switch(escala) { 
            case 'mediano': return 0.88; 
            case 'pequeno': return 0.78; 
            default: return 1; 
        } 
    }, [escala]);

    useEffect(() => { 
        const handleResize = () => { 
            if (window.innerWidth < 768) { setSidebarOpen(false); } else { setSidebarOpen(true); } 
        }; 
        window.addEventListener('resize', handleResize); 
        return () => window.removeEventListener('resize', handleResize); 
    }, []);

    return (
        <div className="flex bg-gray-50 overflow-hidden transition-all duration-300" style={{ zoom: zoom, height: `${100 / zoom}vh`, width: '100%', }}>
            <Sidebar modo={modo} vistaActual={vistaActual} setVistaActual={setVistaActual} setModo={setModo} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={onLogout} escala={escala} setEscala={setEscala} />
            <div className="flex-1 flex flex-col w-full h-full relative transition-all duration-300">
                <header className="md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between z-40 shrink-0"><button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100"><Menu size={24} /></button><h1 className="text-xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>{modo === 'admin' ? 'Administración' : modo === 'pasteleria' ? 'Pastelería' : 'Cafetería'}</h1><div className="w-10"></div></header>
                {!sidebarOpen && (<button onClick={() => setSidebarOpen(true)} className="hidden md:flex absolute top-4 left-4 z-40 bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110 animate-fade-in" title="Mostrar menú"><Menu size={24} /></button>)}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
};

// --- MODALES ---

export const ModalConfirmacion = ({ isOpen, onClose, onConfirm, titulo = "¿Estás seguro?", mensaje = "Esta acción no se puede deshacer.", tipo = "eliminar" }) => {
    if (!isOpen) return null;
    const esPago = tipo === 'pago';
    const estilos = esPago ? { borde: "border-green-500", icono: <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4 animate-bounce-in"><DollarSign size={32} className="text-green-600" /></div>, boton: "bg-green-600 hover:bg-green-700 text-white" } : { borde: "border-red-500", icono: <Trash2 size={40} className="text-red-500 mx-auto mb-4" />, boton: "bg-red-600 hover:bg-red-700 text-white" };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[280] p-4 backdrop-blur-sm transition-all">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md overflow-hidden animate-bounce-in transform border-t-8 ${estilos.borde}`}>
                <div className="p-6 text-center">
                    {estilos.icono}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{titulo}</h3>
                    <p className="text-gray-500 mb-6 text-sm">{mensaje}</p>
                    <div className="flex space-x-3 justify-center"><button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">Cancelar</button><button onClick={onConfirm} className={`px-5 py-2.5 rounded-lg font-bold shadow-lg hover:shadow-xl transition transform active:scale-95 ${estilos.boton}`}>Confirmar</button></div>
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
    const saldoPendiente = (montoTotal - (montoPorPago * pagosRealizados));
    const montoACobrar = esLiquidacion ? saldoPendiente : montoPorPago;
    const cambio = montoRecibido ? (parseFloat(montoRecibido) - montoACobrar) : 0;
    const esMontoSuficiente = montoRecibido && parseFloat(montoRecibido) >= montoACobrar - 0.01;
    const porcentajePagado = (pagosRealizados / numPagos) * 100;
    const esCafeteria = pedido.origen === 'Cafetería';
    const pagosRestantes = numPagos - pagosRealizados;
    const handleCobrar = () => { if (esMontoSuficiente) { onRegistrarPago(pedido.folio, esLiquidacion); setMontoRecibido(''); setEsLiquidacion(esPagoUnico); } };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[270] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
                <div className="bg-pink-900 p-4 md:p-6 text-white flex justify-between shrink-0"><div><h3 className="text-xl md:text-2xl font-bold">{pedido.cliente}</h3><p className="text-pink-200 font-mono text-sm">{pedido.folioLocal || pedido.folio || pedido.id}</p></div><button onClick={cerrar}><X /></button></div>
                <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-gray-50 p-4 rounded-xl border"><h4 className="text-sm font-bold text-gray-500 uppercase flex items-center mb-2"><ShoppingBag size={14} className="mr-2" /> Descripción</h4><span className={`text-xs font-bold px-2 py-1 rounded-full uppercase mb-2 inline-block ${esCafeteria ? 'bg-orange-100 text-orange-700' : 'bg-pink-100 text-pink-700'}`}>{pedido.tipoProducto || (esCafeteria ? 'Consumo Cafetería' : 'Producto')}</span><p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">{pedido.detalles || (esCafeteria ? `Venta de mostrador con ${pedido.items} artículos.` : 'Sin detalles.')}</p></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">{pedido.telefono && <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium text-gray-700">{pedido.telefono}</p></div>}{pedido.fechaEntrega && <div><p className="text-xs text-gray-400">Entrega Programada</p><p className="font-medium text-pink-700 flex items-center gap-1"><CalendarDays size={14} />{formatearFechaLocal(pedido.fechaEntrega)}</p></div>}<div><p className="text-xs text-gray-400">Fecha Registro</p><p className="font-medium text-gray-700 flex items-center gap-1"><CalendarDays size={14} />{formatearFechaLocal(pedido.fecha)}</p></div></div>
                    {!esCafeteria && (<div className="flex flex-col sm:flex-row gap-2"><button onClick={() => imprimirTicket(pedido, 'comanda')} className="flex-1 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 text-pink-700"><FileText size={16}/> Comanda Cocina</button></div>)}
                    <hr className="border-gray-100" />
                    {pedido.estado === 'Cancelado' ? (<div className="w-full bg-red-100 text-red-800 font-bold py-6 rounded-xl text-center flex flex-col justify-center items-center border border-red-200"><AlertCircle size={32} className="mb-2" /><span className="text-lg">Pedido cancelado</span></div>) : (<div><div className="flex justify-between items-end mb-2"><span className="text-3xl font-bold text-gray-800">${montoTotal.toFixed(2)}</span><span className="text-sm text-gray-500 mb-1">Total</span></div><div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${porcentajePagado}%` }}></div></div>{!esCafeteria && <div className="flex justify-between text-sm text-gray-600 mb-6"><span>Pagado: {pagosRealizados} de {numPagos}</span><span>Resta: ${saldoPendiente.toFixed(2)}</span></div>}{pagosRestantes > 0 ? (<div className="bg-pink-50 rounded-xl p-4 md:p-5 border border-pink-100"><h5 className="font-bold text-pink-800 mb-3 flex items-center"><Calculator size={16} className="mr-2" /> Cajero</h5>{!esPagoUnico ? (<div className="flex space-x-2 mb-4"><button onClick={() => { setEsLiquidacion(false); setMontoRecibido(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Abono (${montoPorPago.toFixed(2)})</button><button onClick={() => { setEsLiquidacion(true); setMontoRecibido(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Liquidar (${saldoPendiente.toFixed(2)})</button></div>) : (<div className="mb-4 p-2 bg-pink-100 text-pink-800 text-center rounded-lg text-sm font-bold border border-pink-200">Pago de Contado (Total: ${saldoPendiente.toFixed(2)})</div>)}<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"><div><label className="text-xs font-bold text-gray-500">Recibido</label><input type="number" min="0" className="w-full p-2 rounded border font-bold" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} /></div><div><label className="text-xs font-bold text-gray-500">Cambio</label><div className="w-full p-2 rounded border font-bold bg-white text-green-600">${cambio >= 0 ? cambio.toFixed(2) : '0.00'}</div></div></div><button onClick={handleCobrar} disabled={!esMontoSuficiente} className={`w-full py-3 rounded-xl font-bold shadow-lg text-white ${esMontoSuficiente ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'}`}>Confirmar Cobro</button></div>) : (<div className="w-full bg-green-100 text-green-800 font-bold py-3 rounded-xl text-center border border-green-200">¡Pagado / Liquidado!</div>)}</div>)}
                </div>
            </div>
        </div>
    );
};

export const ModalVentasDia = ({ dia, mes, anio, ventas, cerrar, onVerDetalle }) => {
    if (!dia) return null;
    const ventasDelDia = ventas.filter(v => { const [y, m, d] = v.fecha.split('-').map(Number); return d === parseInt(dia) && m === (mes + 1) && y === anio; });
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up"><div className="bg-pink-900 p-4 flex justify-between items-center text-white sticky top-0 z-10 shrink-0"><h3 className="font-bold text-lg flex items-center gap-2"><CalendarIcon size={20} /> Ventas del {dia}/{mes + 1}/{anio}</h3><button onClick={cerrar}><X /></button></div><div className="p-4 overflow-y-auto flex-1 bg-gray-50 custom-scrollbar">{ventasDelDia.length === 0 ? <div className="text-center text-gray-500 py-10">No hay ventas registradas.</div> : (<div className="space-y-3">{ventasDelDia.map((v, i) => (<div key={i} onClick={() => onVerDetalle(v)} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-pink-300 transition-all group"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.origen === 'Pastelería' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>{v.origen}</span><span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs flex items-center gap-1"><Eye size={12} /> Ver detalles</span></div><p className="font-bold text-gray-800">{v.cliente}</p>{v.tipoProducto && <p className="text-xs text-gray-500">{v.tipoProducto}</p>}</div><div className="text-right"><span className="block font-bold text-green-600 text-lg">${v.total}</span><span className="text-[10px] text-gray-400 font-mono">{v.folioLocal || v.folio || v.id}</span></div></div>))}</div>)}</div></div></div>
    );
};

export const ModalAgendaDia = ({ fechaIso, pedidos, cerrar, onVerDetalle }) => {
    if (!fechaIso) return null;
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    const entregasDelDia = pedidos.filter(p => p.fechaEntrega === fechaIso && p.estado !== 'Cancelado');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up border-t-8 border-pink-500"><div className="bg-white p-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-10 shrink-0"><div><h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><CalendarRange size={24} className="text-pink-600"/> Agenda {dia}/{mes}/{anio}</h3><p className="text-xs text-gray-500 mt-1">{entregasDelDia.length} pedidos por entregar</p></div><button onClick={cerrar} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20}/></button></div><div className="p-4 overflow-y-auto flex-1 bg-pink-50/30 custom-scrollbar">{entregasDelDia.length === 0 ? (<div className="text-center py-10 text-gray-400"><Cake size={48} className="mx-auto mb-2 opacity-20"/><p>Día libre. No hay entregas programadas.</p></div>) : (<div className="space-y-3">{entregasDelDia.map((p, i) => (<div key={i} onClick={() => onVerDetalle(p)} className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-pink-300 transition-all group relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div><div className="flex-1 pl-3"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 uppercase tracking-wider">{p.tipoProducto}</span><span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs flex items-center gap-1"><Eye size={12} /> Detalles</span></div><p className="font-bold text-gray-800 text-lg">{p.cliente}</p><p className="text-xs text-gray-500 line-clamp-1 italic">{p.detalles || 'Sin detalles especificados'}</p></div><div className="text-right"><span className={`px-2 py-1 rounded text-xs font-bold ${p.estado === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.estado}</span></div></div>))}</div>)}</div></div></div>
    );
};