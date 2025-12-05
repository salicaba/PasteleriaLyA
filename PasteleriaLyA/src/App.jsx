import React, { useState, useMemo } from 'react';
import { Menu, Smartphone } from 'lucide-react';

import { PRODUCTOS_CAFETERIA_INIT, MESAS_FISICAS_INIT, SESIONES_LLEVAR_INIT, VENTAS_CAFETERIA_INIT, PEDIDOS_PASTELERIA_INIT, getFechaHoy } from './utils/config';
import { Notificacion, Sidebar, ModalDetalles, ModalVentasDia, ModalConfirmacion } from './components/Shared';
import { VistaInicioPasteleria, VistaNuevoPedido } from './features/Pasteleria';
import { VistaInicioCafeteria, VistaMenuCafeteria, VistaGestionMesas, VistaDetalleCuenta, VistaHubMesa, ModalQR, ModalNuevoLlevar, ModalProducto } from './features/Cafeteria';
import { VistaInicioAdmin, VistaReporteUniversal } from './features/Admin';
import { VistaCliente } from './features/Cliente';

export default function PasteleriaApp() {
  const [modo, setModo] = useState('admin');
  // MODOS: 'admin', 'pasteleria', 'cafeteria', 'cliente-simulado'
  const [vistaActual, setVistaActual] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados Globales
  const [productosCafeteria, setProductosCafeteria] = useState(PRODUCTOS_CAFETERIA_INIT);
  const [mesas, setMesas] = useState(MESAS_FISICAS_INIT);
  const [sesionesLlevar, setSesionesLlevar] = useState(SESIONES_LLEVAR_INIT);
  const [pedidosPasteleria, setPedidosPasteleria] = useState(PEDIDOS_PASTELERIA_INIT);
  const [ventasCafeteria, setVentasCafeteria] = useState(VENTAS_CAFETERIA_INIT);
  
  // Modales y Navegación
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [pedidoVerDetalles, setPedidoVerDetalles] = useState(null);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
  const [datosModalDia, setDatosModalDia] = useState(null);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  
  // NAVEGACIÓN CAFETERÍA
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null); 
  const [cuentaActiva, setCuentaActiva] = useState(null); 
  
  // ESTADO PARA SIMULACIÓN CLIENTE
  const [clienteMesaId, setClienteMesaId] = useState(null);

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { setNotificacion({ visible: true, mensaje, tipo }); setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); };

  // --- LÓGICA DE MESAS Y CUENTAS ---

  const abrirHubMesa = (idMesa) => setMesaSeleccionadaId(idMesa);

  const crearCuentaEnMesa = (idMesa, nombreCliente, itemsIniciales = []) => {
    // Calculamos total inicial
    const totalInicial = itemsIniciales.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
    const nuevaCuenta = {
        id: `C-${Date.now().toString().slice(-4)}`,
        cliente: nombreCliente, // Ya viene en mayúsculas desde el input del cliente
        cuenta: itemsIniciales,
        total: totalInicial
    };
    setMesas(prevMesas => prevMesas.map(m => m.id === idMesa ? { ...m, cuentas: [...m.cuentas, nuevaCuenta] } : m));
    return nuevaCuenta; // Retornamos para uso interno si se necesita
  };

  const unirCuentas = (idMesa, idCuentaDestino, idsCuentasOrigen) => {
      setMesas(mesas.map(m => {
          if (m.id === idMesa) {
              const destino = m.cuentas.find(c => c.id === idCuentaDestino);
              const origenes = m.cuentas.filter(c => idsCuentasOrigen.includes(c.id));
              
              // Combinar items
              let nuevosItems = [...destino.cuenta];
              origenes.forEach(o => {
                  nuevosItems = [...nuevosItems, ...o.cuenta];
              });
              
              const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
              
              // Actualizar destino y remover orígenes
              const cuentasActualizadas = m.cuentas
                  .filter(c => !idsCuentasOrigen.includes(c.id))
                  .map(c => c.id === idCuentaDestino ? { ...c, cuenta: nuevosItems, total: nuevoTotal } : c);
              
              return { ...m, cuentas: cuentasActualizadas };
          }
          return m;
      }));
      mostrarNotificacion("Cuentas unificadas correctamente");
  };

  const abrirPOSCuentaMesa = (idMesa, idCuenta) => {
    const mesa = mesas.find(m => m.id === idMesa);
    const cuenta = mesa.cuentas.find(c => c.id === idCuenta);
    setCuentaActiva({
        tipo: 'mesa',
        id: idCuenta,
        idMesa: idMesa,
        nombreMesa: mesa.nombre,
        cliente: cuenta.cliente,
        cuenta: cuenta.cuenta,
        total: cuenta.total
    });
  };

  // --- LÓGICA PEDIDOS CLIENTE (DESDE QR) ---
  const recibirPedidoCliente = (idMesa, nombre, carrito) => {
      // 1. Buscar si ya existe una cuenta con ese nombre en esa mesa
      const mesa = mesas.find(m => m.id === idMesa);
      // *** CORRECCIÓN AQUÍ *** (Antes tenía un error de dedo)
      const cuentaExistente = mesa.cuentas.find(c => c.cliente === nombre);

      if (cuentaExistente) {
          // Agregar a cuenta existente
          setMesas(prev => prev.map(m => {
              if (m.id === idMesa) {
                  return {
                      ...m,
                      cuentas: m.cuentas.map(c => {
                          if (c.id === cuentaExistente.id) {
                              const nuevosItems = [...c.cuenta, ...carrito];
                              const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
                              return { ...c, cuenta: nuevosItems, total: nuevoTotal };
                          }
                          return c;
                      })
                  };
              }
              return m;
          }));
          mostrarNotificacion(`Pedido agregado a cuenta de ${nombre}`, "info");
      } else {
          // Crear nueva cuenta
          crearCuentaEnMesa(idMesa, nombre, carrito);
          mostrarNotificacion(`Nuevo pedido recibido: Mesa ${mesa.nombre} - ${nombre}`, "exito");
      }
  };

  // --- SIMULACIÓN DE ESCANEO DE QR ---
  const simularEscaneoQR = (idMesa) => {
      setClienteMesaId(idMesa);
      setModo('cliente-simulado'); // Cambiamos toda la UI a modo cliente
  };

  // --- LÓGICA PEDIDOS PARA LLEVAR (MOSTRADOR) ---
  const crearSesionLlevar = (datosCliente) => {
    const nuevaSesion = { 
        id: `L-${Date.now().toString().slice(-4)}`, 
        tipo: 'llevar', 
        nombreCliente: datosCliente.nombre, 
        telefono: datosCliente.telefono, 
        cuenta: [], 
        estado: 'Activa' 
    };
    setSesionesLlevar([...sesionesLlevar, nuevaSesion]);
    mostrarNotificacion("Pedido Para Llevar iniciado", "exito");
    setCuentaActiva(nuevaSesion);
  };

  const abrirPOSLlevar = (idPedido) => {
      const pedido = sesionesLlevar.find(p => p.id === idPedido);
      if(pedido) setCuentaActiva(pedido);
  };

  // --- GESTIÓN DE PRODUCTOS EN POS ---
  const agregarProductoASesion = (idSesion, producto) => {
    if (cuentaActiva.tipo === 'mesa') {
        // Actualizar cuenta dentro de mesa
        setMesas(mesas.map(m => {
            if (m.id === cuentaActiva.idMesa) {
                const nuevasCuentas = m.cuentas.map(c => {
                    if (c.id === cuentaActiva.id) {
                        const items = [...c.cuenta, producto];
                        const total = items.reduce((acc, i) => acc + i.precio, 0);
                        // Actualizamos también el estado local del POS para verlo reflejado
                        setCuentaActiva(prev => ({...prev, cuenta: items, total}));
                        return { ...c, cuenta: items, total };
                    }
                    return c;
                });
                return { ...m, cuentas: nuevasCuentas };
            }
            return m;
        }));
    } else {
        // Actualizar pedido llevar
        setSesionesLlevar(sesionesLlevar.map(s => {
            if (s.id === idSesion) {
                const items = [...s.cuenta, producto];
                setCuentaActiva(prev => ({...prev, cuenta: items, total: items.reduce((a,b)=>a+b.precio,0)})); // Reflejo local
                return { ...s, cuenta: items };
            }
            return s;
        }));
    }
    mostrarNotificacion(`${producto.nombre} agregado`, "info");
  };

  const pagarCuenta = (sesion) => {
    const total = sesion.cuenta.reduce((acc, p) => acc + p.precio, 0);
    const nuevaVenta = { 
        id: `T-${Date.now().toString().slice(-6)}`, 
        fecha: getFechaHoy(), 
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        total: total, 
        items: sesion.cuenta.length, 
        cliente: sesion.tipo === 'mesa' ? `${sesion.nombreMesa} - ${sesion.cliente}` : `${sesion.nombreCliente} (Llevar)`, 
        origen: 'Cafetería' 
    };
    
    setVentasCafeteria([...ventasCafeteria, nuevaVenta]);

    if (sesion.tipo === 'mesa') {
        // Eliminar solo la sub-cuenta pagada de la mesa
        setMesas(mesas.map(m => {
            if(m.id === sesion.idMesa) {
                return { ...m, cuentas: m.cuentas.filter(c => c.id !== sesion.id) };
            }
            return m;
        }));
        setCuentaActiva(null);
    } else {
        setSesionesLlevar(sesionesLlevar.filter(s => s.id !== sesion.id));
        setCuentaActiva(null);
    }
    
    mostrarNotificacion(`Cuenta pagada. Ticket: ${nuevaVenta.id}`, "exito");
  };

  // Objetos auxiliares para renderizado
  const mesaSeleccionadaObj = useMemo(() => mesas.find(m => m.id === mesaSeleccionadaId), [mesas, mesaSeleccionadaId]);

  // FUNCIONES GENERALES
  const guardarProductoCafeteria = (prod) => { if (prod.id) setProductosCafeteria(productosCafeteria.map(p => p.id === prod.id ? prod : p)); else setProductosCafeteria([...productosCafeteria, { ...prod, id: Date.now() }]); };
  const agregarMesa = () => { setMesas([...mesas, { id: `M${mesas.length + 1}`, nombre: `Mesa ${mesas.length + 1}`, tipo: 'mesa', estado: 'Libre', cuentas: [] }]); };
  const eliminarMesa = (id) => { if(window.confirm("¿Eliminar mesa?")) setMesas(mesas.filter(m => m.id !== id)); };
  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  const guardarPedido = (datos) => { if (pedidoAEditar) setPedidosPasteleria(pedidosPasteleria.map(p => p.folio === datos.folio ? datos : p)); else setPedidosPasteleria([...pedidosPasteleria, datos]); if(modo === 'pasteleria') setVistaActual('inicio'); };
  const registrarPago = (folio, esLiquidacion) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, pagosRealizados: esLiquidacion ? p.numPagos : (p.pagosRealizados || 0) + 1 }; return p; }); setPedidosPasteleria(nuevos); if(pedidoVerDetalles && pedidoVerDetalles.folio === folio) setPedidoVerDetalles(nuevos.find(p=>p.folio===folio)); mostrarNotificacion("Pago registrado", "exito"); };
  const toggleEstadoPedido = (folio) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, estado: p.estado === 'Pendiente' ? 'Entregado' : 'Pendiente' }; return p; }); setPedidosPasteleria(nuevos); mostrarNotificacion("Estado actualizado", "info"); };
  const iniciarCancelacion = (folio) => setPedidoACancelar(folio);
  const confirmarCancelacion = () => { if(!pedidoACancelar) return; const nuevos = pedidosPasteleria.map(p => { if(p.folio === pedidoACancelar) return { ...p, estado: 'Cancelado' }; return p; }); setPedidosPasteleria(nuevos); setPedidoACancelar(null); };

  // Helper para volver al admin desde el modo cliente
  const salirModoCliente = () => {
      setModo('cafeteria');
      setClienteMesaId(null);
  };

  // RENDERIZADO CONDICIONAL PRINCIPAL
  if (modo === 'cliente-simulado') {
      const mesaObj = mesas.find(m => m.id === clienteMesaId);
      return (
          <VistaCliente 
              mesa={mesaObj} 
              productos={productosCafeteria} 
              onRealizarPedido={recibirPedidoCliente} 
              onSalir={salirModoCliente}
          />
      );
  }

  // RENDERIZADO NORMAL (ADMIN/STAFF)
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans transition-colors duration-500">
      <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
      <Sidebar modo={modo} vistaActual={vistaActual} setVistaActual={setVistaActual} setModo={setModo} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 overflow-y-auto h-screen relative">
        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="absolute top-4 left-4 z-50 p-2 bg-pink-600 text-white rounded-lg shadow-lg hover:bg-pink-700 transition-all animate-fade-in-up"><Menu size={24} /></button>}

        {modo === 'admin' && (
          <>
            {vistaActual === 'inicio' && <VistaInicioAdmin pedidos={pedidosPasteleria} ventasCafeteria={ventasCafeteria} />}
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={ventasCafeteria} modo="admin" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
          </>
        )}
        {modo === 'pasteleria' && (
          <>
            {vistaActual === 'inicio' && <VistaInicioPasteleria pedidos={pedidosPasteleria} onEditar={(p) => { setPedidoAEditar(p); setVistaActual('pedidos'); }} onVerDetalles={(p) => setPedidoVerDetalles(p)} onToggleEstado={toggleEstadoPedido} onCancelar={iniciarCancelacion} />}
            {vistaActual === 'pedidos' && <VistaNuevoPedido pedidos={pedidosPasteleria} onGuardarPedido={guardarPedido} generarFolio={generarFolio} pedidoAEditar={pedidoAEditar} mostrarNotificacion={mostrarNotificacion} />}
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={[]} modo="pasteleria" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
          </>
        )}
        {modo === 'cafeteria' && (
          <>
            {/* Agregamos un botón flotante temporal para SIMULAR que somos un cliente escaneando un QR, para pruebas */}
            {vistaActual === 'mesas' && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-50 max-w-xs">
                    <p className="text-xs font-bold mb-2 uppercase text-gray-400">Modo Pruebas (Simulación)</p>
                    <p className="text-sm mb-2">Selecciona una mesa para simular que eres un cliente escaneando su QR:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {mesas.map(m => (
                            <button key={m.id} onClick={() => simularEscaneoQR(m.id)} className="bg-white text-gray-900 text-xs font-bold py-2 rounded hover:bg-orange-100 flex items-center justify-center gap-1">
                                <Smartphone size={12}/> {m.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {vistaActual === 'inicio' && <VistaInicioCafeteria mesas={mesas} pedidosLlevar={sesionesLlevar} onSeleccionarMesa={abrirHubMesa} onCrearLlevar={crearSesionLlevar} onAbrirLlevar={abrirPOSLlevar} />}
            {vistaActual === 'menu' && <VistaMenuCafeteria productos={productosCafeteria} onGuardarProducto={guardarProductoCafeteria} />}
            {vistaActual === 'mesas' && <VistaGestionMesas mesas={mesas} onAgregarMesa={agregarMesa} onEliminarMesa={eliminarMesa} />}
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={[]} ventasCafeteria={ventasCafeteria} modo="cafeteria" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
          </>
        )}
      </main>
      
      {/* Vistas superpuestas (Hub Mesa, POS, Modales) */}
      {mesaSeleccionadaId && !cuentaActiva && (
        <VistaHubMesa 
            mesa={mesaSeleccionadaObj} 
            onVolver={() => setMesaSeleccionadaId(null)} 
            onAbrirCuenta={abrirPOSCuentaMesa} 
            onCrearCuenta={(id, nombre) => crearCuentaEnMesa(id, nombre.toUpperCase())} 
            onUnirCuentas={unirCuentas}
        />
      )}

      {cuentaActiva && (
        <VistaDetalleCuenta 
            sesion={cuentaActiva} 
            productos={productosCafeteria} 
            onCerrar={() => setCuentaActiva(null)} 
            onAgregarProducto={agregarProductoASesion} 
            onPagarCuenta={pagarCuenta} 
        />
      )}

      <ModalDetalles pedido={pedidoVerDetalles} cerrar={() => setPedidoVerDetalles(null)} onRegistrarPago={registrarPago} />
      {datosModalDia && <ModalVentasDia dia={datosModalDia.dia} mes={datosModalDia.mes} anio={datosModalDia.anio} ventas={datosModalDia.ventas} cerrar={() => setDatosModalDia(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}
      <ModalConfirmacion isOpen={!!pedidoACancelar} onClose={() => setPedidoACancelar(null)} onConfirm={confirmarCancelacion} />
    </div>
  );
}