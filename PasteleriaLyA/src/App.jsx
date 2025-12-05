import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Smartphone } from 'lucide-react';

import { PRODUCTOS_CAFETERIA_INIT, MESAS_FISICAS_INIT, SESIONES_LLEVAR_INIT, VENTAS_CAFETERIA_INIT, PEDIDOS_PASTELERIA_INIT, getFechaHoy } from './utils/config';
import { Notificacion, Sidebar, ModalDetalles, ModalVentasDia, ModalConfirmacion } from './components/Shared';
import { VistaInicioPasteleria, VistaNuevoPedido, VistaCalendarioPasteleria } from './features/Pasteleria';
import { VistaInicioCafeteria, VistaMenuCafeteria, VistaGestionMesas, VistaDetalleCuenta, VistaHubMesa, ModalQR, ModalNuevoLlevar, ModalProducto } from './features/Cafeteria';
import { VistaInicioAdmin, VistaReporteUniversal } from './features/Admin';
import { VistaCliente } from './features/Cliente';

export default function PasteleriaApp() {
  const [modo, setModo] = useState('admin');
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
  const [pedidoARestaurar, setPedidoARestaurar] = useState(null); // Nuevo estado para confirmar restauración
  
  // NAVEGACIÓN CAFETERÍA
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null); 
  const [cuentaActiva, setCuentaActiva] = useState(null); 
  const [clienteMesaId, setClienteMesaId] = useState(null);
  
  // ESTADO EXTRA: Modal de Agenda
  const [fechaAgendaSeleccionada, setFechaAgendaSeleccionada] = useState(null);

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { setNotificacion({ visible: true, mensaje, tipo }); setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); };

  // --- LÓGICA DE LIMPIEZA AUTOMÁTICA (48 HORAS) ---
  useEffect(() => {
    const limpiarPapelera = () => {
        const ahora = new Date();
        const horasLimite = 48;
        
        setPedidosPasteleria(prevPedidos => {
            // Filtramos los pedidos que NO sean cancelados O que hayan sido cancelados hace menos de 48h
            return prevPedidos.filter(p => {
                if (p.estado !== 'Cancelado') return true;
                if (!p.fechaCancelacion) return false; // Si es cancelado y no tiene fecha, se borra por seguridad
                
                const fechaCancelacion = new Date(p.fechaCancelacion);
                const diferenciaHoras = (ahora - fechaCancelacion) / (1000 * 60 * 60);
                
                return diferenciaHoras < horasLimite;
            });
        });
    };

    // Ejecutar al iniciar y cada minuto (para pruebas o producción)
    limpiarPapelera();
    const intervalo = setInterval(limpiarPapelera, 60000); 
    return () => clearInterval(intervalo);
  }, []);


  // --- LÓGICA DE MESAS Y CUENTAS ---
  const abrirHubMesa = (idMesa) => setMesaSeleccionadaId(idMesa);

  const crearCuentaEnMesa = (idMesa, nombreCliente, itemsIniciales = []) => {
    const totalInicial = itemsIniciales.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
    const nuevaCuenta = { id: `C-${Date.now().toString().slice(-4)}`, cliente: nombreCliente, cuenta: itemsIniciales, total: totalInicial };
    setMesas(prevMesas => prevMesas.map(m => m.id === idMesa ? { ...m, cuentas: [...m.cuentas, nuevaCuenta] } : m));
    return nuevaCuenta; 
  };

  const unirCuentas = (idMesa, idCuentaDestino, idsCuentasOrigen) => {
      setMesas(mesas.map(m => {
          if (m.id === idMesa) {
              const destino = m.cuentas.find(c => c.id === idCuentaDestino);
              const origenes = m.cuentas.filter(c => idsCuentasOrigen.includes(c.id));
              let nuevosItems = [...destino.cuenta];
              origenes.forEach(o => { nuevosItems = [...nuevosItems, ...o.cuenta]; });
              const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
              const cuentasActualizadas = m.cuentas.filter(c => !idsCuentasOrigen.includes(c.id)).map(c => c.id === idCuentaDestino ? { ...c, cuenta: nuevosItems, total: nuevoTotal } : c);
              return { ...m, cuentas: cuentasActualizadas };
          }
          return m;
      }));
      mostrarNotificacion("Cuentas unificadas correctamente");
  };

  const abrirPOSCuentaMesa = (idMesa, idCuenta) => {
    const mesa = mesas.find(m => m.id === idMesa);
    const cuenta = mesa.cuentas.find(c => c.id === idCuenta);
    setCuentaActiva({ tipo: 'mesa', id: idCuenta, idMesa: idMesa, nombreMesa: mesa.nombre, cliente: cuenta.cliente, cuenta: cuenta.cuenta, total: cuenta.total });
  };

  const recibirPedidoCliente = (idMesa, nombre, carrito) => {
      const mesa = mesas.find(m => m.id === idMesa);
      const cuentaExistente = mesa.cuentas.find(c => c.cliente === nombre);
      if (cuentaExistente) {
          setMesas(prev => prev.map(m => {
              if (m.id === idMesa) {
                  return { ...m, cuentas: m.cuentas.map(c => { if (c.id === cuentaExistente.id) { const nuevosItems = [...c.cuenta, ...carrito]; const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); return { ...c, cuenta: nuevosItems, total: nuevoTotal }; } return c; }) };
              }
              return m;
          }));
          mostrarNotificacion(`Pedido agregado a cuenta de ${nombre}`, "info");
      } else {
          crearCuentaEnMesa(idMesa, nombre, carrito);
          mostrarNotificacion(`Nuevo pedido recibido: Mesa ${mesa.nombre} - ${nombre}`, "exito");
      }
  };

  const simularEscaneoQR = (idMesa) => { setClienteMesaId(idMesa); setModo('cliente-simulado'); };

  const crearSesionLlevar = (datosCliente) => {
    const nuevaSesion = { id: `L-${Date.now().toString().slice(-4)}`, tipo: 'llevar', nombreCliente: datosCliente.nombre, telefono: datosCliente.telefono, cuenta: [], estado: 'Activa' };
    setSesionesLlevar([...sesionesLlevar, nuevaSesion]);
    mostrarNotificacion("Pedido Para Llevar iniciado", "exito");
    setCuentaActiva(nuevaSesion);
  };

  const abrirPOSLlevar = (idPedido) => { const pedido = sesionesLlevar.find(p => p.id === idPedido); if(pedido) setCuentaActiva(pedido); };

  const agregarProductoASesion = (idSesion, producto) => {
    if (cuentaActiva.tipo === 'mesa') {
        setMesas(mesas.map(m => { if (m.id === cuentaActiva.idMesa) { const nuevasCuentas = m.cuentas.map(c => { if (c.id === cuentaActiva.id) { const items = [...c.cuenta, producto]; const total = items.reduce((acc, i) => acc + i.precio, 0); setCuentaActiva(prev => ({...prev, cuenta: items, total})); return { ...c, cuenta: items, total }; } return c; }); return { ...m, cuentas: nuevasCuentas }; } return m; }));
    } else {
        setSesionesLlevar(sesionesLlevar.map(s => { if (s.id === idSesion) { const items = [...s.cuenta, producto]; setCuentaActiva(prev => ({...prev, cuenta: items, total: items.reduce((a,b)=>a+b.precio,0)})); return { ...s, cuenta: items }; } return s; }));
    }
    mostrarNotificacion(`${producto.nombre} agregado`, "info");
  };

  const pagarCuenta = (sesion) => {
    const total = sesion.cuenta.reduce((acc, p) => acc + p.precio, 0);
    const nuevaVenta = { id: `T-${Date.now().toString().slice(-6)}`, fecha: getFechaHoy(), hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), total: total, items: sesion.cuenta.length, cliente: sesion.tipo === 'mesa' ? `${sesion.nombreMesa} - ${sesion.cliente}` : `${sesion.nombreCliente} (Llevar)`, origen: 'Cafetería' };
    setVentasCafeteria([...ventasCafeteria, nuevaVenta]);
    if (sesion.tipo === 'mesa') { setMesas(mesas.map(m => { if(m.id === sesion.idMesa) { return { ...m, cuentas: m.cuentas.filter(c => c.id !== sesion.id) }; } return m; })); setCuentaActiva(null); } 
    else { setSesionesLlevar(sesionesLlevar.filter(s => s.id !== sesion.id)); setCuentaActiva(null); }
    mostrarNotificacion(`Cuenta pagada. Ticket: ${nuevaVenta.id}`, "exito");
  };

  const mesaSeleccionadaObj = useMemo(() => mesas.find(m => m.id === mesaSeleccionadaId), [mesas, mesaSeleccionadaId]);

  // --- FUNCIONES GENERALES ---
  const guardarProductoCafeteria = (prod) => { if (prod.id) setProductosCafeteria(productosCafeteria.map(p => p.id === prod.id ? prod : p)); else setProductosCafeteria([...productosCafeteria, { ...prod, id: Date.now() }]); };
  const agregarMesa = () => { setMesas([...mesas, { id: `M${mesas.length + 1}`, nombre: `Mesa ${mesas.length + 1}`, tipo: 'mesa', estado: 'Libre', cuentas: [] }]); };
  const eliminarMesa = (id) => { if(window.confirm("¿Eliminar mesa?")) setMesas(mesas.filter(m => m.id !== id)); };
  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  const guardarPedido = (datos) => { if (pedidoAEditar) setPedidosPasteleria(pedidosPasteleria.map(p => p.folio === datos.folio ? datos : p)); else setPedidosPasteleria([...pedidosPasteleria, datos]); if(modo === 'pasteleria') setVistaActual('inicio'); };
  const registrarPago = (folio, esLiquidacion) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, pagosRealizados: esLiquidacion ? p.numPagos : (p.pagosRealizados || 0) + 1 }; return p; }); setPedidosPasteleria(nuevos); if(pedidoVerDetalles && pedidoVerDetalles.folio === folio) setPedidoVerDetalles(nuevos.find(p=>p.folio===folio)); mostrarNotificacion("Pago registrado", "exito"); };
  const toggleEstadoPedido = (folio) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, estado: p.estado === 'Pendiente' ? 'Entregado' : 'Pendiente' }; return p; }); setPedidosPasteleria(nuevos); mostrarNotificacion("Estado actualizado", "info"); };
  
  // --- NUEVA LÓGICA DE CANCELAR Y RESTAURAR ---
  const iniciarCancelacion = (folio) => setPedidoACancelar(folio);
  
  const confirmarCancelacion = () => { 
      if(!pedidoACancelar) return; 
      const nuevos = pedidosPasteleria.map(p => { 
          if(p.folio === pedidoACancelar) {
              return { 
                  ...p, 
                  estado: 'Cancelado', 
                  fechaCancelacion: new Date().toISOString() // Marca de tiempo para el borrado en 48h
              }; 
          }
          return p; 
      }); 
      setPedidosPasteleria(nuevos); 
      setPedidoACancelar(null); 
      
      // Mensaje importante al usuario
      mostrarNotificacion("Pedido enviado a Papelera. Se eliminará permanentemente en 48 hrs.", "info");
  };

  const iniciarRestauracion = (folio) => setPedidoARestaurar(folio);

  const confirmarRestauracion = () => {
      if(!pedidoARestaurar) return;
      const nuevos = pedidosPasteleria.map(p => {
          if(p.folio === pedidoARestaurar) {
              // Quitar la marca de cancelación y volver a pendiente
              const { fechaCancelacion, ...resto } = p; 
              return { ...resto, estado: 'Pendiente' };
          }
          return p;
      });
      setPedidosPasteleria(nuevos);
      setPedidoARestaurar(null);
      mostrarNotificacion("Pedido restaurado correctamente.", "exito");
  };


  const salirModoCliente = () => { setModo('cafeteria'); setClienteMesaId(null); };

  if (modo === 'cliente-simulado') {
      const mesaObj = mesas.find(m => m.id === clienteMesaId);
      return ( <VistaCliente mesa={mesaObj} productos={productosCafeteria} onRealizarPedido={recibirPedidoCliente} onSalir={salirModoCliente} /> );
  }

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
            {/* Pasamos las nuevas funciones de restaurar a la vista */}
            {vistaActual === 'inicio' && <VistaInicioPasteleria pedidos={pedidosPasteleria} onEditar={(p) => { setPedidoAEditar(p); setVistaActual('pedidos'); }} onVerDetalles={(p) => setPedidoVerDetalles(p)} onToggleEstado={toggleEstadoPedido} onCancelar={iniciarCancelacion} onRestaurar={iniciarRestauracion} />}
            {vistaActual === 'pedidos' && <VistaNuevoPedido pedidos={pedidosPasteleria} onGuardarPedido={guardarPedido} generarFolio={generarFolio} pedidoAEditar={pedidoAEditar} mostrarNotificacion={mostrarNotificacion} />}
            {vistaActual === 'agenda' && <VistaCalendarioPasteleria pedidos={pedidosPasteleria} onSeleccionarDia={(fechaIso) => setFechaAgendaSeleccionada(fechaIso)} />}
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={[]} modo="pasteleria" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
          </>
        )}
        {modo === 'cafeteria' && (
          <>
            {vistaActual === 'mesas' && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-50 max-w-xs">
                    <p className="text-xs font-bold mb-2 uppercase text-gray-400">Modo Pruebas (Simulación)</p>
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
      
      {/* MODALES */}
      {mesaSeleccionadaId && !cuentaActiva && <VistaHubMesa mesa={mesaSeleccionadaObj} onVolver={() => setMesaSeleccionadaId(null)} onAbrirCuenta={abrirPOSCuentaMesa} onCrearCuenta={(id, nombre) => crearCuentaEnMesa(id, nombre.toUpperCase())} onUnirCuentas={unirCuentas} />}
      {cuentaActiva && <VistaDetalleCuenta sesion={cuentaActiva} productos={productosCafeteria} onCerrar={() => setCuentaActiva(null)} onAgregarProducto={agregarProductoASesion} onPagarCuenta={pagarCuenta} />}
      <ModalDetalles pedido={pedidoVerDetalles} cerrar={() => setPedidoVerDetalles(null)} onRegistrarPago={registrarPago} />
      {datosModalDia && <ModalVentasDia dia={datosModalDia.dia} mes={datosModalDia.mes} anio={datosModalDia.anio} ventas={datosModalDia.ventas} cerrar={() => setDatosModalDia(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}
      {fechaAgendaSeleccionada && <ModalAgendaDia fechaIso={fechaAgendaSeleccionada} pedidos={pedidosPasteleria} cerrar={() => setFechaAgendaSeleccionada(null)} onVerDetalle={(item) => setPedidoVerDetalles(item)} />}

      {/* CONFIRMACIÓN DE CANCELAR */}
      <ModalConfirmacion 
          isOpen={!!pedidoACancelar} 
          onClose={() => setPedidoACancelar(null)} 
          onConfirm={confirmarCancelacion} 
          titulo="¿Cancelar Pedido?"
          mensaje="El pedido se enviará a la Papelera. Podrás restaurarlo durante las próximas 48 horas. Después de eso, se eliminará permanentemente."
      />

      {/* NUEVA CONFIRMACIÓN DE RESTAURAR */}
      <ModalConfirmacion 
          isOpen={!!pedidoARestaurar} 
          onClose={() => setPedidoARestaurar(null)} 
          onConfirm={confirmarRestauracion} 
          titulo="¿Restaurar Pedido?"
          mensaje="El pedido volverá a la lista de 'Pendientes' y el cobro se reactivará en los reportes."
      />
    </div>
  );
}