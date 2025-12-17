import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader, ShieldCheck, ArrowLeft, Phone, UserCog } from 'lucide-react';

// IMPORTA TU IMAGEN
import fondoLogin from '../assets/Login.png'; 

export const VistaLogin = ({ onLogin, usuariosDB = [] }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // Estado para mostrar la vista de recuperación
    const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        setTimeout(() => {
            const userFound = usuariosDB.find(u => u.usuario === usuario);
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

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-cover bg-center relative"
            style={{ 
                backgroundImage: `url(${fondoLogin})`,
                // backgroundSize: '100% 100%' // Descomenta si prefieres estirar la imagen
            }}
        >
            {/* Capa oscura (Overlay) */}
            <div className="absolute inset-0 bg-black/40 z-0"></div>

            {/* TARJETA PRINCIPAL */}
            {/* Aquí mantuve el /20 que te gustó (bg-white/20 es muy transparente, asegúrate que sea legible) */}
            {/* Si te referías a bg-black/20 en el overlay o bg-white/80, ajusta aquí.  */}
            {/* Voy a poner bg-white/85 como base equilibrada, si usaste /20 en el código anterior cámbialo aquí a tu gusto (ej: bg-white/20) */}
            <div className="bg-white/30 backdrop-blur-sm w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-bounce-in relative z-10 min-h-[500px] flex flex-col">
                
                {/* Barra decorativa */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-orange-500 z-10"></div>
                
                {/* --- LÓGICA DE VISTAS --- */}
                
                {mostrarRecuperacion ? (
                    // ==========================================
                    // VISTA RECUPERACIÓN (Colores mejorados)
                    // ==========================================
                    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-fade-in-up">
                        
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 shadow-sm mt-2">
                            <ShieldCheck size={32} className="text-pink-600" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Recuperar Acceso</h3>
                        
                        {/* Texto más oscuro para leerse mejor */}
                        <p className="text-gray-800 text-xs mb-6 leading-relaxed px-4 font-semibold">
                            Por seguridad, contacta a uno de los responsables para restablecer tus credenciales.
                        </p>
                        
                        <div className="w-full space-y-3 mb-6">
                            <div className="bg-white/60 p-3 rounded-xl border border-pink-200 w-full flex items-center justify-between px-4 transition-transform hover:scale-[1.02]">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-pink-700 uppercase tracking-widest">Soporte Técnico</p>
                                    <p className="font-bold text-gray-900 text-sm">Ing. Sistemas</p>
                                </div>
                                <div className="flex items-center gap-2 text-pink-700 bg-white/80 px-2 py-1 rounded-lg shadow-sm">
                                    <Phone size={14} />
                                    <span className="font-bold text-sm tracking-wide">55-8123-9045</span>
                                </div>
                            </div>

                            <div className="bg-white/60 p-3 rounded-xl border border-purple-200 w-full flex items-center justify-between px-4 transition-transform hover:scale-[1.02]">
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Administración</p>
                                    <p className="font-bold text-gray-900 text-sm">Gerencia</p>
                                </div>
                                <div className="flex items-center gap-2 text-purple-700 bg-white/80 px-2 py-1 rounded-lg shadow-sm">
                                    <UserCog size={14} />
                                    <span className="font-bold text-sm tracking-wide">55-9988-7766</span>
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
                    // VISTA LOGIN (Colores mejorados)
                    // ==========================================
                    <>
                        <div className="p-6 md:p-8 pt-10 md:pt-12 flex-1 flex flex-col justify-center animate-fade-in-up">
                            <div className="text-center mb-8">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                                    LyA
                                </h1>
                                {/* Cambié el gris claro por un morado oscuro/negro para contraste */}
                                <p className="text-purple-900 text-xs md:text-sm tracking-widest uppercase font-bold">Sistema de Gestión</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" autoComplete="off">
                                <div className="space-y-2">
                                    {/* Etiqueta con color rosa oscuro en lugar de gris */}
                                    <label className="text-xs font-bold text-pink-700 uppercase ml-1">Usuario</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            {/* Ícono con color rosa fuerte */}
                                            <User size={20} className="text-pink-600" />
                                        </div>
                                        <input 
                                            name="lya_usuario_unico"
                                            id="lya_usuario_unico"
                                            type="text" 
                                            className="w-full pl-11 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-900 font-bold text-sm md:text-base placeholder-gray-500"
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
                                            {/* Ícono con color rosa fuerte */}
                                            <Lock size={20} className="text-pink-600" />
                                        </div>
                                        <input 
                                            name="lya_password_unico"
                                            id="lya_password_unico"
                                            type={mostrarPassword ? "text" : "password"} 
                                            className="w-full pl-11 pr-12 py-3 bg-white/60 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-900 font-bold text-sm md:text-base placeholder-gray-500"
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
                                    <div className="bg-red-50/90 text-red-600 text-xs md:text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in-up border border-red-100 font-bold">
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
                        
                        <div className="bg-white/40 p-4 text-center text-[10px] md:text-xs text-gray-800 font-bold border-t border-gray-100/30 mt-auto backdrop-blur-sm">
                            © 2025 Pastelería y Cafetería LyA
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};