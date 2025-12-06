import React, { useState, useMemo, useEffect } from 'react';
import { Smartphone, ShoppingBag } from 'lucide-react';

import { PRODUCTOS_CAFETERIA_INIT, MESAS_FISICAS_INIT, SESIONES_LLEVAR_INIT, VENTAS_CAFETERIA_INIT, PEDIDOS_PASTELERIA_INIT, getFechaHoy } from './utils/config';
import { Notificacion, LayoutConSidebar, ModalDetalles, ModalVentasDia, ModalConfirmacion, ModalAgendaDia } from './components/Shared';
import { VistaInicioPasteleria, VistaNuevoPedido, VistaCalendarioPasteleria } from './features/Pasteleria';
import { VistaInicioCafeteria, VistaMenuCafeteria, VistaGestionMesas, VistaDetalleCuenta, VistaHubMesa } from './features/Cafeteria';
import { VistaInicioAdmin, VistaReporteUniversal } from './features/Admin';
import { VistaCliente } from './features/Cliente';
import { VistaLogin } from './components/Login'; // Asegúrate de que este archivo existe

// --- COMPONENTE PRINCIPAL (APP) ---
export default function PasteleriaApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [modo, setModo] = useState('admin');
  const [vistaActual, setVistaActual] = useState('inicio');

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
  const [pedidoARestaurar, setPedidoARestaurar] = useState(null);
  const [pedidoAEntregar, setPedidoAEntregar] = useState(null);
  
  // NAVEGACIÓN CAFETERÍA
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null); 
  const [cuentaActiva, setCuentaActiva] = useState(null); 
  const [clienteMesaId, setClienteMesaId] = useState(null);
  
  const ID_QR_LLEVAR = 'QR_LLEVAR';
  const [fechaAgendaSeleccionada, setFechaAgendaSeleccionada] = useState(null);

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { 
    setNotificacion({ visible: true, mensaje, tipo }); 
    setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); 
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setModo('admin'); 
      setVistaActual('inicio'); 
      mostrarNotificacion("Sesión cerrada correctamente", "info");
  };

  // Efecto para limpiar papeleras
  useEffect(() => {
    const limpiarPapelera = () => {
        const ahora = new Date();
        const horasLimite = 48;
        setPedidosPasteleria(prevPedidos => {
            return prevPedidos.filter(p => {
                if (p.estado !== 'Cancelado') return true;
                if (!p.fechaCancelacion) return false;
                const fechaCancelacion = new Date(p.fechaCancelacion);
                const diferenciaHoras = (ahora - fechaCancelacion) / (1000 * 60 * 60);
                return diferenciaHoras < horasLimite;
            });
        });
    };
    limpiarPapelera();
    const intervalo = setInterval(limpiarPapelera, 60000); 
    return () => clearInterval(intervalo);
  }, []);

  const guardarProductoCafeteria = (prod) => { 
    if (prod.id) {
      setProductosCafeteria(productosCafeteria.map(p => p.id === prod.id ? prod : p));
    } else {
      setProductosCafeteria([...productosCafeteria, { ...prod, id: Date.now() }]);
    }
  };
  
  const eliminarProductoCafeteria = (id) => { 
    setProductosCafeteria(prev => prev.filter(p => p.id !== id)); 
    mostrarNotificacion("Producto eliminado correctamente", "info"); 
  };
  
  const agregarMesa = () => { 
    setMesas([...mesas, { 
      id: `M${mesas.length + 1}`, 
      nombre: `Mesa ${mesas.length + 1}`, 
      tipo: 'mesa', 
      estado: 'Libre', 
      cuentas: [] 
    }]); 
  };
  
  const eliminarMesa = (id) => { 
    setMesas(mesas.filter(m => m.id !== id)); 
    mostrarNotificacion("Mesa eliminada", "info"); 
  };
  
  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  
  const guardarPedido = (datos) => { 
    if (pedidoAEditar) {
      setPedidosPasteleria(pedidosPasteleria.map(p => p.folio === datos.folio ? datos : p));
    } else {
      setPedidosPasteleria([...pedidosPasteleria, datos]);
    }
    if(modo === 'pasteleria') setVistaActual('inicio');
    setPedidoAEditar(null);
  };
  
  const registrarPago = (folio, esLiquidacion) => { 
    const nuevos = pedidosPasteleria.map(p => { 
      if(p.folio === folio) return { 
        ...p, 
        pagosRealizados: esLiquidacion ? p.numPagos : (p.pagosRealizados || 0) + 1 
      }; 
      return p; 
    }); 
    setPedidosPasteleria(nuevos);
    if(pedidoVerDetalles && pedidoVerDetalles.folio === folio) {
      setPedidoVerDetalles(nuevos.find(p=>p.folio===folio));
    }
    mostrarNotificacion("Pago registrado", "exito"); 
  };
  
  const abrirHubMesa = (idMesa) => setMesaSeleccionadaId(idMesa);
  
  const crearCuentaEnMesa = (idMesa, nombreCliente, itemsIniciales = []) => { 
    const totalInicial = itemsIniciales.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0); 
    const nuevaCuenta = { 
      id: `C-${Date.now().toString().slice(-4)}`, 
      cliente: nombreCliente, 
      cuenta: itemsIniciales, 
      total: totalInicial 
    }; 
    setMesas(prevMesas => prevMesas.map(m => 
      m.id === idMesa 
        ? { ...m, cuentas: [...m.cuentas, nuevaCuenta] } 
        : m
    )); 
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
  
  const recibirPedidoCliente = (idMesa, nombre, carrito, telefono = '') => { 
    if (idMesa === ID_QR_LLEVAR) {
      const sesionExistente = sesionesLlevar.find(s => s.nombreCliente === nombre);
      if (sesionExistente) {
        setSesionesLlevar(prev => prev.map(s => {
          if (s.id === sesionExistente.id) {
            const nuevosItems = [...s.cuenta, ...carrito];
            const nuevoTotal = nuevosItems.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
            return { ...s, cuenta: nuevosItems, total: nuevoTotal };
          }
          return s;
        }));
        mostrarNotificacion(`Agregado a tu pedido para llevar, ${nombre}`, "info");
      } else {
        const totalInicial = carrito.reduce((acc, i) => acc + (i.precio * (i.cantidad || 1)), 0);
        const nuevaSesion = {
          id: `L-${Date.now().toString().slice(-4)}`,
          tipo: 'llevar',
          nombreCliente: nombre,
          telefono: telefono, 
          cuenta: carrito,
          total: totalInicial,
          estado: 'Activa'
        };
        setSesionesLlevar([...sesionesLlevar, nuevaSesion]);
        mostrarNotificacion(`Nuevo pedido para llevar: ${nombre}`, "exito");
      }
    } else {
      const mesa = mesas.find(m => m.id === idMesa);
      const cuentaExistente = mesa.cuentas.find(c => c.cliente === nombre);
      if (cuentaExistente) { 
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
        crearCuentaEnMesa(idMesa, nombre, carrito); 
        mostrarNotificacion(`Nuevo pedido recibido: Mesa ${mesa.nombre} - ${nombre}`, "exito"); 
      }
    }
  };

  const simularEscaneoQR = (idMesa) => { 
    setClienteMesaId(idMesa); 
    setModo('cliente-simulado'); 
  };
  
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
  
  const agregarProductoASesion = (idSesion, producto) => { 
    if (cuentaActiva.tipo === 'mesa') { 
      setMesas(mesas.map(m => { 
        if (m.id === cuentaActiva.idMesa) { 
          const nuevasCuentas = m.cuentas.map(c => { 
            if (c.id === cuentaActiva.id) { 
              const items = [...c.cuenta, producto];
              const total = items.reduce((acc, i) => acc + i.precio, 0);
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
      setSesionesLlevar(sesionesLlevar.map(s => { 
        if (s.id === idSesion) { 
          const items = [...s.cuenta, producto];
          setCuentaActiva(prev => ({...prev, cuenta: items, total: items.reduce((a,b)=>a+b.precio,0)}));
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

  const mesaSeleccionadaObj = useMemo(() => mesas.find(m => m.id === mesaSeleccionadaId), [mesas, mesaSeleccionadaId]);

  const iniciarCancelacion = (folio) => setPedidoACancelar(folio);
  
  const confirmarCancelacion = () => { 
    if(!pedidoACancelar) return; 
    const nuevos = pedidosPasteleria.map(p => { 
      if(p.folio === pedidoACancelar) { 
        return { ...p, estado: 'Cancelado', fechaCancelacion: new Date().toISOString() }; 
      } 
      return p; 
    }); 
    setPedidosPasteleria(nuevos); 
    setPedidoACancelar(null); 
    mostrarNotificacion("Pedido enviado a Papelera.", "info"); 
  };
  
  const iniciarRestauracion = (folio) => setPedidoARestaurar(folio);
  
  const confirmarRestauracion = () => { 
    if(!pedidoARestaurar) return; 
    const nuevos = pedidosPasteleria.map(p => { 
      if(p.folio === pedidoARestaurar) { 
        const { fechaCancelacion, ...resto } = p; 
        return { ...resto, estado: 'Pendiente' }; 
      } 
      return p; 
    }); 
    setPedidosPasteleria(nuevos); 
    setPedidoARestaurar(null); 
    mostrarNotificacion("Pedido restaurado correctamente.", "exito"); 
  };
  
  const iniciarEntrega = (folio) => setPedidoAEntregar(folio);
  
  const confirmarEntrega = () => { 
    if(!pedidoAEntregar) return; 
    const nuevos = pedidosPasteleria.map(p => { 
      if(p.folio === pedidoAEntregar) return { ...p, estado: 'Entregado' }; 
      return p; 
    }); 
    setPedidosPasteleria(nuevos); 
    setPedidoAEntregar(null); 
    mostrarNotificacion("¡Pedido entregado con éxito!", "exito"); 
  };
  
  const restaurarDeEntregados = (folio) => { 
    const nuevos = pedidosPasteleria.map(p => { 
      if(p.folio === folio) return { ...p, estado: 'Pendiente' }; 
      return p; 
    }); 
    setPedidosPasteleria(nuevos); 
    mostrarNotificacion("Pedido regresado a Pendientes", "info"); 
  };

  const salirModoCliente = () => { 
    setModo('cafeteria'); 
    setClienteMesaId(null); 
  };

  // SI NO ESTÁ AUTENTICADO, MOSTRAR LOGIN
  if (!isAuthenticated) {
    return (
      <>
        <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
        <VistaLogin onLogin={() => { 
          setIsAuthenticated(true); 
          mostrarNotificacion("¡Bienvenido Admin!", "exito"); 
        }} />
      </>
    );
  }

  // MODO CLIENTE SIMULADO
  if (modo === 'cliente-simulado') {
    let mesaObj;
    if (clienteMesaId === ID_QR_LLEVAR) {
      const cuentasAdaptadas = sesionesLlevar.map(s => ({ ...s, cliente: s.nombreCliente }));
      mesaObj = { id: ID_QR_LLEVAR, nombre: 'Para Llevar (Mostrador)', cuentas: cuentasAdaptadas };
    } else { 
      mesaObj = mesas.find(m => m.id === clienteMesaId); 
    }
    return ( 
      <VistaCliente 
        mesa={mesaObj} 
        productos={productosCafeteria} 
        onRealizarPedido={recibirPedidoCliente} 
        onSalir={salirModoCliente} 
      /> 
    );
  }

  // CONTENIDO PRINCIPAL CON LAYOUT RESPONSIVE
  const contenidoPrincipal = (
    <>
      <Notificacion data={notificacion} onClose={() => setNotificacion({ ...notificacion, visible: false })} />
      
      {modo === 'admin' && (
        <>
          {vistaActual === 'inicio' && <VistaInicioAdmin pedidos={pedidosPasteleria} ventasCafeteria={ventasCafeteria} />}
          {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={pedidosPasteleria} ventasCafeteria={ventasCafeteria} modo="admin" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
        </>
      )}
      
      {modo === 'pasteleria' && (
        <>
          {vistaActual === 'inicio' && (
            <VistaInicioPasteleria 
              pedidos={pedidosPasteleria} 
              onEditar={(p) => { setPedidoAEditar(p); setVistaActual('pedidos'); }} 
              onVerDetalles={(p) => setPedidoVerDetalles(p)} 
              onIniciarEntrega={iniciarEntrega} 
              onCancelar={iniciarCancelacion} 
              onRestaurar={iniciarRestauracion} 
              onDeshacerEntrega={restaurarDeEntregados} 
            />
          )}
          {vistaActual === 'pedidos' && (
            <VistaNuevoPedido 
              pedidos={pedidosPasteleria} 
              onGuardarPedido={guardarPedido} 
              generarFolio={generarFolio} 
              pedidoAEditar={pedidoAEditar} 
              mostrarNotificacion={mostrarNotificacion} 
            />
          )}
          {vistaActual === 'agenda' && (
            <VistaCalendarioPasteleria 
              pedidos={pedidosPasteleria} 
              onSeleccionarDia={(fechaIso) => setFechaAgendaSeleccionada(fechaIso)} 
            />
          )}
          {vistaActual === 'ventas' && (
            <VistaReporteUniversal 
              pedidosPasteleria={pedidosPasteleria} 
              ventasCafeteria={[]} 
              modo="pasteleria" 
              onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} 
            />
          )}
        </>
      )}
      
      {modo === 'cafeteria' && (
        <>
          {vistaActual === 'inicio' && (
            <VistaInicioCafeteria 
              mesas={mesas} 
              pedidosLlevar={sesionesLlevar} 
              onSeleccionarMesa={abrirHubMesa} 
              onCrearLlevar={crearSesionLlevar} 
              onAbrirLlevar={abrirPOSLlevar} 
            />
          )}
          {vistaActual === 'menu' && (
            <VistaMenuCafeteria 
              productos={productosCafeteria} 
              onGuardarProducto={guardarProductoCafeteria} 
              onEliminarProducto={eliminarProductoCafeteria} 
            />
          )}
          {vistaActual === 'mesas' && (
            <>
              <VistaGestionMesas 
                mesas={mesas} 
                onAgregarMesa={agregarMesa} 
                onEliminarMesa={eliminarMesa} 
              />
              {/* Panel de simulación QR para móviles */}
              <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-50 max-w-xs animate-fade-in-up md:hidden">
                <p className="text-xs font-bold mb-2 uppercase text-gray-400">Modo Pruebas (Simulación)</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {mesas.slice(0, 4).map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => simularEscaneoQR(m.id)} 
                      className="bg-white text-gray-900 text-xs font-bold py-2 rounded hover:bg-orange-100 flex items-center justify-center gap-1 transition"
                    >
                      <Smartphone size={12}/> {m.nombre}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => simularEscaneoQR(ID_QR_LLEVAR)} 
                  className="w-full bg-orange-600 text-white text-xs font-bold py-2 rounded hover:bg-orange-700 flex items-center justify-center gap-1 transition shadow-lg"
                >
                  <ShoppingBag size={12}/> Simular QR Para Llevar
                </button>
              </div>
            </>
          )}
          {vistaActual === 'ventas' && (
            <VistaReporteUniversal 
              pedidosPasteleria={[]} 
              ventasCafeteria={ventasCafeteria} 
              modo="cafeteria" 
              onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} 
            />
          )}
        </>
      )}
      
      {/* Modales flotantes */}
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
      
      <ModalDetalles 
        pedido={pedidoVerDetalles} 
        cerrar={() => setPedidoVerDetalles(null)} 
        onRegistrarPago={registrarPago} 
      />
      
      {datosModalDia && (
        <ModalVentasDia 
          dia={datosModalDia.dia} 
          mes={datosModalDia.mes} 
          anio={datosModalDia.anio} 
          ventas={datosModalDia.ventas} 
          cerrar={() => setDatosModalDia(null)} 
          onVerDetalle={(item) => setPedidoVerDetalles(item)} 
        />
      )}
      
      {fechaAgendaSeleccionada && (
        <ModalAgendaDia 
          fechaIso={fechaAgendaSeleccionada} 
          pedidos={pedidosPasteleria} 
          cerrar={() => setFechaAgendaSeleccionada(null)} 
          onVerDetalle={(item) => setPedidoVerDetalles(item)} 
        />
      )}

      <ModalConfirmacion 
        isOpen={!!pedidoACancelar} 
        onClose={() => setPedidoACancelar(null)} 
        onConfirm={confirmarCancelacion} 
        titulo="¿Cancelar Pedido?" 
        mensaje="El pedido se enviará a la Papelera. Podrás restaurarlo durante las próximas 48 horas." 
      />
      
      <ModalConfirmacion 
        isOpen={!!pedidoARestaurar} 
        onClose={() => setPedidoARestaurar(null)} 
        onConfirm={confirmarRestauracion} 
        titulo="¿Restaurar Pedido?" 
        mensaje="El pedido volverá a la lista de 'Pendientes'." 
      />
      
      <ModalConfirmacion 
        isOpen={!!pedidoAEntregar} 
        onClose={() => setPedidoAEntregar(null)} 
        onConfirm={confirmarEntrega} 
        titulo="¿Confirmar Entrega?" 
        mensaje="El pedido se marcará como entregado y desaparecerá de la lista de pendientes. Podrás verlo en 'Entregados Hoy'." 
      />
    </>
  );

  return (
    <LayoutConSidebar
      modo={modo}
      vistaActual={vistaActual}
      setVistaActual={setVistaActual}
      setModo={setModo}
      onLogout={handleLogout}
    >
      {contenidoPrincipal}
    </LayoutConSidebar>
  );
}