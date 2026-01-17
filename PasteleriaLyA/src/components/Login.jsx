import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader, ShieldCheck, ArrowLeft, Phone, UserCog, Coffee, Sparkles } from 'lucide-react';

// IMPORTA TU IMAGEN
import fondoLogin from '../assets/Login.png'; 

// --- COMPONENTE DE PANTALLA DE CARGA (SPLASH SCREEN) ---
const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-50 bg-[#fff5f0] flex flex-col items-center justify-center overflow-hidden">
            {/* Decoración de fondo (Manchas de color suaves) */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-orange-200 rounded-full blur-3xl opacity-40 animate-pulse delay-700"></div>

            {/* Contenedor Central Animado */}
            <div className="relative flex flex-col items-center z-10">
                {/* Círculo con Icono */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 to-orange-400 rounded-full blur-lg opacity-60 animate-ping"></div>
                    <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center relative z-10 border-4 border-pink-50">
                        <Coffee size={48} className="text-pink-600 animate-bounce" strokeWidth={1.5} />
                    </div>
                    {/* Estrellitas decorativas */}
                    <div className="absolute -top-2 -right-2 animate-spin">
                        <Sparkles className="text-orange-400" size={24} />
                    </div>
                </div>

                {/* Texto de Marca */}
                <h1 className="text-5xl font-bold text-gray-800 mb-2 tracking-wide" style={{ fontFamily: "'Dancing Script', cursive" }}>
                    LyA
                </h1>
                <p className="text-xs font-bold text-pink-700 tracking-[0.2em] uppercase mb-8">
                    Pastelería & Cafetería
                </p>

                {/* Indicador de Carga */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {/* Barra de progreso animada simulada */}
                        <div className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full w-full origin-left animate-[grow_3s_ease-in-out]"></div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium animate-pulse mt-1">
                        Preparando el horno...
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes grow {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export const VistaLogin = ({ onLogin, usuariosDB = [] }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // Estado para mostrar la vista de recuperación
    const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);

    // --- LÓGICA DE SPLASH SCREEN CON MEMORIA ---
    // Usamos una función inicializadora para leer sessionStorage solo al montar
    const [mostrarSplash, setMostrarSplash] = useState(() => {
        // Si ya existe la marca 'lya_splash_visto', NO mostramos splash (false)
        // Si NO existe, mostramos splash (true)
        return !sessionStorage.getItem('lya_splash_visto');
    });

    useEffect(() => {
        // Solo iniciamos el timer si el estado inicial es true
        if (mostrarSplash) {
            const timer = setTimeout(() => {
                setMostrarSplash(false);
                // Una vez terminado, guardamos la marca en el navegador
                sessionStorage.setItem('lya_splash_visto', 'true');
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [mostrarSplash]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        setTimeout(() => {
            // SOLUCIÓN: Respetamos mayúsculas/minúsculas exactamente como las escribes.
            // Solo agregamos la lógica para completar el "@lya.com" si falta.
            const userFound = usuariosDB.find(u => {
                const usuarioInput = usuario.trim(); // Solo quitamos espacios accidentales al inicio/final
                
                // Comparamos:
                // 1. Coincidencia exacta (ej: escribiste "Juan@lya.com")
                // 2. Coincidencia agregando el dominio (ej: escribiste "Juan" -> busca "Juan@lya.com")
                return u.usuario === usuarioInput || u.usuario === `${usuarioInput}@lya.com`;
            });

            const esSuperAdmin = usuario === 'admin' && password === '1234';

            if (esSuperAdmin) {
                onLogin({ nombre: 'ADMINISTRADOR', rol: 'admin' }); 
            } else if (userFound && userFound.password === password) {
                onLogin(userFound); 
            } else {
                setError('Usuario o contraseña incorrectos.');
                setCargando(false);
            }
        }, 800);
    };

    if (mostrarSplash) {
        return <SplashScreen />;
    }

    return (
        // CAMBIO: Contenedor relativo y overflow-hidden para manejar el fondo fijo
        <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 animate-fade-in overflow-hidden">
            
            {/* CAMBIO: Fondo fijo separado del contenido. 
                Al ser 'fixed', el teclado no lo empuja ni lo redimensiona. */}
            <div className="fixed inset-0 z-0 animate-gradient-bg"></div>

            <style>{`
                .animate-gradient-bg {
                    background: linear-gradient(-45deg, #ec4899, #f97316, #db2777, #fb923c);
                    background-size: 400% 400%;
                    animation: gradient 12s ease infinite;
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            {/* TARJETA PRINCIPAL: Fondo blanco sólido */}
            <div className="bg-white/60 w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-bounce-in relative z-10 min-h-[500px] flex flex-col">
                
                {/* Barra superior con degradado Morado -> Indigo */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600 z-10"></div>
                
                {/* --- LÓGICA DE VISTAS --- */}
                
                {mostrarRecuperacion ? (
                    // ==========================================
                    // VISTA RECUPERACIÓN
                    // ==========================================
                    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-fade-in-up">
                        
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 shadow-sm mt-2">
                            <ShieldCheck size={32} className="text-pink-600" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Recuperar Acceso</h3>
                        
                        <p className="text-gray-800 text-xs mb-6 leading-relaxed px-4 font-semibold">
                            Por seguridad, contacta a uno de los responsables para restablecer tus credenciales.
                        </p>
                        
                        <div className="w-full space-y-3 mb-6">
                            <div className="bg-gray-50 p-3 rounded-xl border border-purple-100 w-full flex items-center justify-between px-4 transition-transform hover:scale-[1.02]">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-pink-700 uppercase tracking-widest">Administración</p>
                                    <p className="font-bold text-gray-900 text-sm">Gerente y Dueño</p>
                                </div>
                                <div className="flex items-center gap-2 text-pink-700 bg-white border border-pink-100 px-2 py-1 rounded-lg shadow-sm">
                                    <Phone size={14} />
                                    <span className="font-bold text-sm tracking-wide">55-9988-7766</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-purple-200 w-full flex items-center justify-between px-4 transition-transform hover:scale-[1.02]">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Soporte Técnico</p>
                                    <p className="font-bold text-gray-900 text-sm">Ing. Software</p>
                                </div>
                                <div className="flex items-center gap-2 text-purple-700 bg-white border border-purple-100 px-2 py-1 rounded-lg shadow-sm">
                                    <UserCog size={14} />
                                    <span className="font-bold text-sm tracking-wide">96-0117-6435</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setMostrarRecuperacion(false)}
                            className="text-pink-700 hover:text-pink-900 font-bold flex items-center gap-2 transition-colors text-xs uppercase tracking-wider mt-auto mb-4"
                        >
                            <ArrowLeft size={14} /> Volver al Inicio
                        </button>
                    </div>

                ) : (
                    // ==========================================
                    // VISTA LOGIN
                    // ==========================================
                    <>
                        <div className="p-6 md:p-8 pt-10 md:pt-12 flex-1 flex flex-col justify-center animate-fade-in-up">
                            <div className="text-center mb-8">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                                    LyA
                                </h1>
                                <p className="text-purple-900 text-xs md:text-sm tracking-widest uppercase font-bold">Sistema de Gestión</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" autoComplete="off">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-pink-700 uppercase ml-1">Usuario</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User size={20} className="text-pink-600" />
                                        </div>
                                        {/* CAMBIO: 'text-base' para evitar zoom en iPhone */}
                                        <input 
                                            name="lya_usuario_unico"
                                            id="lya_usuario_unico"
                                            type="text" 
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-purple-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-900 font-bold text-base placeholder-gray-400"
                                            placeholder="Ingresa tu usuario"
                                            value={usuario}
                                            onChange={(e) => setUsuario(e.target.value)}
                                            autoComplete="off"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={20} className="text-pink-600" />
                                        </div>
                                        {/* CAMBIO: 'text-base' para evitar zoom en iPhone */}
                                        <input 
                                            name="lya_password_unico"
                                            id="lya_password_unico"
                                            type={mostrarPassword ? "text" : "password"} 
                                            className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-purple-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-900 font-bold text-base placeholder-gray-400"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setMostrarPassword(!mostrarPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-pink-500 hover:text-pink-700 transition-colors"
                                        >
                                            {mostrarPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-end pt-1">
                                        <button 
                                            type="button"
                                            onClick={() => setMostrarRecuperacion(true)}
                                            className="text-xs text-purple-700 hover:text-purple-900 font-bold transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña o usuario?
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs md:text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in-up border border-red-100 font-bold">
                                        <AlertCircle size={16} className="shrink-0" /> {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={!usuario || !password || cargando}
                                    className={`w-full py-3 md:py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm md:text-base ${!usuario || !password || cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 hover:shadow-xl'}`}
                                >
                                    {cargando ? (
                                        <>
                                            <Loader size={20} className="animate-spin" /> 
                                            <span>Validando...</span>
                                        </>
                                    ) : (
                                        <>Entrar al Sistema <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-gray-50 p-4 text-center text-[10px] md:text-xs text-gray-800 font-bold border-t border-purple-100 mt-auto">
                            © 2026 Pastelería LyA • Sistema v2.0
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};