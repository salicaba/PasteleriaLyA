import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
    Smartphone, ShoppingBag, Loader, Coffee, AlertCircle, Info, WifiOff, 
    RefreshCw, MapPinOff, HelpCircle, ArrowRight, Clock, Lock 
} from 'lucide-react';

import { PRODUCTOS_CAFETERIA_INIT, SESIONES_LLEVAR_INIT, VENTAS_CAFETERIA_INIT, getFechaHoy, formatearFechaLocal } from './utils/config';
import { obtenerRutaInicial, formatearRol } from './utils/roles';

import { Notificacion, LayoutConSidebar, ModalDetalles, ModalVentasDia, ModalConfirmacion, ModalAgendaDia } from './components/Shared';
import { VistaInicioPasteleria, VistaNuevoPedido, VistaCalendarioPasteleria } from './features/Pasteleria';
import { VistaInicioCafeteria, VistaMenuCafeteria, VistaGestionMesas, VistaDetalleCuenta, VistaHubMesa, VistaCocina } from './features/Cafeteria';

// --- 1. IMPORTAMOS VistaBaseDatos AQUÍ ---
import { VistaInicioAdmin, VistaReporteUniversal, VistaGestionUsuarios, VistaBaseDatos } from './features/Admin';

import { VistaCliente } from './features/Cliente';
import { VistaLogin } from './components/Login';

// --- IMPORTACIONES DE SERVICIOS ---
import { saveProduct, deleteProduct, subscribeToProducts, updateProductStock } from './services/products.service';
import { createMesa, updateMesa, removeMesa, subscribeToMesas } from './services/mesas.service';
import { subscribeToOrders, saveOrder, updateOrderStatus, deleteOrder, emptyOrdersTrash } from './services/orders.service';
import { subscribeToSales, createSale, deleteSale } from './services/sales.service';
import { subscribeToUsers, saveUser, deleteUser } from './services/users.service';
import { subscribeToSessions, createSession, updateSession, deleteSession, saveSession } from './services/sessions.service';
import { suscribirEstadoServicio } from './services/config.service';

// --- COMPONENTE: TEXTO CARGANDO ANIMADO (SIN CAMBIOS) ---
const TextoCargandoAnimado = () => {
    const [puntos, setPuntos] = useState('');
    useEffect(() => {
        const intervalo = setInterval(() => {
            setPuntos(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500); 
        return () => clearInterval(intervalo);
    }, []);
    return (
        <div className="flex items-center justify-center gap-0.5" style={{ transform: 'translateX(6px)' }}>
            <span>Cargando</span>
            <span className="w-4 text-left">{puntos}</span> 
        </div>
    );
};

// --- COMPONENTE RUTA CLIENTE MEJORADO ---
const RutaCliente = ({ mesas, sesionesLlevar, productos, onRealizarPedido, onSalir, loading, servicioActivo }) => { 
    const { id } = useParams(); 
    const location = useLocation();
    const esLlevar = id === 'llevar' || location.pathname === '/llevar';
    
    const [tiempoExcedido, setTiempoExcedido] = useState(false);
    const [online, setOnline] = useState(navigator.onLine);
    const [reintentando, setReintentando] = useState(false);

    // 1. Obtenemos el nombre guardado en el celular
    const nombreClienteLocal = localStorage.getItem('lya_cliente_nombre');

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        let timer;
        // Solo iniciamos el timer si NO estamos reintentando manual
        if ((loading || !online) && !tiempoExcedido && !reintentando) {
            timer = setTimeout(() => {
                setTiempoExcedido(true);
            }, 10000); 
        }
        return () => clearTimeout(timer);
    }, [loading, online, tiempoExcedido, reintentando]);
    
    const mesaObj = useMemo(() => {
        if (loading || !online) return null; 
        
        if (esLlevar) {
            const cuentasAdaptadas = sesionesLlevar.map(s => ({
                id: s.id,
                cliente: s.nombreCliente,
                cuenta: s.cuenta,
                total: s.total,
                estado: s.estado || 'Activa'
            }));
            return { id: 'QR_LLEVAR', nombre: 'Para Llevar (Mostrador)', cuentas: cuentasAdaptadas };
        }
        return mesas.find(m => m.id.toLowerCase() === id.toLowerCase());
    }, [id, mesas, sesionesLlevar, esLlevar, loading, online]);

    const tienePedidoActivo = useMemo(() => {
        if (!mesaObj || !nombreClienteLocal) return false;
        const cuentaEncontrada = mesaObj.cuentas.find(c => c.cliente === nombreClienteLocal);
        return !!cuentaEncontrada && cuentaEncontrada.estado !== 'Cancelado';
    }, [mesaObj, nombreClienteLocal]);

    // --- CAMBIO CLAVE: Lógica segura para reintentar ---
    const handleReintentar = () => {
        setReintentando(true); // 1. Muestra "Reconectando..." inmediatamente
        setTiempoExcedido(false);
        
        // 2. Esperamos 2 segundos para que el cliente vea la animación de carga
        setTimeout(() => {
            if (navigator.onLine) {
                // 3. CAMBIO: En lugar de reload(), solo actualizamos el estado.
                // Esto hace que vuelvas a la pantalla donde estabas suavemente.
                setOnline(true);
                setReintentando(false);
            } else {
                // 4. Si sigue sin internet, quitamos el loading para que vea el error de nuevo
                setReintentando(false);
                setOnline(false); 
            }
        }, 2000);
    };

    // --- PANTALLA DE CARGA ---
    // Modificado: Ahora se muestra si 'reintentando' es true, aunque no haya 'online'
    if ((loading || reintentando) && !tiempoExcedido) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 p-4 animate-fade-in">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-orange-100">
                        <Coffee size={40} className="text-orange-600 animate-bounce-slow" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif tracking-wide">
                    {reintentando ? "Reconectando..." : "Conectando..."}
                </h2>
                <p className="text-gray-500 text-sm bg-white px-4 py-1 rounded-full shadow-sm border border-orange-100 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${reintentando ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    {reintentando ? "Verificando red..." : "Obteniendo menú actualizado"}
                </p>
            </div>
        );
    }

    // --- PANTALLA DE ERROR / AYUDA ---
    if (!mesaObj || tiempoExcedido || !online) {
        let tipoError = 'desconocido';
        if (!online) tipoError = 'offline';
        else if (tiempoExcedido) tipoError = 'timeout';
        else if (!mesaObj) tipoError = 'not_found';

        const configError = {
            offline: {
                titulo: "¡Ups! Sin Internet",
                mensaje: "Parece que perdiste la conexión. Revisa tu WiFi o datos móviles para ver el menú.",
                icono: WifiOff,
                color: "text-red-500",
                bgIcon: "bg-red-50"
            },
            timeout: {
                titulo: "Conexión Inestable",
                mensaje: "El servidor tarda en responder. Esto suele pasar cuando la señal es débil.",
                icono: Clock,
                color: "text-orange-500",
                bgIcon: "bg-orange-50"
            },
            not_found: {
                titulo: "Código no válido",
                mensaje: "No encontramos información de esta mesa. Es posible que el código QR haya cambiado.",
                icono: MapPinOff,
                color: "text-gray-500",
                bgIcon: "bg-gray-100"
            }
        };

        const { titulo, mensaje, icono: Icono, color, bgIcon } = configError[tipoError] || configError.timeout;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in-up">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8 text-center">
                        <div className={`w-20 h-20 ${bgIcon} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
                            <Icono size={40} className={color} />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">{titulo}</h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2">
                            {mensaje}
                        </p>

                        <button 
                            onClick={handleReintentar} 
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} /> Intentar de nuevo
                        </button>
                    </div>

                    <div className="bg-orange-50/50 p-6 border-t border-orange-100">
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                                <HelpCircle size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-800 text-sm mb-1">¿Sigues con problemas?</h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    No te preocupes. 
                                    {esLlevar ? (
                                        <span> Por favor, acércate a <strong>Caja</strong> o al <strong>Mostrador</strong>.</span>
                                    ) : (
                                        <span> Por favor, llama a un <strong>mesero</strong>. Con gusto tomará tu orden.</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-gray-400 text-xs font-medium flex items-center gap-1">
                    <Info size={12}/> Sistema LyA v1.0
                </div>
            </div>
        );
    }

    return (
        <VistaCliente 
            mesa={mesaObj} 
            productos={productos} 
            onRealizarPedido={onRealizarPedido} 
            onSalir={onSalir} 
            servicioActivo={servicioActivo}       
            tienePedidoActivo={tienePedidoActivo} 
        />
    );
};

export default function PasteleriaApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('lya_session_active') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('lya_user_role') || 'admin');
  const [vistaActual, setVistaActual] = useState('inicio');

  const modo = useMemo(() => {
      const path = location.pathname;
      if (path.includes('/pasteleria')) return 'pasteleria';
      if (path.includes('/cafeteria')) return 'cafeteria';
      return 'admin';
  }, [location]);

  useEffect(() => {
      setVistaActual('inicio');
  }, [modo]);

  // ESTADOS DE DATOS
  const [productosCafeteria, setProductosCafeteria] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [pedidosPasteleria, setPedidosPasteleria] = useState([]); 
  const [ventasCafeteria, setVentasCafeteria] = useState([]); 
  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [sesionesLlevar, setSesionesLlevar] = useState([]); 
  
  const [servicioActivo, setServicioActivo] = useState(true);
  const [firebaseCargando, setFirebaseCargando] = useState(true);
  const [tiempoMinimoCarga, setTiempoMinimoCarga] = useState(true);
  const cargandoDatos = firebaseCargando || tiempoMinimoCarga;

  // ESTADOS UI
  const [cancelados, setCancelados] = useState(() => {
      try {
          const guardados = localStorage.getItem('lya_cafeteria_papelera');
          return guardados ? JSON.parse(guardados) : [];
      } catch (e) {
          return [];
      }
  }); 

  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null); 
  const [cuentaActiva, setCuentaActiva] = useState(null); 
  const [fechaAgendaSeleccionada, setFechaAgendaSeleccionada] = useState(null);
  const [fechaParaNuevoPedido, setFechaParaNuevoPedido] = useState(null);
  
  const mesaSeleccionadaObj = useMemo(() => mesas.find(m => m.id === mesaSeleccionadaId), [mesas, mesaSeleccionadaId]);

  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [pedidoVerDetalles, setPedidoVerDetalles] = useState(null);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
  const [datosModalDia, setDatosModalDia] = useState(null);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [pedidoARestaurar, setPedidoARestaurar] = useState(null);
  const [pedidoAEntregar, setPedidoAEntregar] = useState(null);
  
  const ID_QR_LLEVAR = 'QR_LLEVAR';

  useEffect(() => {
    const timer = setTimeout(() => setTiempoMinimoCarga(false), 2500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
      localStorage.setItem('lya_cafeteria_papelera', JSON.stringify(cancelados));
  }, [cancelados]);

  // Limpieza automática (Pastelería)
  useEffect(() => {
    if (pedidosPasteleria.length > 0) {
        const fechaHoy = getFechaHoy();
        const basuraVieja = pedidosPasteleria.filter(p => {
            if (p.estado !== 'Cancelado') return false;
            let fechaRef = p.fecha;
            if (p.fechaCancelacion) {
                const fechaObj = new Date(p.fechaCancelacion);
                const local = new Date(fechaObj.getTime() - (fechaObj.getTimezoneOffset() * 60000));
                fechaRef = local.toISOString().split('T')[0];
            }
            return fechaRef < fechaHoy;
        });

        if (basuraVieja.length > 0) {
            emptyOrdersTrash(basuraVieja).catch(console.error);
        }
    }
  }, [pedidosPasteleria]);

  // Limpieza automática papelera local (CORREGIDO)
  useEffect(() => {
    const limpiarPapelera = () => {
        const hoy = new Date();
        
        setCancelados(prev => {
            const filtrados = prev.filter(item => {
                if (!item.timestamp) return false; // Si no tiene fecha, lo borra por seguridad
                const fechaItem = new Date(item.timestamp);
                
                // Compara Día, Mes y Año numéricamente (es más seguro que usar texto)
                return fechaItem.getDate() === hoy.getDate() &&
                       fechaItem.getMonth() === hoy.getMonth() &&
                       fechaItem.getFullYear() === hoy.getFullYear();
            });

            // Solo actualizamos si realmente borramos algo para evitar renders innecesarios
            if (filtrados.length !== prev.length) {
                return filtrados;
            }
            return prev;
        });
    };

    // 1. Ejecutar INMEDIATAMENTE al cargar la página
    limpiarPapelera();

    // 2. Seguir revisando cada minuto (por si el cambio de día ocurre mientras la app está abierta)
    const intervalo = setInterval(limpiarPapelera, 60000); 
    return () => clearInterval(intervalo);
  }, []);

  const vaciarPapelera = () => { setCancelados([]); mostrarNotificacion("Papelera vaciada correctamente", "info"); };
  const eliminarDePapelera = (id) => { setCancelados(prev => prev.filter(c => c.id !== id)); mostrarNotificacion("Eliminado definitivamente", "info"); };

  // --- SUSCRIPCIONES ---
  useEffect(() => {
      const unsubProductos = subscribeToProducts(setProductosCafeteria);
      const unsubMesas = subscribeToMesas((data) => { setMesas(data); setFirebaseCargando(false); });
      const unsubPedidos = subscribeToOrders(setPedidosPasteleria);
      const unsubVentas = subscribeToSales(setVentasCafeteria);
      const unsubUsuarios = subscribeToUsers(setUsuariosSistema);
      
      const unsubLlevar = subscribeToSessions((data) => {
          setSesionesLlevar(data);
          setCuentaActiva(prev => {
              if (prev && prev.tipo === 'llevar') {
                  const actualizada = data.find(s => s.id === prev.id);
                  return actualizada ? { ...actualizada } : null; 
              }
              return prev;
          });
      });

      const unsubServicio = suscribirEstadoServicio(setServicioActivo);

      return () => {
          unsubProductos(); unsubMesas(); unsubPedidos();
          unsubVentas(); unsubUsuarios(); unsubLlevar();
          unsubServicio();
      };
  }, []);

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { 
    setNotificacion({ visible: true, mensaje, tipo }); 
    setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); 
  };

  // --- FUNCIÓN LOGIN ---
  const handleLogin = (usuario) => {
      localStorage.setItem('lya_session_active', 'true'); 
      setIsAuthenticated(true);
      
      const rol = usuario.rol ? usuario.rol.toLowerCase() : 'admin';
      localStorage.setItem('lya_user_role', rol);
      setUserRole(rol);

      const rutaDestino = obtenerRutaInicial(rol);
      navigate(rutaDestino);

      const nombreMostrar = usuario.nombre || "ADMINISTRADOR";
      const rolMostrar = formatearRol(rol);
      mostrarNotificacion(`Bienvenido ${nombreMostrar} (${rolMostrar})`, "exito");
  };

  const handleLogout = () => {
      localStorage.removeItem('lya_session_active'); 
      localStorage.removeItem('lya_user_role'); 
      
      setIsAuthenticated(false);
      setUserRole('admin'); 
      navigate('/login');
      mostrarNotificacion("Sesión cerrada", "info");
  };

  const cambiarModoDesdeSidebar = (nuevoModo) => { navigate(`/${nuevoModo}`); setVistaActual('inicio'); };

  // --- FUNCIONES CRUD ---
  const guardarUsuario = async (usuario) => { try { const res = await saveUser(usuario, usuariosSistema); mostrarNotificacion(res.message, "exito"); } catch (e) { mostrarNotificacion("Error: " + e.message, "error"); } };
  const eliminarUsuario = async (id) => { try { await deleteUser(id); mostrarNotificacion("Usuario eliminado", "info"); } catch (e) { mostrarNotificacion("Error al eliminar", "error"); } };
  const guardarProductoCafeteria = async (prod, notificar = true) => { try { const res = await saveProduct(prod); if (notificar) mostrarNotificacion(res.message, "exito"); } catch (e) { mostrarNotificacion("Error: " + e.message, "error"); } };
  const eliminarProductoCafeteria = async (id) => { try { await deleteProduct(id); mostrarNotificacion("Producto eliminado", "info"); } catch (e) { mostrarNotificacion("Error", "error"); } };
  
  const agregarMesa = async () => { try { const numerosOcupados = mesas.map(m => { const soloNumeros = m.id.replace(/\D/g, ''); return parseInt(soloNumeros) || 0; }); let numeroTarget = 1; while (numerosOcupados.includes(numeroTarget)) { numeroTarget++; } await createMesa(numeroTarget - 1); mostrarNotificacion("Mesa agregada", "exito"); } catch (e) { mostrarNotificacion("Error", "error"); } };
  const eliminarMesa = async (id) => { try { await removeMesa(id); mostrarNotificacion("Mesa eliminada", "info"); } catch(e) { mostrarNotificacion("Error", "error"); } };
  const actualizarMesaEnBD = async (mesaObj) => { try { await updateMesa(mesaObj.id, { cuentas: mesaObj.cuentas }); } catch (e) { console.error("Error mesa:", e); } };

  const crearCuentaEnMesa = (idMesa, nombreCliente, itemsIniciales = []) => { const mesa = mesas.find(m => m.id === idMesa); if (!mesa) return; const totalInicial = itemsIniciales.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const nuevaCuenta = { id: `C-${Date.now().toString().slice(-4)}`, cliente: nombreCliente, cuenta: itemsIniciales, total: totalInicial, timestamp: Date.now() }; const mesaActualizada = { ...mesa, cuentas: [...mesa.cuentas, nuevaCuenta] }; actualizarMesaEnBD(mesaActualizada); return nuevaCuenta; };
  
  const recibirPedidoCliente = async (idMesa, nombre, carrito, telefono = '') => { 
    await updateProductStock(carrito);
    const carritoMarcado = carrito.map(item => ({ ...item, origen: 'cliente' }));
    if (idMesa === ID_QR_LLEVAR) {
        const sesionExistente = sesionesLlevar.find(s => s.nombreCliente === nombre);
        if (sesionExistente) {
            const nuevosItems = [...sesionExistente.cuenta, ...carritoMarcado];
            const nuevoTotal = nuevosItems.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
            await updateSession(sesionExistente.id, { cuenta: nuevosItems, total: nuevoTotal });
            mostrarNotificacion(`Pedido actualizado: ${nombre}`, "info");
        } else {
            const totalInicial = carritoMarcado.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
            const nuevaId = `L-${Date.now().toString().slice(-4)}`;
            await saveSession({ id: nuevaId, tipo: 'llevar', nombreCliente: nombre, telefono, cuenta: carritoMarcado, total: totalInicial, estado: 'Activa' });
            mostrarNotificacion(`Pedido recibido: ${nombre}`, "exito");
        }
    } else {
        const mesa = mesas.find(m => m.id === idMesa);
        if(!mesa) return;
        const cuentaExistente = mesa.cuentas.find(c => c.cliente === nombre);
        if (cuentaExistente) { 
            const cuentasActualizadas = mesa.cuentas.map(c => {
                if(c.id === cuentaExistente.id) {
                    const nuevosItems = [...c.cuenta, ...carritoMarcado]; 
                    return { ...c, cuenta: nuevosItems, total: nuevosItems.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0) };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasActualizadas });
            mostrarNotificacion(`Pedido agregado: ${nombre}`, "info"); 
        } else { 
            crearCuentaEnMesa(idMesa, nombre, carritoMarcado); 
            mostrarNotificacion(`Nuevo cliente en Mesa: ${nombre}`, "exito"); 
        }
    }
  };

  const agregarProductoASesion = async (idSesion, producto, cantidad = 1) => { 
    const itemNuevo = { ...producto, cantidad: cantidad, origen: 'personal', confirmado: false };
    let cantidadTotalProducto = cantidad;
    if (cuentaActiva.tipo === 'mesa') { 
        const mesa = mesas.find(m => m.id === cuentaActiva.idMesa);
        if(mesa) {
            const cuentasNuevas = mesa.cuentas.map(c => {
                if(c.id === cuentaActiva.id) {
                    let items = [...c.cuenta];
                    const itemIndex = items.findIndex(i => i.id === producto.id && i.origen === 'personal');
                    if (itemIndex > -1) { const nuevaCant = (items[itemIndex].cantidad || 1) + cantidad; items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant }; cantidadTotalProducto = nuevaCant; }
                    else items.push(itemNuevo);
                    const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                    setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                    return { ...c, cuenta: items, total };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasNuevas });
        }
    } else { 
        const sesion = sesionesLlevar.find(s => s.id === idSesion);
        if (sesion) {
            let items = [...sesion.cuenta];
            const itemIndex = items.findIndex(i => i.id === producto.id && i.origen === 'personal');
            if (itemIndex > -1) { const nuevaCant = (items[itemIndex].cantidad || 1) + cantidad; items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant }; cantidadTotalProducto = nuevaCant; }
            else items.push(itemNuevo);
            const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
            await updateSession(sesion.id, { cuenta: items, total });
        }
    } 
    const sufijo = cantidadTotalProducto > 1 ? ` (x${cantidadTotalProducto})` : '';
    mostrarNotificacion(`Agregado: ${producto.nombre}${sufijo}`, "exito");
  };

  const confirmarOrdenCocina = async (idSesion) => {
    const timestamp = Date.now();
    
    // Función auxiliar para procesar los ítems
    // Si el ítem YA estaba confirmado, mantenemos su fecha original.
    // Si NO estaba confirmado (es nuevo), le ponemos la fecha de AHORA.
    const procesarItems = (items) => {
        return items.map(i => ({
            ...i,
            confirmado: true,
            timestampEntrega: i.confirmado ? (i.timestampEntrega || timestamp) : timestamp
        }));
    };

    if (cuentaActiva.tipo === 'mesa') {
        const mesa = mesas.find(m => m.id === cuentaActiva.idMesa);
        if (mesa) {
            const cuentasNuevas = mesa.cuentas.map(c => {
                if (c.id === idSesion) {
                    const itemsConfirmados = procesarItems(c.cuenta);
                    // Actualizamos timestampCocina para avisar a la pantalla que hubo cambios
                    return { ...c, cuenta: itemsConfirmados, total: c.total, timestampCocina: timestamp };
                }
                return c;
            });
            await actualizarMesaEnBD({ ...mesa, cuentas: cuentasNuevas });
            
            if (cuentaActiva.id === idSesion) {
                setCuentaActiva(prev => ({ 
                    ...prev, 
                    cuenta: procesarItems(prev.cuenta),
                    timestampCocina: timestamp
                }));
            }
        }
    } else {
        const sesion = sesionesLlevar.find(s => s.id === idSesion);
        if (sesion) {
            const itemsConfirmados = procesarItems(sesion.cuenta);
            await updateSession(sesion.id, { 
                cuenta: itemsConfirmados, 
                total: sesion.total,
                timestampCocina: timestamp 
            });
            if (cuentaActiva.id === idSesion) {
                setCuentaActiva(prev => ({ ...prev, cuenta: itemsConfirmados, timestampCocina: timestamp }));
            }
        }
    }
    mostrarNotificacion("Pedido enviado a cocina", "exito");
};

  const actualizarProductoEnSesion = async (idSesion, idProducto, delta, origenObjetivo) => {
    if (cuentaActiva.tipo === 'mesa') {
        const mesa = mesas.find(m => m.id === cuentaActiva.idMesa);
        if(mesa) {
            const cuentasNuevas = mesa.cuentas.map(c => {
                if(c.id === cuentaActiva.id) {
                    let items = [...c.cuenta];
                    const itemIndex = items.findIndex(i => i.id === idProducto && i.origen === origenObjetivo);
                    if(itemIndex > -1) { const nuevaCant = (items[itemIndex].cantidad || 1) + delta; if(nuevaCant <= 0) items.splice(itemIndex, 1); else items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant }; }
                    const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                    setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                    return { ...c, cuenta: items, total };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasNuevas });
        }
    } else {
        const sesion = sesionesLlevar.find(s => s.id === idSesion);
        if (sesion) {
            let items = [...sesion.cuenta];
            const itemIndex = items.findIndex(i => i.id === idProducto && i.origen === origenObjetivo);
            if(itemIndex > -1) { const nuevaCant = (items[itemIndex].cantidad || 1) + delta; if(nuevaCant <= 0) items.splice(itemIndex, 1); else items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant }; }
            const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
            await updateSession(sesion.id, { cuenta: items, total });
        }
    }
  };

  const pagarCuenta = async (sesion) => { 
    const total = sesion.cuenta.reduce((acc, p) => acc + (p.precio * (p.cantidad || 1)), 0); 
    const nuevaVenta = { folioLocal: `T-${Date.now().toString().slice(-6)}`, fecha: getFechaHoy(), hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), total, items: sesion.cuenta.length, cliente: sesion.tipo === 'mesa' ? `${sesion.nombreMesa} - ${sesion.cliente}` : `${sesion.nombreCliente} (Llevar)`, origen: 'Cafetería', origenMesaId: sesion.tipo === 'mesa' ? sesion.idMesa : null, nombreMesa: sesion.tipo === 'mesa' ? sesion.nombreMesa : null, nombreCliente: sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente, cuentaOriginal: sesion.cuenta, telefono: sesion.telefono || '', tipo: sesion.tipo }; 
    try { await createSale(nuevaVenta); if (sesion.tipo === 'mesa') { const mesa = mesas.find(m => m.id === sesion.idMesa); if(mesa) { const cuentasRestantes = mesa.cuentas.filter(c => c.id !== sesion.id); await actualizarMesaEnBD({ ...mesa, cuentas: cuentasRestantes }); } } else { await deleteSession(sesion.id); } setCuentaActiva(null); mostrarNotificacion("Cuenta pagada y guardada.", "exito"); } catch (e) { mostrarNotificacion("Error: " + e.message, "error"); }
  };

  const cancelarCuentaSinPagar = async (sesion) => {
      const canceladoItem = { ...sesion, timestamp: Date.now(), origenMesaId: sesion.tipo === 'llevar' ? null : sesion.idMesa, nombreMesa: sesion.nombreMesa || null, cuentaOriginal: sesion.cuenta, nombreCliente: sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente };
      setCancelados([...cancelados, canceladoItem]);
      try { if (sesion.tipo === 'mesa') { const mesa = mesas.find(m => m.id === sesion.idMesa); if (mesa) { const cuentasMarcadas = mesa.cuentas.map(c => c.id === sesion.id ? { ...c, estado: 'Cancelado' } : c); await updateMesa(mesa.id, { cuentas: cuentasMarcadas }); await new Promise(r => setTimeout(r, 1500)); const cuentasRestantes = mesa.cuentas.filter(c => c.id !== sesion.id); await actualizarMesaEnBD({ ...mesa, cuentas: cuentasRestantes }); } } else { await updateSession(sesion.id, { estado: 'Cancelado' }); await new Promise(r => setTimeout(r, 1500)); await deleteSession(sesion.id); } mostrarNotificacion("Pedido enviado a Papelera", "info"); } catch (e) { console.error(e); mostrarNotificacion("Error al cancelar", "error"); }
      setCuentaActiva(null);
  };

  const restaurarDeHistorial = async (item) => {
      const cuentaRestaurada = { id: `R-${Date.now().toString().slice(-4)}`, cliente: item.nombreCliente || item.cliente || 'Cliente', nombreCliente: item.nombreCliente || item.cliente || 'Cliente', cuenta: item.cuentaOriginal || item.cuenta || [], total: item.total || 0, telefono: item.telefono || '', tipo: item.origenMesaId ? 'mesa' : 'llevar', idMesa: item.origenMesaId || null, nombreMesa: item.nombreMesa || null, estado: 'Activa' };
      if (item.origenMesaId) { const existeMesa = mesas.find(m => m.id === item.origenMesaId); if (!existeMesa) { alert("La mesa original ya no existe. Se restaurará como 'Para Llevar'."); const nuevaId = `L-R-${Date.now()}`; await saveSession({ ...cuentaRestaurada, tipo: 'llevar', id: nuevaId }); } else { const cuentasActualizadas = [...existeMesa.cuentas, cuentaRestaurada]; actualizarMesaEnBD({ ...existeMesa, cuentas: cuentasActualizadas }); } } else { const nuevaId = `L-R-${Date.now()}`; await saveSession({ ...cuentaRestaurada, tipo: 'llevar', id: nuevaId }); }
      const ventaEnBD = ventasCafeteria.find(v => v.id === item.id); if (ventaEnBD) { try { await deleteSale(item.id); mostrarNotificacion("Venta anulada y restaurada", "exito"); } catch (e) { mostrarNotificacion("Error", "error"); } } else { setCancelados(prev => prev.filter(c => c.id !== item.id)); mostrarNotificacion("Recuperado de papelera", "exito"); }
  };

  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  
  const guardarPedido = async (datos) => { try { const res = await saveOrder(datos); mostrarNotificacion(res.message, "exito"); setVistaActual('inicio'); setPedidoAEditar(null); setFechaParaNuevoPedido(null); } catch (error) { mostrarNotificacion("Error al guardar", "error"); } };
  
  const registrarPago = async (folio, esLiquidacion) => { const pedido = pedidosPasteleria.find(p => p.folio === folio); if (!pedido) return; const nuevosPagos = esLiquidacion ? parseInt(pedido.numPagos) : (parseInt(pedido.pagosRealizados || 0) + 1); try { await updateOrderStatus(pedido.id, { pagosRealizados: nuevosPagos, horaPago: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }); if (pedidoVerDetalles && pedidoVerDetalles.folio === folio) setPedidoVerDetalles({ ...pedidoVerDetalles, pagosRealizados: nuevosPagos }); mostrarNotificacion("Pago registrado", "exito"); } catch (e) { mostrarNotificacion("Error al registrar", "error"); } };
  
  const abrirHubMesa = (idMesa) => setMesaSeleccionadaId(idMesa);
  
  const unirCuentas = (idMesa, idCuentaDestino, idsCuentasOrigen) => { const mesa = mesas.find(m => m.id === idMesa); if(!mesa) return; const destino = mesa.cuentas.find(c => c.id === idCuentaDestino); const origenes = mesa.cuentas.filter(c => idsCuentasOrigen.includes(c.id)); let nuevosItems = [...destino.cuenta]; const historialNuevo = origenes.map(o => ({ idOriginal: o.id, clienteOriginal: o.cliente, items: o.cuenta })); origenes.forEach(o => { const itemsMarcados = o.cuenta.map(item => ({ ...item, _origenFusionId: o.id })); nuevosItems = [...nuevosItems, ...itemsMarcados]; }); const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const historialCompleto = [...(destino.historicoFusion || []), ...historialNuevo]; const cuentasActualizadas = mesa.cuentas.filter(c => !idsCuentasOrigen.includes(c.id)).map(c => c.id === idCuentaDestino ? { ...c, cuenta: nuevosItems, total: nuevoTotal, historicoFusion: historialCompleto, fueFusionada: true } : c); actualizarMesaEnBD({ ...mesa, cuentas: cuentasActualizadas }); mostrarNotificacion("Cuentas unificadas"); };

  const desunirCuentas = async (idMesa, idCuentaMadre, idsOriginalesADesunir) => { const mesa = mesas.find(m => m.id === idMesa); if (!mesa) return; const cuentaMadre = mesa.cuentas.find(c => c.id === idCuentaMadre); if (!cuentaMadre || !cuentaMadre.historicoFusion) return; let itemsMadre = [...cuentaMadre.cuenta]; const cuentasRestauradas = []; let nuevoHistorico = [...cuentaMadre.historicoFusion]; idsOriginalesADesunir.forEach(idARestaurar => { const infoOriginal = cuentaMadre.historicoFusion.find(h => h.idOriginal === idARestaurar); if (infoOriginal) { const itemsDeEstaCuenta = itemsMadre.filter(item => item._origenFusionId === idARestaurar); if (itemsDeEstaCuenta.length > 0) { const totalRestaurado = itemsDeEstaCuenta.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const itemsLimpios = itemsDeEstaCuenta.map(i => { const { _origenFusionId, ...resto } = i; return resto; }); cuentasRestauradas.push({ id: infoOriginal.idOriginal, cliente: infoOriginal.clienteOriginal, cuenta: itemsLimpios, total: totalRestaurado }); itemsMadre = itemsMadre.filter(item => item._origenFusionId !== idARestaurar); nuevoHistorico = nuevoHistorico.filter(h => h.idOriginal !== idARestaurar); } } }); const totalMadre = itemsMadre.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const cuentaMadreActualizada = { ...cuentaMadre, cuenta: itemsMadre, total: totalMadre, historicoFusion: nuevoHistorico.length > 0 ? nuevoHistorico : null, fueFusionada: nuevoHistorico.length > 0 }; const nuevasCuentasMesa = mesa.cuentas.map(c => c.id === idCuentaMadre ? cuentaMadreActualizada : c); cuentasRestauradas.forEach(c => nuevasCuentasMesa.push(c)); await actualizarMesaEnBD({ ...mesa, cuentas: nuevasCuentasMesa }); if (cuentaActiva && cuentaActiva.id === idCuentaMadre) setCuentaActiva({ ...cuentaActiva, ...cuentaMadreActualizada }); mostrarNotificacion("Cuentas separadas", "exito"); };

  const dividirCuentaManual = async (idSesionOriginal, nombreNuevoCliente, itemsIndicesAMover) => { let mesaObj = mesas.find(m => m.id === cuentaActiva.idMesa); if (!mesaObj) return; let sesionOriginal = mesaObj.cuentas.find(c => c.id === idSesionOriginal); if (!sesionOriginal) return; const itemsOriginales = [...sesionOriginal.cuenta]; const itemsParaNueva = []; const itemsParaVieja = []; itemsOriginales.forEach((item, index) => itemsIndicesAMover.includes(index) ? itemsParaNueva.push(item) : itemsParaVieja.push(item)); const totalNueva = itemsParaNueva.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const totalVieja = itemsParaVieja.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); const nuevaCuenta = { id: `C-${Date.now().toString().slice(-4)}-DIV`, cliente: nombreNuevoCliente, cuenta: itemsParaNueva, total: totalNueva }; const cuentasActualizadas = mesaObj.cuentas.map(c => c.id === idSesionOriginal ? { ...c, cuenta: itemsParaVieja, total: totalVieja } : c); cuentasActualizadas.push(nuevaCuenta); await actualizarMesaEnBD({ ...mesaObj, cuentas: cuentasActualizadas }); if (cuentaActiva.id === idSesionOriginal) setCuentaActiva({ ...cuentaActiva, cuenta: itemsParaVieja, total: totalVieja }); mostrarNotificacion(`Items movidos a "${nombreNuevoCliente}"`, "exito"); };
  
  const abrirPOSCuentaMesa = (idMesa, idCuenta) => { const mesa = mesas.find(m => m.id === idMesa); const cuenta = mesa.cuentas.find(c => c.id === idCuenta); if(cuenta) setCuentaActiva({ tipo: 'mesa', id: idCuenta, idMesa, nombreMesa: mesa.nombre, ...cuenta }); };
  const crearSesionLlevar = async (datos) => { try { const res = await createSession(datos); setCuentaActiva(res.session); } catch (e) { mostrarNotificacion("Error al crear sesión", "error"); } };
  const abrirPOSLlevar = (id) => { const p = sesionesLlevar.find(s => s.id === id); if(p) setCuentaActiva(p); };
  
  const iniciarCancelacion = (f) => setPedidoACancelar(f);
  const confirmarCancelacion = async () => { const pedido = pedidosPasteleria.find(p => p.folio === pedidoACancelar); if (pedido) { try { await updateOrderStatus(pedido.id, { estado: 'Cancelado', fechaCancelacion: new Date().toISOString() }); mostrarNotificacion("Pedido enviado a la papelera"); } catch (e) { mostrarNotificacion("Error al cancelar", "error"); } } setPedidoACancelar(null); };
  const iniciarRestauracion = (f) => setPedidoARestaurar(f);
  const confirmarRestauracion = async () => { const pedido = pedidosPasteleria.find(p => p.folio === pedidoARestaurar); if (pedido) { try { await updateOrderStatus(pedido.id, { estado: 'Pendiente' }); mostrarNotificacion("Pedido restaurado"); } catch (e) { mostrarNotificacion("Error al restaurar", "error"); } } setPedidoARestaurar(null); };
  const restaurarPedidoDirectamente = async (folio) => { const pedido = pedidosPasteleria.find(p => p.folio === folio); if (pedido) { try { await updateOrderStatus(pedido.id, { estado: 'Pendiente' }); mostrarNotificacion("Pedido restaurado a Pendientes", "exito"); } catch (e) { mostrarNotificacion("Error", "error"); } } };
  const iniciarEntrega = (f) => { const pedido = pedidosPasteleria.find(p => p.folio === f); if (pedido) { const pagado = pedido.pagosRealizados || 0; const totalPagos = parseInt(pedido.numPagos) || 1; if (pagado < totalPagos) { mostrarNotificacion(`⚠️ Falta pago (${pagado}/${totalPagos})`, "error"); return; } } setPedidoAEntregar(f); };
  const confirmarEntrega = async () => { const folioParaEntregar = pedidoAEntregar; setPedidoAEntregar(null); const pedido = pedidosPasteleria.find(p => p.folio === folioParaEntregar); if (pedido) { try { await updateOrderStatus(pedido.id, { estado: 'Entregado', fechaEntregaReal: new Date().toISOString() }); mostrarNotificacion("Pedido entregado", "exito"); } catch (e) { mostrarNotificacion("Error", "error"); } } };
  const restaurarDeEntregados = async (folio) => { const pedido = pedidosPasteleria.find(p => p.folio === folio); if (pedido) { try { await updateOrderStatus(pedido.id, { estado: 'Pendiente' }); mostrarNotificacion("Entrega deshecha", "info"); } catch (e) { mostrarNotificacion("Error", "error"); } } };
  const eliminarPedidoPermanente = async (id) => { try { await deleteOrder(id); mostrarNotificacion("Eliminado permanentemente", "info"); } catch (e) { mostrarNotificacion("Error", "error"); } };
  const vaciarPapeleraPasteleria = async () => { const cancelados = pedidosPasteleria.filter(p => p.estado === 'Cancelado'); if (cancelados.length === 0) return; try { const res = await emptyOrdersTrash(cancelados); mostrarNotificacion(res.message, "info"); } catch (e) { mostrarNotificacion("Error", "error"); } };

  const mensajeEntrega = useMemo(() => {
      if (!pedidoAEntregar) return '';
      const p = pedidosPasteleria.find(x => x.folio === pedidoAEntregar);
      if (!p) return '';
      if (p.fechaEntrega !== getFechaHoy()) return `⚠️ ATENCIÓN: Estás entregando un pedido programado para el ${formatearFechaLocal(p.fechaEntrega)}. ¿Confirmar?`;
      return `El pedido de ${p.cliente} se marcará como entregado.`;
  }, [pedidoAEntregar, pedidosPasteleria]);

  const ventasCafeteriaHoy = useMemo(() => {
      const hoy = getFechaHoy();
      return ventasCafeteria.filter(v => v.fecha === hoy);
  }, [ventasCafeteria]);

  const renderContenidoProtegido = () => (
    <LayoutConSidebar 
        modo={modo} 
        vistaActual={vistaActual} 
        setVistaActual={(vista) => {
            setVistaActual(vista);
            if(vista !== 'pedidos') setFechaParaNuevoPedido(null);
        }} 
        setModo={cambiarModoDesdeSidebar} 
        onLogout={handleLogout}
        userRole={userRole} 
    >
      <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
      
      {modo === 'admin' && ( 
        <> 
            {vistaActual === 'inicio' && <VistaInicioAdmin pedidos={pedidosPasteleria} ventasCafeteria={ventasCafeteria} onVerDetalles={(item) => setPedidoVerDetalles(item)} />} 
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={ventasCafeteria} modo="admin" onAbrirModalDia={(d, m, a, v) => setDatosModalDia({ dia: d, mes: m, anio: a, ventas: v })} />} 
            {vistaActual === 'usuarios' && <VistaGestionUsuarios usuarios={usuariosSistema} onGuardar={guardarUsuario} onEliminar={eliminarUsuario} />}
            
            {/* 2. AGREGAMOS EL RENDERIZADO DE LA NUEVA VISTA */}
            {vistaActual === 'basedatos' && <VistaBaseDatos />}
        </> 
      )}
      
      {modo === 'pasteleria' && ( 
        <> 
            {vistaActual === 'inicio' && <VistaInicioPasteleria 
                pedidos={pedidosPasteleria} 
                onEditar={(p) => { setPedidoAEditar(p); setVistaActual('pedidos'); }} 
                onVerDetalles={(p) => setPedidoVerDetalles(p)} 
                onIniciarEntrega={iniciarEntrega} 
                onCancelar={iniciarCancelacion} 
                onRestaurar={restaurarPedidoDirectamente} 
                onDeshacerEntrega={restaurarDeEntregados}
                onVaciarPapelera={vaciarPapeleraPasteleria}
                onEliminarDePapelera={eliminarPedidoPermanente}
            />} 
            {vistaActual === 'pedidos' && (
                <VistaNuevoPedido 
                    pedidos={pedidosPasteleria} 
                    onGuardarPedido={guardarPedido} 
                    generarFolio={generarFolio} 
                    pedidoAEditar={pedidoAEditar} 
                    mostrarNotificacion={mostrarNotificacion} 
                    fechaPreseleccionada={fechaParaNuevoPedido}
                />
            )} 
            {vistaActual === 'agenda' && <VistaCalendarioPasteleria pedidos={pedidosPasteleria} onSeleccionarDia={(f) => setFechaAgendaSeleccionada(f)} />} 
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={[]} modo="pasteleria" onAbrirModalDia={(d, m, a, v) => setDatosModalDia({ dia: d, mes: m, anio: a, ventas: v })} />} 
        </> 
      )}
      
      {modo === 'cafeteria' && ( 
        <> 
            {vistaActual === 'inicio' && (
                <VistaInicioCafeteria 
                    mesas={mesas} 
                    pedidosLlevar={sesionesLlevar} 
                    ventasHoy={ventasCafeteriaHoy}
                    cancelados={cancelados}
                    onSeleccionarMesa={abrirHubMesa} 
                    onCrearLlevar={crearSesionLlevar} 
                    onAbrirLlevar={abrirPOSLlevar}
                    onRestaurarVenta={restaurarDeHistorial}
                    onDeshacerCancelacion={restaurarDeHistorial}
                    onVaciarPapelera={vaciarPapelera}
                    onEliminarDePapelera={eliminarDePapelera}
                />
            )} 

            {vistaActual === 'cocina' && (
          <VistaCocina 
              mesas={mesas} 
              pedidosLlevar={sesionesLlevar} 
              mostrarNotificacion={mostrarNotificacion} // <--- ¡IMPORTANTE! Agrega esta línea
          />
          )}

            {vistaActual === 'menu' && <VistaMenuCafeteria productos={productosCafeteria} onGuardarProducto={guardarProductoCafeteria} onEliminarProducto={eliminarProductoCafeteria} />} 
            
            {vistaActual === 'mesas' && (
                <VistaGestionMesas 
                    mesas={mesas} 
                    onAgregarMesa={agregarMesa} 
                    onEliminarMesa={eliminarMesa} 
                    servicioActivo={servicioActivo} 
                />
            )} 

            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={[]} ventasCafeteria={ventasCafeteria} modo="cafeteria" onAbrirModalDia={(d, m, a, v) => setDatosModalDia({ dia: d, mes: m, anio: a, ventas: v })} />} 
        </> 
      )}
      
      {mesaSeleccionadaId && !cuentaActiva && <VistaHubMesa mesa={mesaSeleccionadaObj} onVolver={() => setMesaSeleccionadaId(null)} onAbrirCuenta={abrirPOSCuentaMesa} onCrearCuenta={(id, nombre) => crearCuentaEnMesa(id, nombre.toUpperCase())} onUnirCuentas={unirCuentas} />}
      
      {cuentaActiva && <VistaDetalleCuenta 
          sesion={cuentaActiva} 
          productos={productosCafeteria} 
          onCerrar={() => setCuentaActiva(null)} 
          onAgregarProducto={agregarProductoASesion} 
          onPagarCuenta={pagarCuenta}
          onActualizarProducto={actualizarProductoEnSesion}
          onCancelarCuenta={cancelarCuentaSinPagar}
          onDividirCuentaManual={dividirCuentaManual} 
          onDesunirCuentas={desunirCuentas} 
          onConfirmarOrden={confirmarOrdenCocina} // <--- AGREGAR ESTA LÍNEA
      />}
      
      <ModalDetalles pedido={pedidoVerDetalles} cerrar={() => setPedidoVerDetalles(null)} onRegistrarPago={registrarPago} />
      {datosModalDia && <ModalVentasDia dia={datosModalDia.dia} mes={datosModalDia.mes} anio={datosModalDia.anio} ventas={datosModalDia.ventas} cerrar={() => setDatosModalDia(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}
      
      {fechaAgendaSeleccionada && (
          <ModalAgendaDia 
              fechaIso={fechaAgendaSeleccionada} 
              pedidos={pedidosPasteleria} 
              cerrar={() => setFechaAgendaSeleccionada(null)} 
              onVerDetalle={(item) => setPedidoVerDetalles(item)} 
              onNuevoPedido={(fecha) => {
                  setFechaParaNuevoPedido(fecha);
                  setVistaActual('pedidos');
                  setFechaAgendaSeleccionada(null); 
              }}
          />
      )}

      <ModalConfirmacion isOpen={!!pedidoACancelar} onClose={() => setPedidoACancelar(null)} onConfirm={confirmarCancelacion} titulo="¿Cancelar Pedido?" mensaje="El pedido se moverá a la 'Papelera', tendrás el resto del día por si necesitas recuperarlo. Después se eliminará permanentemente." />
      <ModalConfirmacion isOpen={!!pedidoARestaurar} onClose={() => setPedidoARestaurar(null)} onConfirm={confirmarRestauracion} titulo="¿Restaurar Pedido?" mensaje="El pedido volverá a Pendientes." />
      
      <ModalConfirmacion 
        isOpen={!!pedidoAEntregar} 
        onClose={() => setPedidoAEntregar(null)} 
        onConfirm={confirmarEntrega} 
        titulo={pedidoAEntregar && pedidosPasteleria.find(p => p.folio === pedidoAEntregar)?.fechaEntrega !== getFechaHoy() ? "¿Entrega Diferida?" : "¿Confirmar Entrega?"} 
        mensaje={mensajeEntrega}
        tipo="entregar" 
      />
    </LayoutConSidebar>
  );

  return (
    <Routes>
        <Route path="/login" element={<VistaLogin onLogin={handleLogin} usuariosDB={usuariosSistema} />} />
        <Route path="/admin" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/pasteleria" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/cafeteria" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/admin" />} />
        
        {/* RUTAS CLIENTE CON BLOQUEO */}
        <Route path="/mesa/:id" element={
            <RutaCliente 
                mesas={mesas} 
                sesionesLlevar={sesionesLlevar} 
                productos={productosCafeteria} 
                onRealizarPedido={recibirPedidoCliente} 
                onSalir={() => window.close()} 
                loading={cargandoDatos} 
                servicioActivo={servicioActivo}
            />
        } />
        <Route path="/llevar" element={
            <RutaCliente 
                mesas={mesas} 
                sesionesLlevar={sesionesLlevar} 
                productos={productosCafeteria} 
                onRealizarPedido={recibirPedidoCliente} 
                onSalir={() => window.close()} 
                loading={cargandoDatos} 
                servicioActivo={servicioActivo} 
            />
        } />
        
        <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}