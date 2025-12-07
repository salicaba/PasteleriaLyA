import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Smartphone, ShoppingBag } from 'lucide-react';

import { PRODUCTOS_CAFETERIA_INIT, SESIONES_LLEVAR_INIT, VENTAS_CAFETERIA_INIT, getFechaHoy } from './utils/config';
import { Notificacion, LayoutConSidebar, ModalDetalles, ModalVentasDia, ModalConfirmacion, ModalAgendaDia } from './components/Shared';
import { VistaInicioPasteleria, VistaNuevoPedido, VistaCalendarioPasteleria } from './features/Pasteleria';
import { VistaInicioCafeteria, VistaMenuCafeteria, VistaGestionMesas, VistaDetalleCuenta, VistaHubMesa } from './features/Cafeteria';
import { VistaInicioAdmin, VistaReporteUniversal, VistaGestionUsuarios } from './features/Admin';
import { VistaCliente } from './features/Cliente';
import { VistaLogin } from './components/Login';

// --- IMPORTACIONES DE FIREBASE ---
import { db } from './firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';

const RutaCliente = ({ mesas, sesionesLlevar, productos, onRealizarPedido, onSalir }) => {
    const { id } = useParams(); 
    const location = useLocation();
    const esLlevar = id === 'llevar' || location.pathname === '/llevar';
    
    const mesaObj = useMemo(() => {
        if (esLlevar) {
            const cuentasAdaptadas = sesionesLlevar.map(s => ({ ...s, cliente: s.nombreCliente }));
            return { id: 'QR_LLEVAR', nombre: 'Para Llevar (Mostrador)', cuentas: cuentasAdaptadas };
        }
        return mesas.find(m => m.id === id);
    }, [id, mesas, sesionesLlevar, esLlevar]);

    if (!mesaObj) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-gray-500">Mesa no encontrada o código QR inválido.</p>
                    <button onClick={onSalir} className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-xl">Volver al Inicio</button>
                </div>
            </div>
        );
    }

    return <VistaCliente mesa={mesaObj} productos={productos} onRealizarPedido={onRealizarPedido} onSalir={onSalir} />;
};

export default function PasteleriaApp() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- PERSISTENCIA: Leemos localStorage al iniciar el estado ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return localStorage.getItem('lya_session_active') === 'true';
  });
  
  const [vistaActual, setVistaActual] = useState('inicio');

  const modo = useMemo(() => {
      const path = location.pathname;
      if (path.includes('/pasteleria')) return 'pasteleria';
      if (path.includes('/cafeteria')) return 'cafeteria';
      return 'admin';
  }, [location]);

  // --- ESTADOS CONECTADOS A FIREBASE ---
  const [productosCafeteria, setProductosCafeteria] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [pedidosPasteleria, setPedidosPasteleria] = useState([]); 
  const [ventasCafeteria, setVentasCafeteria] = useState([]); 
  const [usuariosSistema, setUsuariosSistema] = useState([]); // <--- NUEVO ESTADO USUARIOS

  // ESTADOS LOCALES
  const [sesionesLlevar, setSesionesLlevar] = useState(SESIONES_LLEVAR_INIT);
  const [cancelados, setCancelados] = useState([]); 

  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null); 
  const [cuentaActiva, setCuentaActiva] = useState(null); 
  const [fechaAgendaSeleccionada, setFechaAgendaSeleccionada] = useState(null);
  
  const mesaSeleccionadaObj = useMemo(() => {
      return mesas.find(m => m.id === mesaSeleccionadaId);
  }, [mesas, mesaSeleccionadaId]);

  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [pedidoVerDetalles, setPedidoVerDetalles] = useState(null);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
  const [datosModalDia, setDatosModalDia] = useState(null);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [pedidoARestaurar, setPedidoARestaurar] = useState(null);
  const [pedidoAEntregar, setPedidoAEntregar] = useState(null);
  
  const ID_QR_LLEVAR = 'QR_LLEVAR';

  useEffect(() => {
    const intervalo = setInterval(() => {
        const ahora = Date.now();
        setCancelados(prev => prev.filter(item => (ahora - item.timestamp) < 300000));
    }, 30000); 
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
      const unsubscribeProductos = onSnapshot(collection(db, "productos"), (snapshot) => {
          const prodData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setProductosCafeteria(prodData);
      });
      const unsubscribeMesas = onSnapshot(collection(db, "mesas"), (snapshot) => {
          const mesaData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setMesas(mesaData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      });
      const unsubscribePedidos = onSnapshot(collection(db, "pedidos"), (snapshot) => {
          const pedidosData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setPedidosPasteleria(pedidosData);
      });
      const unsubscribeVentas = onSnapshot(collection(db, "ventas"), (snapshot) => {
          const ventasData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setVentasCafeteria(ventasData);
      });
      // --- NUEVA SUSCRIPCIÓN A USUARIOS ---
      const unsubscribeUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
          const uData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setUsuariosSistema(uData);
      });

      return () => {
          unsubscribeProductos();
          unsubscribeMesas();
          unsubscribePedidos();
          unsubscribeVentas();
          unsubscribeUsuarios(); // Limpiar suscripción
      };
  }, []);

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { 
    setNotificacion({ visible: true, mensaje, tipo }); 
    setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); 
  };

  // --- LOGIN ACTUALIZADO CON MENSAJE PERSONALIZADO ---
  const handleLogin = (usuario) => {
      localStorage.setItem('lya_session_active', 'true'); 
      setIsAuthenticated(true);
      navigate('/admin');
      
      const nombreMostrar = usuario.nombre || "ADMINISTRADOR";
      const rolMostrar = usuario.rol ? usuario.rol.toUpperCase() : "ADMIN";
      
      mostrarNotificacion(`Bienvenido ${nombreMostrar}, tienes el Rol de ${rolMostrar}`, "exito");
  };

  // --- LOGOUT: Borramos de localStorage ---
  const handleLogout = () => {
      localStorage.removeItem('lya_session_active'); 
      setIsAuthenticated(false);
      navigate('/login');
      mostrarNotificacion("Sesión cerrada correctamente", "info");
  };

  const cambiarModoDesdeSidebar = (nuevoModo) => { navigate(`/${nuevoModo}`); setVistaActual('inicio'); };

  // --- FUNCIONES GESTIÓN USUARIOS ---
  const guardarUsuario = async (usuario) => {
      try {
          if (usuario.id) {
              await updateDoc(doc(db, "usuarios", usuario.id), usuario);
              mostrarNotificacion(`Usuario ${usuario.nombre} actualizado`, "exito");
          } else {
              // Validar duplicados de username
              const existe = usuariosSistema.find(u => u.usuario === usuario.usuario);
              if (existe) { mostrarNotificacion("El nombre de usuario ya existe.", "error"); return; }
              
              await addDoc(collection(db, "usuarios"), usuario);
              mostrarNotificacion(`Usuario ${usuario.nombre} creado`, "exito");
          }
      } catch (e) { mostrarNotificacion("Error al guardar usuario", "error"); }
  };

  const eliminarUsuario = async (id) => {
      try {
          await deleteDoc(doc(db, "usuarios", id));
          mostrarNotificacion("Usuario eliminado", "info");
      } catch (e) { mostrarNotificacion("Error al eliminar", "error"); }
  };

  const guardarProductoCafeteria = async (prod) => { 
    try {
        if (prod.id) {
            await updateDoc(doc(db, "productos", prod.id), prod);
            mostrarNotificacion("Producto actualizado", "exito");
        } else {
            await addDoc(collection(db, "productos"), prod);
            mostrarNotificacion("Producto creado", "exito");
        }
    } catch (error) { mostrarNotificacion("Error al guardar: " + error.message, "error"); }
  };
  
  const eliminarProductoCafeteria = async (id) => { 
    if(!window.confirm("¿Eliminar producto?")) return;
    try {
        await deleteDoc(doc(db, "productos", id));
        mostrarNotificacion("Producto eliminado", "info"); 
    } catch (error) { mostrarNotificacion("Error al eliminar", "error"); }
  };
  
  const agregarMesa = async () => { 
    const nuevaId = `M-${Date.now().toString().slice(-5)}`;
    const nuevaMesa = { id: nuevaId, nombre: `Mesa ${mesas.length + 1}`, tipo: 'mesa', estado: 'Libre', cuentas: [] };
    try {
        await setDoc(doc(db, "mesas", nuevaId), nuevaMesa);
        mostrarNotificacion("Mesa agregada", "exito");
    } catch (e) { mostrarNotificacion("Error al crear mesa", "error"); }
  };
  
  const eliminarMesa = async (id) => { 
    try {
        await deleteDoc(doc(db, "mesas", id));
        mostrarNotificacion("Mesa eliminada", "info"); 
    } catch(e) { mostrarNotificacion("Error al eliminar mesa", "error"); }
  };
  
  const actualizarMesaEnBD = async (mesaObj) => {
      try {
          await updateDoc(doc(db, "mesas", mesaObj.id), { cuentas: mesaObj.cuentas });
      } catch (e) { console.error("Error actualizando mesa:", e); }
  };

  const crearCuentaEnMesa = (idMesa, nombreCliente, itemsIniciales = []) => { 
    const mesa = mesas.find(m => m.id === idMesa);
    if (!mesa) return;
    const totalInicial = itemsIniciales.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); 
    const nuevaCuenta = { id: `C-${Date.now().toString().slice(-4)}`, cliente: nombreCliente, cuenta: itemsIniciales, total: totalInicial }; 
    const mesaActualizada = { ...mesa, cuentas: [...mesa.cuentas, nuevaCuenta] };
    actualizarMesaEnBD(mesaActualizada);
    return nuevaCuenta; 
  };
  
  const recibirPedidoCliente = (idMesa, nombre, carrito, telefono = '') => { 
    if (idMesa === ID_QR_LLEVAR) {
        const sesionExistente = sesionesLlevar.find(s => s.nombreCliente === nombre);
        if (sesionExistente) {
            setSesionesLlevar(prev => prev.map(s => {
                if (s.id === sesionExistente.id) {
                    const nuevosItems = [...s.cuenta, ...carrito];
                    return { ...s, cuenta: nuevosItems, total: nuevosItems.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0) };
                }
                return s;
            }));
        } else {
            const totalInicial = carrito.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
            const nuevaSesion = { id: `L-${Date.now().toString().slice(-4)}`, tipo: 'llevar', nombreCliente: nombre, telefono, cuenta: carrito, total: totalInicial, estado: 'Activa' };
            setSesionesLlevar([...sesionesLlevar, nuevaSesion]);
        }
        mostrarNotificacion(`Pedido recibido: ${nombre}`, "exito");
    } else {
        const mesa = mesas.find(m => m.id === idMesa);
        if(!mesa) return;
        const cuentaExistente = mesa.cuentas.find(c => c.cliente === nombre);
        if (cuentaExistente) { 
            const cuentasActualizadas = mesa.cuentas.map(c => {
                if(c.id === cuentaExistente.id) {
                    const nuevosItems = [...c.cuenta, ...carrito];
                    return { ...c, cuenta: nuevosItems, total: nuevosItems.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0) };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasActualizadas });
            mostrarNotificacion(`Pedido agregado: ${nombre}`, "info"); 
        } else { 
            crearCuentaEnMesa(idMesa, nombre, carrito); 
            mostrarNotificacion(`Nuevo cliente en Mesa: ${nombre}`, "exito"); 
        }
    }
  };

  const agregarProductoASesion = (idSesion, producto) => { 
    if (cuentaActiva.tipo === 'mesa') { 
        const mesa = mesas.find(m => m.id === cuentaActiva.idMesa);
        if(mesa) {
            const cuentasNuevas = mesa.cuentas.map(c => {
                if(c.id === cuentaActiva.id) {
                    let items = [...c.cuenta];
                    const itemIndex = items.findIndex(i => i.id === producto.id);
                    if (itemIndex > -1) items[itemIndex] = { ...items[itemIndex], cantidad: (items[itemIndex].cantidad || 1) + 1 };
                    else items.push({ ...producto, cantidad: 1 });
                    const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                    setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                    return { ...c, cuenta: items, total };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasNuevas });
        }
    } else { 
        setSesionesLlevar(sesionesLlevar.map(s => { 
            if (s.id === idSesion) { 
                let items = [...s.cuenta];
                const itemIndex = items.findIndex(i => i.id === producto.id);
                if (itemIndex > -1) items[itemIndex] = { ...items[itemIndex], cantidad: (items[itemIndex].cantidad || 1) + 1 };
                else items.push({ ...producto, cantidad: 1 });
                const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                return { ...s, cuenta: items, total }; 
            } 
            return s; 
        })); 
    } 
    mostrarNotificacion("Producto agregado", "info"); 
  };

  const actualizarProductoEnSesion = (idSesion, idProducto, delta) => {
    if (cuentaActiva.tipo === 'mesa') {
        const mesa = mesas.find(m => m.id === cuentaActiva.idMesa);
        if(mesa) {
            const cuentasNuevas = mesa.cuentas.map(c => {
                if(c.id === cuentaActiva.id) {
                    let items = [...c.cuenta];
                    const itemIndex = items.findIndex(i => i.id === idProducto);
                    if(itemIndex > -1) {
                        const nuevaCant = (items[itemIndex].cantidad || 1) + delta;
                        if(nuevaCant <= 0) items.splice(itemIndex, 1);
                        else items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant };
                    }
                    const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                    setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                    return { ...c, cuenta: items, total };
                }
                return c;
            });
            actualizarMesaEnBD({ ...mesa, cuentas: cuentasNuevas });
        }
    } else {
        setSesionesLlevar(prev => prev.map(s => {
            if (s.id === idSesion) {
                let items = [...s.cuenta];
                const itemIndex = items.findIndex(i => i.id === idProducto);
                if(itemIndex > -1) {
                    const nuevaCant = (items[itemIndex].cantidad || 1) + delta;
                    if(nuevaCant <= 0) items.splice(itemIndex, 1);
                    else items[itemIndex] = { ...items[itemIndex], cantidad: nuevaCant };
                }
                const total = items.reduce((a, b) => a + (b.precio * (b.cantidad || 1)), 0);
                setCuentaActiva(act => ({...act, cuenta: items, total}));
                return { ...s, cuenta: items, total };
            }
            return s;
        }));
    }
  };

  const pagarCuenta = async (sesion) => { 
    const total = sesion.cuenta.reduce((acc, p) => acc + (p.precio * (p.cantidad || 1)), 0); 
    const nuevaVenta = { 
        folioLocal: `T-${Date.now().toString().slice(-6)}`, 
        fecha: getFechaHoy(), 
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        total, 
        items: sesion.cuenta.length, 
        cliente: sesion.tipo === 'mesa' ? `${sesion.nombreMesa} - ${sesion.cliente}` : `${sesion.nombreCliente} (Llevar)`, 
        origen: 'Cafetería',
        origenMesaId: sesion.tipo === 'mesa' ? sesion.idMesa : null,
        nombreMesa: sesion.tipo === 'mesa' ? sesion.nombreMesa : null,
        nombreCliente: sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente,
        cuentaOriginal: sesion.cuenta,
        telefono: sesion.telefono || '',
        tipo: sesion.tipo
    }; 

    try {
        await addDoc(collection(db, "ventas"), nuevaVenta);
        if (sesion.tipo === 'mesa') { 
            const mesa = mesas.find(m => m.id === sesion.idMesa);
            if(mesa) {
                const cuentasRestantes = mesa.cuentas.filter(c => c.id !== sesion.id);
                await actualizarMesaEnBD({ ...mesa, cuentas: cuentasRestantes });
            }
        } else { 
            setSesionesLlevar(sesionesLlevar.filter(s => s.id !== sesion.id)); 
        } 
        setCuentaActiva(null); 
        mostrarNotificacion("Cuenta pagada y guardada.", "exito");
    } catch (e) {
        mostrarNotificacion("Error al guardar venta: " + e.message, "error");
    }
  };

  const cancelarCuentaSinPagar = (sesion) => {
      const canceladoItem = {
          ...sesion,
          timestamp: Date.now(),
          origenMesaId: sesion.tipo === 'llevar' ? null : sesion.idMesa,
          nombreMesa: sesion.nombreMesa,
          cuentaOriginal: sesion.cuenta,
          nombreCliente: sesion.tipo === 'llevar' ? sesion.nombreCliente : sesion.cliente
      };
      setCancelados([...cancelados, canceladoItem]);
      if (sesion.tipo === 'mesa') {
          const mesa = mesas.find(m => m.id === sesion.idMesa);
          if (mesa) {
              const cuentasRestantes = mesa.cuentas.filter(c => c.id !== sesion.id);
              actualizarMesaEnBD({ ...mesa, cuentas: cuentasRestantes });
          }
      } else {
          setSesionesLlevar(prev => prev.filter(s => s.id !== sesion.id));
      }
      setCuentaActiva(null);
      mostrarNotificacion("Pedido enviado a Cancelados (5 min para deshacer)", "info");
  };

  const restaurarDeHistorial = async (item) => {
      const cuentaRestaurada = {
          id: `R-${Date.now().toString().slice(-4)}`,
          cliente: item.nombreCliente || item.cliente,
          nombreCliente: item.nombreCliente || item.cliente,
          cuenta: item.cuentaOriginal || item.cuenta,
          total: item.total,
          telefono: item.telefono || '',
          tipo: item.origenMesaId ? 'mesa' : 'llevar',
          idMesa: item.origenMesaId,
          nombreMesa: item.nombreMesa,
          estado: 'Activa'
      };

      if (item.origenMesaId) {
          const existeMesa = mesas.find(m => m.id === item.origenMesaId);
          if (!existeMesa) {
              alert("La mesa original ya no existe. Se restaurará como 'Para Llevar'.");
              setSesionesLlevar([...sesionesLlevar, { ...cuentaRestaurada, tipo: 'llevar', id: `L-R-${Date.now()}` }]);
          } else {
              const cuentasActualizadas = [...existeMesa.cuentas, cuentaRestaurada];
              actualizarMesaEnBD({ ...existeMesa, cuentas: cuentasActualizadas });
          }
      } else {
          setSesionesLlevar([...sesionesLlevar, { ...cuentaRestaurada, tipo: 'llevar' }]);
      }

      const ventaEnBD = ventasCafeteria.find(v => v.id === item.id);
      if (ventaEnBD) {
          try {
              await deleteDoc(doc(db, "ventas", item.id));
              mostrarNotificacion("Venta anulada y pedido restaurado", "exito");
          } catch (e) { mostrarNotificacion("Error al anular venta", "error"); }
      } else {
          setCancelados(prev => prev.filter(c => c.id !== item.id));
          mostrarNotificacion("Pedido recuperado de papelera", "exito");
      }
  };

  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  
  const guardarPedido = async (datos) => { 
    try {
        if (pedidoAEditar) {
            await updateDoc(doc(db, "pedidos", pedidoAEditar.id), datos);
            mostrarNotificacion("Pedido actualizado", "exito");
        } else {
            await addDoc(collection(db, "pedidos"), datos);
            mostrarNotificacion(`Pedido ${datos.folio} registrado`, "exito");
        }
        setVistaActual('inicio'); 
        setPedidoAEditar(null);
    } catch (error) { mostrarNotificacion("Error al guardar pedido", "error"); }
  };
  
  const registrarPago = async (folio, esLiquidacion) => { 
    const pedido = pedidosPasteleria.find(p => p.folio === folio);
    if (!pedido) return;
    const nuevosPagos = esLiquidacion ? parseInt(pedido.numPagos) : (parseInt(pedido.pagosRealizados || 0) + 1);
    try {
        await updateDoc(doc(db, "pedidos", pedido.id), { pagosRealizados: nuevosPagos });
        if (pedidoVerDetalles && pedidoVerDetalles.folio === folio) {
            setPedidoVerDetalles({ ...pedidoVerDetalles, pagosRealizados: nuevosPagos });
        }
        mostrarNotificacion("Pago registrado correctamente", "exito");
    } catch (e) { mostrarNotificacion("Error al registrar pago", "error"); }
  };
  
  const abrirHubMesa = (idMesa) => setMesaSeleccionadaId(idMesa);
  
  const unirCuentas = (idMesa, idCuentaDestino, idsCuentasOrigen) => { 
      const mesa = mesas.find(m => m.id === idMesa);
      if(!mesa) return;
      const destino = mesa.cuentas.find(c => c.id === idCuentaDestino);
      const origenes = mesa.cuentas.filter(c => idsCuentasOrigen.includes(c.id));
      let nuevosItems = [...destino.cuenta];
      origenes.forEach(o => { nuevosItems = [...nuevosItems, ...o.cuenta]; });
      const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
      const cuentasActualizadas = mesa.cuentas.filter(c => !idsCuentasOrigen.includes(c.id)).map(c => c.id === idCuentaDestino ? { ...c, cuenta: nuevosItems, total: nuevoTotal } : c);
      actualizarMesaEnBD({ ...mesa, cuentas: cuentasActualizadas });
      mostrarNotificacion("Cuentas unificadas"); 
  };
  
  const abrirPOSCuentaMesa = (idMesa, idCuenta) => { 
    const mesa = mesas.find(m => m.id === idMesa);
    const cuenta = mesa.cuentas.find(c => c.id === idCuenta);
    if(cuenta) setCuentaActiva({ tipo: 'mesa', id: idCuenta, idMesa, nombreMesa: mesa.nombre, ...cuenta }); 
  };

  const crearSesionLlevar = (datos) => { 
    const nueva = { id: `L-${Date.now().toString().slice(-4)}`, tipo: 'llevar', nombreCliente: datos.nombre, telefono: datos.telefono, cuenta: [], estado: 'Activa' }; 
    setSesionesLlevar([...sesionesLlevar, nueva]); setCuentaActiva(nueva); 
  };
  
  const abrirPOSLlevar = (id) => { const p = sesionesLlevar.find(s => s.id === id); if(p) setCuentaActiva(p); };
  
  const iniciarCancelacion = (f) => setPedidoACancelar(f);
  
  const confirmarCancelacion = async () => { 
      const pedido = pedidosPasteleria.find(p => p.folio === pedidoACancelar);
      if (pedido) {
          try {
              await updateDoc(doc(db, "pedidos", pedido.id), { 
                  estado: 'Cancelado', 
                  fechaCancelacion: new Date().toISOString() 
              });
              mostrarNotificacion("Pedido enviado a la papelera");
          } catch (e) { mostrarNotificacion("Error al cancelar", "error"); }
      }
      setPedidoACancelar(null); 
  };

  const iniciarRestauracion = (f) => setPedidoARestaurar(f);
  
  const confirmarRestauracion = async () => { 
      const pedido = pedidosPasteleria.find(p => p.folio === pedidoARestaurar);
      if (pedido) {
          try {
              await updateDoc(doc(db, "pedidos", pedido.id), { estado: 'Pendiente' });
              mostrarNotificacion("Pedido restaurado");
          } catch (e) { mostrarNotificacion("Error al restaurar", "error"); }
      }
      setPedidoARestaurar(null); 
  };

  const restaurarPedidoDirectamente = async (folio) => {
      const pedido = pedidosPasteleria.find(p => p.folio === folio);
      if (pedido) {
          try {
              await updateDoc(doc(db, "pedidos", pedido.id), { estado: 'Pendiente' });
              mostrarNotificacion("Pedido restaurado a Pendientes", "exito");
          } catch (e) { mostrarNotificacion("Error al restaurar", "error"); }
      }
  };

  const iniciarEntrega = (f) => setPedidoAEntregar(f);
  
  const confirmarEntrega = async () => { 
      const pedido = pedidosPasteleria.find(p => p.folio === pedidoAEntregar);
      if (pedido) {
          try {
              await updateDoc(doc(db, "pedidos", pedido.id), { estado: 'Entregado' });
              mostrarNotificacion("Pedido entregado con éxito", "exito");
          } catch (e) { mostrarNotificacion("Error al entregar", "error"); }
      }
      setPedidoAEntregar(null); 
  };

  const restaurarDeEntregados = async (folio) => { 
      const pedido = pedidosPasteleria.find(p => p.folio === folio);
      if (pedido) {
          try {
              await updateDoc(doc(db, "pedidos", pedido.id), { estado: 'Pendiente' });
              mostrarNotificacion("Entrega deshecha", "info");
          } catch (e) { mostrarNotificacion("Error al deshacer", "error"); }
      }
  };

  const renderContenidoProtegido = () => (
    <LayoutConSidebar modo={modo} vistaActual={vistaActual} setVistaActual={setVistaActual} setModo={cambiarModoDesdeSidebar} onLogout={handleLogout}>
      <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
      
      {modo === 'admin' && ( 
        <> 
            {vistaActual === 'inicio' && <VistaInicioAdmin pedidos={pedidosPasteleria} ventasCafeteria={ventasCafeteria} />} 
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={ventasCafeteria} modo="admin" onAbrirModalDia={(d, m, a, v) => setDatosModalDia({ dia: d, mes: m, anio: a, ventas: v })} />} 
            
            {/* --- NUEVA VISTA RENDERIZADA --- */}
            {vistaActual === 'usuarios' && (
                <VistaGestionUsuarios 
                    usuarios={usuariosSistema}
                    onGuardar={guardarUsuario}
                    onEliminar={eliminarUsuario}
                />
            )}
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
            />} 
            {vistaActual === 'pedidos' && <VistaNuevoPedido pedidos={pedidosPasteleria} onGuardarPedido={guardarPedido} generarFolio={generarFolio} pedidoAEditar={pedidoAEditar} mostrarNotificacion={mostrarNotificacion} />} 
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
                    ventasHoy={ventasCafeteria}
                    cancelados={cancelados}
                    onSeleccionarMesa={abrirHubMesa} 
                    onCrearLlevar={crearSesionLlevar} 
                    onAbrirLlevar={abrirPOSLlevar}
                    onRestaurarVenta={restaurarDeHistorial}
                    onDeshacerCancelacion={restaurarDeHistorial}
                />
            )} 
            {vistaActual === 'menu' && <VistaMenuCafeteria productos={productosCafeteria} onGuardarProducto={guardarProductoCafeteria} onEliminarProducto={eliminarProductoCafeteria} />} 
            {vistaActual === 'mesas' && <VistaGestionMesas mesas={mesas} onAgregarMesa={agregarMesa} onEliminarMesa={eliminarMesa} />} 
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
      />}
      
      <ModalDetalles pedido={pedidoVerDetalles} cerrar={() => setPedidoVerDetalles(null)} onRegistrarPago={registrarPago} />
      {datosModalDia && <ModalVentasDia dia={datosModalDia.dia} mes={datosModalDia.mes} anio={datosModalDia.anio} ventas={datosModalDia.ventas} cerrar={() => setDatosModalDia(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}
      {fechaAgendaSeleccionada && <ModalAgendaDia fechaIso={fechaAgendaSeleccionada} pedidos={pedidosPasteleria} cerrar={() => setFechaAgendaSeleccionada(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}
      <ModalConfirmacion isOpen={!!pedidoACancelar} onClose={() => setPedidoACancelar(null)} onConfirm={confirmarCancelacion} titulo="¿Cancelar Pedido?" mensaje="El pedido se enviará a la Papelera." />
      <ModalConfirmacion isOpen={!!pedidoARestaurar} onClose={() => setPedidoARestaurar(null)} onConfirm={confirmarRestauracion} titulo="¿Restaurar Pedido?" mensaje="El pedido volverá a Pendientes." />
      <ModalConfirmacion isOpen={!!pedidoAEntregar} onClose={() => setPedidoAEntregar(null)} onConfirm={confirmarEntrega} titulo="¿Confirmar Entrega?" mensaje="El pedido se marcará como entregado." />
    </LayoutConSidebar>
  );

  return (
    <Routes>
        <Route path="/login" element={<VistaLogin onLogin={handleLogin} usuariosDB={usuariosSistema} />} />
        <Route path="/admin" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/pasteleria" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/cafeteria" element={isAuthenticated ? renderContenidoProtegido() : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="/mesa/:id" element={<RutaCliente mesas={mesas} sesionesLlevar={sesionesLlevar} productos={productosCafeteria} onRealizarPedido={recibirPedidoCliente} onSalir={() => window.close()} />} />
        <Route path="/llevar" element={<RutaCliente mesas={mesas} sesionesLlevar={sesionesLlevar} productos={productosCafeteria} onRealizarPedido={recibirPedidoCliente} onSalir={() => window.close()} />} />
        <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}