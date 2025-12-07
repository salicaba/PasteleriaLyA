import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, X, CloudUpload, Trash2, AlertTriangle, Users, Shield, Briefcase, UserPlus, Edit, Check, Sparkles } from 'lucide-react';
import { CardStat, ModalConfirmacion } from '../components/Shared';
import { formatearFechaLocal, PRODUCTOS_CAFETERIA_INIT, MESAS_FISICAS_INIT } from '../utils/config';

// --- IMPORTACIONES DE FIREBASE ---
import { db } from '../firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';

export const VistaInicioAdmin = ({ pedidos, ventasCafeteria }) => {
    const [cargando, setCargando] = useState(false);

    // --- FUNCIÓN PARA SUBIR DATOS INICIALES ---
    const subirDatosIniciales = async () => {
        if (!confirm("¿Subir productos y mesas iniciales a la base de datos?")) return;
        setCargando(true);
        try {
            const batch = writeBatch(db);
            // 1. Subir Productos
            if (PRODUCTOS_CAFETERIA_INIT.length > 0) {
                PRODUCTOS_CAFETERIA_INIT.forEach(prod => {
                    const ref = doc(collection(db, "productos")); 
                    batch.set(ref, prod);
                });
            }
            // 2. Subir Mesas
            if (MESAS_FISICAS_INIT.length > 0) {
                MESAS_FISICAS_INIT.forEach(mesa => {
                    const ref = doc(db, "mesas", mesa.id);
                    batch.set(ref, mesa);
                });
            }
            await batch.commit();
            alert("¡Éxito! Datos subidos.");
        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + error.message);
        }
        setCargando(false);
    };

    // --- FUNCIÓN PARA BORRAR TODO DE LA BD (RESET) ---
    const borrarBaseDatos = async () => {
        if (!confirm("⚠️ ¡PELIGRO! ⚠️\n\nEsto borrará TODOS los productos y mesas de la Base de Datos en la nube.\n¿Estás seguro?")) return;
        setCargando(true);
        try {
            const batch = writeBatch(db);
            
            // 1. Obtener y borrar productos
            const prodSnapshot = await getDocs(collection(db, "productos"));
            prodSnapshot.forEach((doc) => batch.delete(doc.ref));

            // 2. Obtener y borrar mesas
            const mesasSnapshot = await getDocs(collection(db, "mesas"));
            mesasSnapshot.forEach((doc) => batch.delete(doc.ref));

            await batch.commit();
            alert("✅ Base de datos limpiada correctamente.");
        } catch (error) {
            console.error("Error borrando:", error);
            alert("Error al borrar: " + error.message);
        }
        setCargando(false);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Panel General (Dueño)</h2>
                
                <div className="flex gap-2">
                    {/* Botón para subir (útil si llenas config.js después) */}
                    <button 
                        onClick={subirDatosIniciales}
                        disabled={cargando}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-300 transition"
                    >
                        {cargando ? "Procesando..." : <><CloudUpload size={16}/> Cargar Iniciales</>}
                    </button>

                    {/* BOTÓN PARA BORRAR TODO (RESET) */}
                    <button 
                        onClick={borrarBaseDatos}
                        disabled={cargando}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-200 transition border border-red-200"
                    >
                        <Trash2 size={16}/> Limpiar BD
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm">
                    <h3 className="text-xl font-bold text-pink-800 mb-2">Área Pastelería</h3>
                    <p className="text-gray-600 mb-4">{pedidos.filter(p => p.estado !== 'Cancelado').length} pedidos activos</p>
                    <p className="text-3xl font-bold text-pink-600">${pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.total, 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <h3 className="text-xl font-bold text-orange-800 mb-2">Área Cafetería</h3>
                    <p className="text-gray-600 mb-4">{ventasCafeteria.length} tickets registrados</p>
                    <p className="text-3xl font-bold text-orange-600">${ventasCafeteria.reduce((s, v) => s + v.total, 0)}</p>
                </div>
            </div>
        </div>
    );
};

export const VistaReporteUniversal = ({ pedidosPasteleria, ventasCafeteria, modo, onAbrirModalDia }) => {
    const [mesSeleccionado, setMesSeleccionado] = useState('2025-12');
    const [rangoInicio, setRangoInicio] = useState('');
    const [rangoFin, setRangoFin] = useState('');

    const todosLosDatosCompletos = useMemo(() => {
        let datos = [];
        if (modo === 'admin') datos = [...pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' })), ...ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }))];
        else if (modo === 'pasteleria') datos = pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' }));
        else datos = ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }));
        return datos.filter(p => p.estado !== 'Cancelado');
    }, [pedidosPasteleria, ventasCafeteria, modo]);

    const datosReporte = useMemo(() => {
        let datosFiltrados = todosLosDatosCompletos;
        let tituloPeriodo = "";
        const [anioStr, mesStr] = mesSeleccionado.split('-');
        const anio = parseInt(anioStr);
        const mes = parseInt(mesStr) - 1;

        if (rangoInicio && rangoFin) {
            datosFiltrados = datosFiltrados.filter(d => d.fecha >= rangoInicio && d.fecha <= rangoFin);
            tituloPeriodo = `Del ${formatearFechaLocal(rangoInicio)} al ${formatearFechaLocal(rangoFin)}`;
        } else {
            datosFiltrados = datosFiltrados.filter(d => d.fecha.startsWith(mesSeleccionado));
            const fechaObj = new Date(anio, mes, 1);
            tituloPeriodo = fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }

        let totalPasteleria = 0, totalCafeteria = 0;
        let desglose = [];
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();

        for (let i = 1; i <= diasEnMes; i++) {
            desglose.push({ label: `${i}`, valorP: 0, valorC: 0 });
        }

        datosFiltrados.forEach(p => {
            const [y, m, d] = p.fecha.split('-').map(Number);
            if (p.origen === 'Pastelería') totalPasteleria += p.total;
            else totalCafeteria += p.total;

            if (y === anio && m === (mes + 1)) {
                if (p.origen === 'Pastelería') desglose[d-1].valorP += p.total;
                else desglose[d-1].valorC += p.total;
            }
        });

        const maxValor = Math.max(...desglose.map(d => d.valorP + d.valorC), 1);

        return {
            totalPasteleria,
            totalCafeteria,
            totalGlobal: totalPasteleria + totalCafeteria,
            desglose,
            maxValor,
            anio,
            mes,
            tituloPeriodo
        };
    }, [todosLosDatosCompletos, mesSeleccionado, rangoInicio, rangoFin]);

    const limpiarRango = () => { setRangoInicio(''); setRangoFin(''); };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reporte Ventas</h2>
                <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200 items-start md:items-end w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Mes Principal</label>
                        <input type="month" value={mesSeleccionado} min="2025-12" onChange={(e) => { setMesSeleccionado(e.target.value); limpiarRango(); }} className="w-full md:w-auto border rounded-lg p-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition" />
                    </div>
                    <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>
                    
                    <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-2 md:w-auto">
                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Desde</label>
                            <input type="date" value={rangoInicio} min="2025-12-01" onChange={(e) => setRangoInicio(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-gray-600" />
                        </div>
                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500 block mb-1">Hasta</label>
                            <input type="date" value={rangoFin} min="2025-12-01" onChange={(e) => setRangoFin(e.target.value)} className="w-full border rounded-lg p-2 text-sm text-gray-600" />
                        </div>
                    </div>

                    {(rangoInicio || rangoFin) && (<button onClick={limpiarRango} className="text-xs text-red-500 font-bold hover:underline mb-3 md:mb-1 self-end flex items-center gap-1"><X size={12} /> Limpiar</button>)}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {modo !== 'cafeteria' && <CardStat titulo="Total Pastelería" valor={`$${datosReporte.totalPasteleria}`} color="bg-pink-100 text-pink-800" />}
                {modo !== 'pasteleria' && <CardStat titulo="Total Cafetería" valor={`$${datosReporte.totalCafeteria}`} color="bg-orange-100 text-orange-800" />}
                {modo === 'admin' && <CardStat titulo="Gran Total" valor={`$${datosReporte.totalGlobal}`} color="bg-green-100 text-green-800" />}
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2 capitalize text-sm md:text-base"><BarChart3 size={20} /> {datosReporte.tituloPeriodo}</h3>
                </div>
                <div className="overflow-x-auto pb-2">
                    <div className="h-64 flex items-end justify-between gap-1 px-2 min-w-[600px] md:min-w-0">
                        {datosReporte.desglose.map((item, i) => {
                            const tieneDatos = item.valorP > 0 || item.valorC > 0;
                            return (
                                <div key={i} className={`flex flex-col items-center justify-end h-full flex-1 group relative ${tieneDatos ? 'cursor-pointer' : ''}`} onClick={() => { if (tieneDatos) { onAbrirModalDia(item.label, datosReporte.mes, datosReporte.anio, todosLosDatosCompletos); } }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg transition-opacity">Día {item.label}: ${item.valorP + item.valorC}</div>
                                    <div className={`w-full max-w-[30px] flex flex-col justify-end h-full rounded-t overflow-hidden ${tieneDatos ? 'bg-gray-50 hover:bg-gray-100' : 'bg-transparent'}`}>
                                        {(modo === 'admin' || modo === 'pasteleria') && <div className="bg-pink-500 w-full transition-all duration-500" style={{ height: `${(item.valorP / datosReporte.maxValor) * 100}%` }}></div>}
                                        {(modo === 'admin' || modo === 'cafeteria') && <div className="bg-orange-500 w-full transition-all duration-500" style={{ height: `${(item.valorC / datosReporte.maxValor) * 100}%` }}></div>}
                                    </div>
                                    <span className="mt-2 text-[10px] text-gray-400 font-medium">{item.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL PARA CREAR/EDITAR USUARIO (CON LÓGICA MINÚSCULAS) ---
const ModalUsuario = ({ isOpen, onClose, onGuardar, usuarioAEditar }) => {
    const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'empleado' });

    useEffect(() => {
        if (usuarioAEditar) {
            setForm(usuarioAEditar);
        } else {
            setForm({ nombre: '', usuario: '', password: '', rol: 'empleado' });
        }
    }, [usuarioAEditar, isOpen]);

    // --- LÓGICA DE SUGERENCIA AUTOMÁTICA ---
    const generarCredenciales = () => {
        // Solo generar si hay nombre y el usuario está vacío (para no sobrescribir si ya escribió)
        if (!form.nombre.trim()) return;

        // Limpiar acentos y espacios
        const limpiarTexto = (texto) => {
            return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
        };

        const partes = form.nombre.trim().split(/\s+/);
        const nombre1 = partes[0] ? limpiarTexto(partes[0]) : "";
        const apellido = partes.length > 1 ? limpiarTexto(partes[1]) : "";

        // 1. Generar Usuario Sugerido: nombre.apellido@lya.com (MINÚSCULAS)
        if (!form.usuario) {
            let usuarioBase = nombre1;
            if (apellido) usuarioBase += `.${apellido}`;
            // AQUÍ FORZAMOS MINÚSCULAS PARA LA SUGERENCIA
            const usuarioSugerido = `${usuarioBase.toLowerCase()}@lya.com`;
            
            setForm(prev => ({ ...prev, usuario: usuarioSugerido }));
        }

        // 2. Generar Contraseña Sugerida (Random 4 dígitos)
        if (!form.password) {
            const random = Math.floor(1000 + Math.random() * 9000);
            const passSugerida = `LyA.${random}`;
            setForm(prev => ({ ...prev, password: passSugerida }));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Asegurar que el usuario tenga el dominio correcto y esté limpio
        let usuarioFinal = form.usuario.trim();
        if (!usuarioFinal.endsWith('@lya.com')) {
            if (!usuarioFinal.includes('@')) {
                usuarioFinal += '@lya.com';
            }
        }

        onGuardar({ ...form, usuario: usuarioFinal });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[250] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border-t-8 border-gray-900">
                <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        {usuarioAEditar ? <Edit size={20} className="text-pink-600"/> : <UserPlus size={20} className="text-pink-600"/>} 
                        {usuarioAEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* NOMBRE COMPLETO CON AUTO-UPPERCASE Y SUGERENCIAS */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre y Primer Apellido</label>
                        <input 
                            required 
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors uppercase font-bold text-gray-700"
                            value={form.nombre} 
                            onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})} 
                            onBlur={generarCredenciales} 
                            placeholder="EJ. JUAN PÉREZ" 
                        />
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Sparkles size={10} className="text-yellow-500"/> Se generarán credenciales automáticamente
                        </p>
                    </div>

                    {/* USUARIO Y CONTRASEÑA */}
                    <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Usuario (Login)</label>
                            <input 
                                required 
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm font-mono text-gray-600 focus:border-pink-500 focus:outline-none" 
                                value={form.usuario} 
                                onChange={e => setForm({...form, usuario: e.target.value})} 
                                placeholder="juan.perez@lya.com" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contraseña</label>
                            <input 
                                required 
                                type="text" 
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm font-mono text-gray-600 focus:border-pink-500 focus:outline-none" 
                                value={form.password} 
                                onChange={e => setForm({...form, password: e.target.value})} 
                                placeholder="Generada..." 
                            />
                        </div>
                    </div>

                    {/* ROL */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Asignar Rol</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setForm({...form, rol: 'admin'})} className={`p-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${form.rol === 'admin' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                <Shield size={20}/> Admin
                            </button>
                            <button type="button" onClick={() => setForm({...form, rol: 'empleado'})} className={`p-3 rounded-xl border-2 text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${form.rol === 'empleado' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                <Briefcase size={20}/> Empleado
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex justify-center items-center gap-2">
                        <Check size={20}/> {usuarioAEditar ? 'Guardar Cambios' : 'Crear Usuario'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- VISTA GESTIÓN USUARIOS ---
export const VistaGestionUsuarios = ({ usuarios, onGuardar, onEliminar }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState(null);
    const [usuarioEliminar, setUsuarioEliminar] = useState(null);

    // Separar usuarios por rol
    const administradores = usuarios.filter(u => u.rol === 'admin');
    const empleados = usuarios.filter(u => u.rol === 'empleado');

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="text-pink-600" /> Gestión de Usuarios
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Administra quién tiene acceso al sistema.</p>
                </div>
                <button onClick={() => { setUsuarioEditar(null); setModalOpen(true); }} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition transform active:scale-95 w-full sm:w-auto justify-center">
                    <UserPlus size={20}/> Nuevo Usuario
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* COLUMNA ADMINISTRADORES */}
                <div className="bg-pink-50/50 rounded-3xl p-6 border border-pink-100 h-fit">
                    <h3 className="font-bold text-xl text-pink-800 mb-4 flex items-center gap-2">
                        <Shield size={24}/> Administradores
                        <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">{administradores.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {administradores.map(user => (
                            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex justify-between items-center group hover:shadow-md transition relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-400"></div>
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg border border-pink-200 shadow-sm">
                                        {user.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{user.nombre}</p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-1 rounded w-fit">{user.usuario}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setUsuarioEditar(user); setModalOpen(true); }} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition"><Edit size={18}/></button>
                                    <button onClick={() => setUsuarioEliminar(user)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {administradores.length === 0 && (
                            <div className="text-center py-8 opacity-50">
                                <Shield size={40} className="mx-auto mb-2 text-gray-300"/>
                                <p className="text-gray-400 italic text-sm">No hay administradores.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA EMPLEADOS */}
                <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 h-fit">
                    <h3 className="font-bold text-xl text-orange-800 mb-4 flex items-center gap-2">
                        <Briefcase size={24}/> Empleados
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">{empleados.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {empleados.map(user => (
                            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center group hover:shadow-md transition relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg border border-orange-200 shadow-sm">
                                        {user.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{user.nombre}</p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-1 rounded w-fit">{user.usuario}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setUsuarioEditar(user); setModalOpen(true); }} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition"><Edit size={18}/></button>
                                    <button onClick={() => setUsuarioEliminar(user)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {empleados.length === 0 && (
                            <div className="text-center py-8 opacity-50">
                                <Briefcase size={40} className="mx-auto mb-2 text-gray-300"/>
                                <p className="text-gray-400 italic text-sm">No hay empleados registrados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ModalUsuario 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onGuardar={onGuardar} 
                usuarioAEditar={usuarioEditar}
            />

            <ModalConfirmacion 
                isOpen={!!usuarioEliminar}
                onClose={() => setUsuarioEliminar(null)}
                onConfirm={() => { onEliminar(usuarioEliminar.id); setUsuarioEliminar(null); }}
                titulo="¿Eliminar Usuario?"
                mensaje={`Se eliminará permanentemente la cuenta de "${usuarioEliminar?.nombre}".`}
            />
        </div>
    );
};