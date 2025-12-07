import React, { useState } from 'react';
import { User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader, ShieldCheck, ArrowLeft, Phone } from 'lucide-react';

export const VistaLogin = ({ onLogin, usuariosDB = [] }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    
    // Nuevo estado para mostrar la vista de recuperación
    const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        setTimeout(() => {
            // --- LÓGICA DE VALIDACIÓN ---
            
            // 1. Buscar si el usuario existe en la base de datos (pasada como prop)
            const userFound = usuariosDB.find(u => u.usuario === usuario);
            
            // 2. Definir credenciales de respaldo (Super Admin Fijo)
            const esSuperAdmin = usuario === 'admin' && password === '1234';

            // 3. Validar
            if (esSuperAdmin) {
                // Si entra como admin fijo, simulamos un objeto de usuario
                onLogin({ nombre: 'ADMINISTRADOR', rol: 'admin' }); 
            } else if (userFound && userFound.password === password) {
                // Si es un usuario real, pasamos sus datos a onLogin
                onLogin(userFound); 
            } else {
                setError('Usuario o contraseña incorrectos.');
                setCargando(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-bounce-in relative min-h-[500px] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-orange-500 z-10"></div>
                
                {/* --- VISTA DE RECUPERACIÓN (BONITA Y VISUAL) --- */}
                {mostrarRecuperacion && (
                    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <ShieldCheck size={40} className="text-pink-600" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Acceso</h3>
                        
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Por motivos de seguridad, el restablecimiento de contraseñas se realiza únicamente a través del administrador del sistema.
                        </p>
                        
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-100 w-full mb-8">
                            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Soporte Técnico</p>
                            <div className="flex items-center justify-center gap-2 text-gray-800">
                                <Phone size={18} className="text-pink-600" />
                                <span className="font-bold text-lg tracking-wide">55-8123-9045</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setMostrarRecuperacion(false)}
                            className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2 transition-colors text-sm"
                        >
                            <ArrowLeft size={16} /> Volver al Inicio de Sesión
                        </button>
                    </div>
                )}

                {/* --- VISTA NORMAL DE LOGIN --- */}
                <div className="p-6 md:p-8 pt-10 md:pt-12 flex-1 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                            LyA
                        </h1>
                        <p className="text-gray-400 text-xs md:text-sm tracking-widest uppercase">Sistema de Gestión</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <input 
                                    name="lya_usuario_unico"
                                    id="lya_usuario_unico"
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-700 font-medium text-sm md:text-base"
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
                                    <Lock size={20} className="text-gray-400" />
                                </div>
                                <input 
                                    name="lya_password_unico"
                                    id="lya_password_unico"
                                    type={mostrarPassword ? "text" : "password"} 
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-gray-700 font-medium text-sm md:text-base"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {mostrarPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                            
                            {/* Botón de Olvidé Contraseña */}
                            <div className="flex justify-end pt-1">
                                <button 
                                    type="button"
                                    onClick={() => setMostrarRecuperacion(true)}
                                    className="text-xs text-pink-500 hover:text-pink-700 font-bold transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-xs md:text-sm p-3 rounded-lg flex items-center gap-2 animate-fade-in-up border border-red-100">
                                <AlertCircle size={16} className="shrink-0" /> {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={!usuario || !password || cargando}
                            className={`w-full py-3 md:py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm md:text-base ${!usuario || !password || cargando ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 hover:shadow-xl'}`}
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
                
                <div className="bg-gray-50 p-4 text-center text-[10px] md:text-xs text-gray-400 border-t border-gray-100 mt-auto">
                    © 2025 Pastelería y Cafetería LyA
                </div>
            </div>
        </div>
    );
};