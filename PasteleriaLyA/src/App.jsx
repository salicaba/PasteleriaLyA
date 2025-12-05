import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Coffee,
  PlusCircle,
  User,
  Phone,
  DollarSign,
  CheckCircle,
  Clock,
  Edit,
  Calculator,
  Eye,
  X,
  CreditCard,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Cake,
  ArrowLeft,
  UtensilsCrossed,
  Trash2,
  CalendarDays,
  Menu,
  PanelLeftClose,
  Grid,
  ZoomIn,
  Save,
  Upload,
  QrCode,
  Smartphone,
  Receipt,
  LogOut,
  Filter
} from 'lucide-react';

// --- HELPER DE FECHAS (ROBUSTO) ---
const getFechaHoy = () => {
    const d = new Date();
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    const fechaStr = local.toISOString().slice(0, 10);
    return fechaStr < '2025-12-01' ? '2025-12-01' : fechaStr;
};

const formatearFechaLocal = (fechaString) => {
  if (!fechaString) return '-';
  const parts = fechaString.split('-'); 
  const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
  return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- ORDEN PERSONALIZADO DEL MENÚ ---
const ORDEN_CATEGORIAS = [
  'Bebidas Calientes', 'Bebidas Frías', 'Pasteles', 'Cheesecakes', 'Rosca', 'Cupcakes', 'Brownies', 'Postres', 'Otros'
];

// --- DATOS INICIALES ---
const PRODUCTOS_CAFETERIA_INIT = [
  { id: 6, nombre: 'Cappuccino Vainilla', descripcion: 'Espresso con leche espumada y vainilla.', precio: 55, categoria: 'Bebidas Calientes', imagen: '☕', zoom: 100 },
  { id: 7, nombre: 'Frappé Moka', descripcion: 'Bebida helada de café con chocolate.', precio: 70, categoria: 'Bebidas Frías', imagen: '🥤', zoom: 100 },
  { id: 1, nombre: 'Pastel de Zanahoria', descripcion: 'Delicioso pastel con nueces y betún de queso crema.', precio: 450, categoria: 'Pasteles', imagen: '🥕', zoom: 100 },
  { id: 2, nombre: 'Cheesecake de Fresa', descripcion: 'Clásico cheesecake estilo NY con salsa de fresa.', precio: 65, categoria: 'Cheesecakes', imagen: '🍰', zoom: 100 },
  { id: 4, nombre: 'Cupcake Red Velvet', descripcion: 'Suave pan rojo con frosting de vainilla.', precio: 35, categoria: 'Cupcakes', imagen: '🧁', zoom: 100 },
  { id: 5, nombre: 'Brownie Doble Choco', descripcion: 'Con trozos de chocolate amargo.', precio: 40, categoria: 'Brownies', imagen: '🍫', zoom: 100 },
  { id: 3, nombre: 'Fresas con Crema', descripcion: 'Fresas frescas con nuestra crema especial.', precio: 80, categoria: 'Postres', imagen: '🍓', zoom: 100 },
];

const MESAS_FISICAS_INIT = [
  { id: 'M1', nombre: 'Mesa 1', tipo: 'mesa', estado: 'Libre', cuenta: [] },
  { id: 'M2', nombre: 'Mesa 2', tipo: 'mesa', estado: 'Libre', cuenta: [] },
  { id: 'M3', nombre: 'Mesa 3', tipo: 'mesa', estado: 'Libre', cuenta: [] },
  { id: 'M4', nombre: 'Mesa 4', tipo: 'mesa', estado: 'Libre', cuenta: [] },
];

const SESIONES_LLEVAR_INIT = [];

const VENTAS_CAFETERIA_INIT = [
  { id: 'V-101', fecha: '2025-12-05', total: 150, items: 3, hora: '08:30', cliente: 'Mesa 1', origen: 'Cafetería' },
];

const PEDIDOS_PASTELERIA_INIT = [
  { folio: 'FOL-2512001', cliente: 'Ana García', telefono: '5550101000', tipoProducto: 'Pastel', fecha: '2025-12-10', fechaEntrega: '2025-12-15', total: 450, estado: 'Entregado', numPagos: 1, pagosRealizados: 1, detalles: "Pastel de Chocolate", origen: 'Pastelería' },
];

// --- COMPONENTES AUXILIARES ---

const Notificacion = ({ data, onClose }) => {
  if (!data.visible) return null;
  const estilos = {
    exito: "bg-green-600 border-green-700 text-white",
    error: "bg-red-500 border-red-600 text-white",
    info: "bg-blue-600 border-blue-700 text-white"
  };
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-b-4 animate-bounce-in transition-all duration-300 ${estilos[data.tipo] || estilos.info}`}>
      {data.tipo === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
      <span className="font-semibold text-sm md:text-base">{data.mensaje}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity"><X size={18} /></button>
    </div>
  );
};

const CardStat = ({ titulo, valor, color, icon }) => (
  <div className={`p-6 rounded-xl shadow-sm border-l-4 ${color.split(' ')[0].replace('bg-', 'border-')} bg-white flex justify-between items-center`}>
    <div>
      <p className="text-gray-500 text-xs uppercase font-bold tracking-wide">{titulo}</p>
      <p className="text-3xl font-bold text-gray-800 mt-2">{valor}</p>
    </div>
    {icon && <div className="text-gray-300 opacity-50">{icon}</div>}
  </div>
);

const BotonNav = ({ icon, label, active, onClick, colorTheme = "pink" }) => {
  const activeClass = colorTheme === "orange" ? "bg-orange-600 text-white shadow-md" : "bg-pink-700 text-white shadow-md";
  const hoverClass = colorTheme === "orange" ? "hover:bg-orange-700 text-orange-100" : "hover:bg-pink-800 text-pink-100";
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? activeClass : hoverClass}`}>
      {icon} <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );
};

const Sidebar = ({ modo, vistaActual, setVistaActual, setModo, isOpen, toggleSidebar }) => {
  const esCafeteria = modo === 'cafeteria';
  const colorBg = esCafeteria ? "bg-orange-900" : "bg-pink-900";
  const colorText = esCafeteria ? "text-orange-200" : "text-pink-200";

  return (
    <div className={`${isOpen ? 'w-64 p-4' : 'w-0 p-0'} ${colorBg} text-white min-h-screen flex flex-col shadow-2xl transition-all duration-300 overflow-hidden relative`}>
      {isOpen && <button onClick={toggleSidebar} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition"><PanelLeftClose size={20} /></button>}
      <div className="mb-8 text-center mt-6">
        <h1 className={`text-2xl font-bold font-serif text-white whitespace-nowrap`}>Dulce Deleite</h1>
        <p className={`text-xs ${colorText} uppercase tracking-widest mt-1 whitespace-nowrap`}>{modo === 'admin' ? 'Administración' : modo === 'pasteleria' ? 'Modo Pastelería' : 'Modo Cafetería'}</p>
      </div>
      <nav className="space-y-2 flex-1">
        {modo === 'admin' && (
          <>
            <BotonNav icon={<LayoutDashboard size={20}/>} label="Inicio Admin" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} />
            <BotonNav icon={<BarChart3 size={20}/>} label="Reporte Comparativo" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} />
            <div className="my-6 border-t border-pink-700"></div>
            <p className="text-xs text-pink-400 uppercase font-bold mb-2 pl-3 whitespace-nowrap">Accesos Rápidos</p>
            <button onClick={() => { setModo('pasteleria'); setVistaActual('inicio'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 text-pink-100 transition whitespace-nowrap"><Cake size={20} /><span>Ir a Pastelería</span></button>
            <button onClick={() => { setModo('cafeteria'); setVistaActual('inicio'); }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-800 text-pink-100 transition whitespace-nowrap"><Coffee size={20} /><span>Ir a Cafetería</span></button>
          </>
        )}
        {modo === 'pasteleria' && (
          <>
            <BotonNav icon={<LayoutDashboard size={20}/>} label="Inicio" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} />
            <BotonNav icon={<PlusCircle size={20}/>} label="Nuevo Pedido" active={vistaActual === 'pedidos'} onClick={() => setVistaActual('pedidos')} />
            <BotonNav icon={<BarChart3 size={20}/>} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} />
          </>
        )}
        {modo === 'cafeteria' && (
          <>
            <BotonNav icon={<LayoutDashboard size={20}/>} label="Inicio" active={vistaActual === 'inicio'} onClick={() => setVistaActual('inicio')} colorTheme="orange"/>
            <BotonNav icon={<Grid size={20}/>} label="Punto de Venta (QR)" active={vistaActual === 'mesas'} onClick={() => setVistaActual('mesas')} colorTheme="orange"/>
            <BotonNav icon={<UtensilsCrossed size={20}/>} label="Menú y Productos" active={vistaActual === 'menu'} onClick={() => setVistaActual('menu')} colorTheme="orange"/>
            <BotonNav icon={<BarChart3 size={20}/>} label="Reporte Ventas" active={vistaActual === 'ventas'} onClick={() => setVistaActual('ventas')} colorTheme="orange"/>
          </>
        )}
      </nav>
      {modo !== 'admin' && <button onClick={() => { setModo('admin'); setVistaActual('inicio'); }} className="mt-4 flex items-center justify-center space-x-2 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm whitespace-nowrap"><ArrowLeft size={16} /><span>Volver al Admin</span></button>}
    </div>
  );
};

// --- MODALES ---
const ModalConfirmacion = ({ isOpen, onClose, onConfirm, titulo="¿Estás seguro?", mensaje="Esta acción no se puede deshacer." }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[250] p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-in transform border-t-8 border-red-500">
        <div className="p-6 text-center">
          <Trash2 size={32} className="text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{titulo}</h3>
          <p className="text-gray-500 mb-6 text-sm">{mensaje}</p>
          <div className="flex space-x-3 justify-center">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">Cancelar</button>
            <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg hover:shadow-xl transition transform active:scale-95">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DETALLES (CORREGIDO LÓGICA PAGO) ---
const ModalDetalles = ({ pedido, cerrar, onRegistrarPago }) => {
  if (!pedido) return null;
  const numPagos = pedido.numPagos ? parseInt(pedido.numPagos) : 1;
  const esPagoUnico = numPagos === 1;

  const [montoRecibido, setMontoRecibido] = useState('');
  // Si es pago único, siempre es liquidación (true). Si no, empieza en falso (Abono).
  const [esLiquidacion, setEsLiquidacion] = useState(esPagoUnico);

  const montoTotal = parseFloat(pedido.total);
  const pagosRealizados = pedido.pagosRealizados || (pedido.origen === 'Cafetería' ? 1 : 0);
  const montoPorPago = (montoTotal / numPagos);
  const pagosRestantes = numPagos - pagosRealizados;
  const saldoPendiente = (montoTotal - (montoPorPago * pagosRealizados));
  
  // Si es liquidación (o pago único), cobramos todo el saldo pendiente. Si no, solo una parcialidad.
  const montoACobrar = esLiquidacion ? saldoPendiente : montoPorPago;
  
  const cambio = montoRecibido ? (parseFloat(montoRecibido) - montoACobrar) : 0;
  const esMontoSuficiente = montoRecibido && parseFloat(montoRecibido) >= montoACobrar - 0.01;
  const porcentajePagado = (pagosRealizados / numPagos) * 100;
  const esCafeteria = pedido.origen === 'Cafetería';

  const handleCobrar = () => { if (esMontoSuficiente) { onRegistrarPago(pedido.folio, esLiquidacion); setMontoRecibido(''); setEsLiquidacion(esPagoUnico); } };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="bg-pink-900 p-6 text-white flex justify-between"><div><h3 className="text-2xl font-bold">{pedido.cliente}</h3><p className="text-pink-200 font-mono text-sm">{pedido.folio || pedido.id}</p></div><button onClick={cerrar}><X/></button></div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border"><h4 className="text-sm font-bold text-gray-500 uppercase flex items-center mb-2"><ShoppingBag size={14} className="mr-2"/> Descripción</h4>
          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase mb-2 inline-block ${esCafeteria ? 'bg-orange-100 text-orange-700' : 'bg-pink-100 text-pink-700'}`}>{pedido.tipoProducto || (esCafeteria ? 'Consumo Cafetería' : 'Producto')}</span>
          <p className="text-gray-800 whitespace-pre-wrap">{pedido.detalles || (esCafeteria ? `Venta de mostrador con ${pedido.items} artículos.` : 'Sin detalles.')}</p></div>
          <div className="grid grid-cols-2 gap-4">
             {pedido.telefono && <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium text-gray-700">{pedido.telefono}</p></div>}
             {pedido.fechaEntrega && <div><p className="text-xs text-gray-400">Entrega Programada</p><p className="font-medium text-pink-700 flex items-center gap-1"><CalendarDays size={14}/>{formatearFechaLocal(pedido.fechaEntrega)}</p></div>}
             <div><p className="text-xs text-gray-400">Fecha Registro</p><p className="font-medium text-gray-700 flex items-center gap-1"><CalendarDays size={14}/>{formatearFechaLocal(pedido.fecha)}</p></div>
          </div>
          <hr className="border-gray-100"/>
          {pedido.estado === 'Cancelado' ? (<div className="w-full bg-red-100 text-red-800 font-bold py-6 rounded-xl text-center flex flex-col justify-center items-center border border-red-200"><AlertCircle size={32} className="mb-2"/><span className="text-lg">Pedido cancelado</span></div>) : (
            <div>
              <div className="flex justify-between items-end mb-2"><span className="text-3xl font-bold text-gray-800">${montoTotal.toFixed(2)}</span><span className="text-sm text-gray-500 mb-1">Total</span></div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden"><div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${porcentajePagado}%` }}></div></div>
              {!esCafeteria && <div className="flex justify-between text-sm text-gray-600 mb-6"><span>Pagado: {pagosRealizados} de {numPagos}</span><span>Resta: ${saldoPendiente.toFixed(2)}</span></div>}
              
              {pagosRestantes > 0 ? (
                <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                  <h5 className="font-bold text-pink-800 mb-3 flex items-center"><Calculator size={16} className="mr-2"/> Cajero</h5>
                  
                  {/* LÓGICA DE BOTONES: Si es 1 pago, no mostramos opción, solo es cobro total */}
                  {!esPagoUnico ? (
                      <div className="flex space-x-2 mb-4">
                          <button onClick={() => {setEsLiquidacion(false); setMontoRecibido('');}} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${!esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Abono (${montoPorPago.toFixed(2)})</button>
                          <button onClick={() => {setEsLiquidacion(true); setMontoRecibido('');}} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${esLiquidacion ? 'bg-pink-600 text-white' : 'bg-white border'}`}>Liquidar (${saldoPendiente.toFixed(2)})</button>
                      </div>
                  ) : (
                      <div className="mb-4 p-2 bg-pink-100 text-pink-800 text-center rounded-lg text-sm font-bold border border-pink-200">
                          Pago de Contado (Total: ${saldoPendiente.toFixed(2)})
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4"><div><label className="text-xs font-bold text-gray-500">Recibido</label><input type="number" min="0" className="w-full p-2 rounded border font-bold" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} /></div><div><label className="text-xs font-bold text-gray-500">Cambio</label><div className="w-full p-2 rounded border font-bold bg-white text-green-600">${cambio >= 0 ? cambio.toFixed(2) : '0.00'}</div></div></div>
                  <button onClick={handleCobrar} disabled={!esMontoSuficiente} className={`w-full py-3 rounded-xl font-bold shadow-lg text-white ${esMontoSuficiente ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'}`}>Confirmar Cobro</button>
                </div>
              ) : (<div className="w-full bg-green-100 text-green-800 font-bold py-3 rounded-xl text-center border border-green-200">¡Pagado / Liquidado!</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModalVentasDia = ({ dia, mes, anio, ventas, cerrar, onVerDetalle }) => {
  if (!dia) return null;
  const ventasDelDia = ventas.filter(v => { 
      const [y, m, d] = v.fecha.split('-').map(Number); 
      return d === parseInt(dia) && m === (mes + 1) && y === anio; 
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fade-in-up">
        <div className="bg-pink-900 p-4 flex justify-between items-center text-white sticky top-0 z-10"><h3 className="font-bold text-lg flex items-center gap-2"><CalendarIcon size={20}/> Ventas del {dia}/{mes + 1}/{anio}</h3><button onClick={cerrar}><X/></button></div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          {ventasDelDia.length === 0 ? <div className="text-center text-gray-500 py-10">No hay ventas registradas.</div> : (
            <div className="space-y-3">
                {ventasDelDia.map((v, i) => (
                    <div 
                        key={i} 
                        onClick={() => onVerDetalle(v)} 
                        className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-pink-300 transition-all group"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.origen === 'Pastelería' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>{v.origen}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs flex items-center gap-1"><Eye size={12}/> Ver detalles</span>
                            </div>
                            <p className="font-bold text-gray-800">{v.cliente}</p>
                            {v.tipoProducto && <p className="text-xs text-gray-500">{v.tipoProducto}</p>}
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-green-600 text-lg">${v.total}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{v.folio || v.id}</span>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModalProducto = ({ producto, isOpen, onClose, onGuardar }) => {
  if (!isOpen) return null;
  const [form, setForm] = useState({ ...producto });
  useEffect(() => { if (producto) setForm({ ...producto }); else setForm({ nombre: '', descripcion: '', precio: '', categoria: 'Pasteles', imagen: '🍰', zoom: 100 }); }, [producto, isOpen]);
  const handleSave = (e) => { e.preventDefault(); onGuardar(form); };
  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setForm(prev => ({ ...prev, imagen: reader.result })); reader.readAsDataURL(file); } };
  const esImagen = (str) => str && (str.startsWith('http') || str.startsWith('data:image'));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-orange-600 p-4 flex justify-between text-white"><h3 className="font-bold">Editar Producto</h3><button onClick={onClose}><X/></button></div>
        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/30">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                <div style={{ transform: `scale(${form.zoom / 100})` }} className={`text-8xl ${esImagen(form.imagen) ? 'w-full h-full' : ''}`}>{esImagen(form.imagen) ? <img src={form.imagen} className="w-full h-full object-contain"/> : form.imagen}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border"><label className="text-xs font-bold uppercase mb-2 block">Zoom</label><input type="range" min="50" max="200" value={form.zoom} onChange={(e) => setForm({...form, zoom: e.target.value})} className="w-full accent-orange-600"/></div>
            <label className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg cursor-pointer block text-center"><Upload size={20} className="inline mr-2"/> Subir Foto <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} /></label>
          </div>
          <div className="space-y-4">
            <input required placeholder="Nombre" className="w-full p-3 border rounded-lg" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Precio" className="w-full p-3 border rounded-lg font-bold text-orange-600" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} />
                <select className="w-full p-3 border rounded-lg bg-white" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>{ORDEN_CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <textarea placeholder="Descripción" className="w-full p-3 border rounded-lg h-32" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
            <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- VISTAS ---

const VistaInicioAdmin = ({ pedidos, ventasCafeteria }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel General (Dueño)</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm">
        <h3 className="text-xl font-bold text-pink-800 mb-2">Área Pastelería</h3>
        <p className="text-gray-600 mb-4">{pedidos.filter(p => p.estado !== 'Cancelado').length} pedidos activos</p>
        <p className="text-3xl font-bold text-pink-600">${pedidos.filter(p => p.estado !== 'Cancelado').reduce((s,p)=>s+p.total,0)}</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
        <h3 className="text-xl font-bold text-orange-800 mb-2">Área Cafetería</h3>
        <p className="text-gray-600 mb-4">{ventasCafeteria.length} tickets registrados</p>
        <p className="text-3xl font-bold text-orange-600">${ventasCafeteria.reduce((s,v)=>s+v.total,0)}</p>
      </div>
    </div>
  </div>
);

const VistaInicioPasteleria = ({ pedidos, onEditar, onToggleEstado, onVerDetalles, onCancelar }) => {
  const pedidosOrdenados = useMemo(() => [...pedidos].sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega)), [pedidos]);
  const totalCajaHoy = useMemo(() => { const hoy = getFechaHoy(); return pedidos.filter(p => p.estado !== 'Cancelado' && p.fecha === hoy).reduce((acc, p) => acc + (p.pagosRealizados ? (p.total/p.numPagos)*p.pagosRealizados : 0), 0); }, [pedidos]);

  return (
    <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Pedidos de Pasteles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CardStat titulo="Pedidos Pendientes" valor={pedidos.filter(p => p.estado === 'Pendiente').length} color="bg-yellow-100 text-yellow-800" icon={<Clock size={30}/>} />
            <CardStat titulo="Entregados Hoy" valor={pedidos.filter(p => p.estado === 'Entregado' && p.fechaEntrega === getFechaHoy()).length} color="bg-green-100 text-green-800" icon={<CheckCircle size={30}/>} />
            <CardStat titulo="Total Caja (Hoy)" valor={`$${totalCajaHoy.toFixed(0)}`} color="bg-pink-100 text-pink-800" icon={<DollarSign size={30}/>} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-pink-50 text-pink-800 text-sm"><th className="p-4">Folio</th><th className="p-4">Cliente</th><th className="p-4">Entrega</th><th className="p-4">Total</th><th className="p-4">Pagos</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr></thead><tbody>{pedidosOrdenados.map((p, i) => (<tr key={i} onClick={() => onVerDetalles(p)} className={`border-b hover:bg-gray-50 cursor-pointer ${p.estado === 'Cancelado' ? 'opacity-50' : ''}`}><td className="p-4 font-mono font-bold text-gray-600">{p.folio}</td><td className="p-4"><div className={`font-bold ${p.estado === 'Cancelado' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{p.cliente}</div><div className="text-xs text-gray-400">{p.tipoProducto || 'Pastel'}</div></td><td className="p-4 text-sm font-medium text-gray-600">{formatearFechaLocal(p.fechaEntrega)}</td><td className={`p-4 font-bold ${p.estado === 'Cancelado' ? 'text-gray-400' : 'text-green-600'}`}>${p.total}</td><td className="p-4 text-sm text-gray-500"><span className="px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">{p.pagosRealizados || 0}/{p.numPagos}</span></td><td className="p-4">
                    {p.estado === 'Cancelado' ? (<span className="px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 bg-red-100 text-red-800"><AlertCircle size={12}/> Cancelado</span>) : (
                        <button onClick={(e) => { e.stopPropagation(); onToggleEstado(p.folio); }} className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 transition-colors ${p.estado === 'Entregado' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                            {p.estado === 'Entregado' ? <CheckCircle size={12}/> : <Clock size={12}/>} {p.estado}
                        </button>
                    )}
                    </td><td className="p-4 flex gap-2"><button onClick={(e) => { e.stopPropagation(); onVerDetalles(p); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"><Eye size={18}/></button>{p.estado !== 'Cancelado' && (<><button onClick={(e) => { e.stopPropagation(); onEditar(p); }} className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600"><Edit size={18}/></button><button onClick={(e) => { e.stopPropagation(); onCancelar(p.folio); }} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600"><Trash2 size={18}/></button></>)}</td></tr>))}</tbody></table></div>
        </div>
    </div>
  );
};

const VistaNuevoPedido = ({ pedidos, onGuardarPedido, generarFolio, pedidoAEditar, mostrarNotificacion }) => {
  const [formulario, setFormulario] = useState({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Pastel');
  const [otroTexto, setOtroTexto] = useState('');

  useEffect(() => {
    if (pedidoAEditar) {
        setFormulario({ ...pedidoAEditar });
        const esEstandar = ['Pastel', 'Cheesecake', 'Rosca'].includes(pedidoAEditar.tipoProducto);
        if (esEstandar) setCategoriaSeleccionada(pedidoAEditar.tipoProducto);
        else { setCategoriaSeleccionada('Otro'); setOtroTexto(pedidoAEditar.tipoProducto || ''); }
    } else {
        setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
        setCategoriaSeleccionada('Pastel'); setOtroTexto('');
    }
  }, [pedidoAEditar]);

  useEffect(() => {
      if (categoriaSeleccionada === 'Otro') setFormulario(prev => ({ ...prev, tipoProducto: otroTexto }));
      else setFormulario(prev => ({ ...prev, tipoProducto: categoriaSeleccionada }));
  }, [categoriaSeleccionada, otroTexto]);

  const manejarSubmit = (e) => {
    e.preventDefault();
    if (formulario.telefono.length !== 10) { mostrarNotificacion("El teléfono debe tener 10 dígitos.", "error"); return; }
    if (formulario.cliente.trim().length < 3) { mostrarNotificacion("Nombre muy corto.", "error"); return; }
    if (categoriaSeleccionada === 'Otro' && otroTexto.trim() === '') { mostrarNotificacion("Especifica qué producto es.", "error"); return; }
    const folioFinal = pedidoAEditar ? formulario.folio : generarFolio();
    if (!pedidoAEditar && pedidos.find(p => p.folio === folioFinal)) { mostrarNotificacion("Error colisión folio", "error"); return; }
    onGuardarPedido({
      ...formulario,
      folio: folioFinal,
      total: parseFloat(formulario.total) || 0,
      numPagos: parseInt(formulario.numPagos) || 1,
      pagosRealizados: pedidoAEditar ? (pedidoAEditar.pagosRealizados || 0) : 0,
      fecha: pedidoAEditar ? pedidoAEditar.fecha : getFechaHoy(),
      estado: pedidoAEditar ? pedidoAEditar.estado : 'Pendiente',
      origen: 'Pastelería'
    });
    if(!pedidoAEditar) {
      setFormulario({ folio: '', cliente: '', telefono: '', tipoProducto: 'Pastel', detalles: '', total: '', numPagos: 1, fechaEntrega: '' });
      setCategoriaSeleccionada('Pastel'); setOtroTexto('');
      mostrarNotificacion(`Pedido ${folioFinal} registrado`, "exito");
    } else { mostrarNotificacion("Pedido actualizado", "exito"); }
  };

  const montoPorPago = formulario.total && formulario.numPagos > 0 ? (parseFloat(formulario.total) / parseInt(formulario.numPagos)).toFixed(2) : '0.00';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-pink-900">{pedidoAEditar ? 'Editar Pedido' : 'Nuevo Pedido Pastelería'}</h2>
        {pedidoAEditar && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">{pedidoAEditar.folio}</span>}
      </div>
      <form onSubmit={manejarSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-pink-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><User size={16} className="mr-2 text-pink-500"/> Cliente</label><input required type="text" placeholder="Ej. María Pérez" className="w-full p-3 border rounded-lg" value={formulario.cliente} onChange={e => {if(/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]*$/.test(e.target.value)) setFormulario({...formulario, cliente: e.target.value})}} /></div>
          <div className="space-y-2"><label className="flex items-center text-sm font-medium text-gray-700"><Phone size={16} className="mr-2 text-pink-500"/> Teléfono</label><input required type="tel" placeholder="10 dígitos" className="w-full p-3 border rounded-lg" value={formulario.telefono} onChange={e => {if(/^\d{0,10}$/.test(e.target.value)) setFormulario({...formulario, telefono: e.target.value})}} /></div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700"><Cake size={16} className="mr-2 text-pink-500"/> Categoría / Producto</label>
            <select className="w-full p-3 border rounded-lg bg-white" value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)}><option value="Pastel">Pastel</option><option value="Cheesecake">Cheesecake</option><option value="Rosca">Rosca</option><option value="Otro">Otro (Escribir)</option></select>
            {categoriaSeleccionada === 'Otro' && (<input type="text" placeholder="Especifique..." className="w-full p-3 mt-2 border rounded-lg bg-pink-50" value={otroTexto} onChange={e => setOtroTexto(e.target.value)} required />)}
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700"><CalendarDays size={16} className="mr-2 text-pink-500"/> Fecha de Entrega</label>
            <input required type="date" min="2025-12-01" className="w-full p-3 border rounded-lg" value={formulario.fechaEntrega} onChange={e => setFormulario({...formulario, fechaEntrega: e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2"><label className="flex items-center text-sm font-medium text-gray-700"><ShoppingBag size={16} className="mr-2 text-pink-500"/> Detalles</label><textarea placeholder="Sabor, dedicatoria, decoración especial..." className="w-full p-3 border rounded-lg h-24" value={formulario.detalles} onChange={e => setFormulario({...formulario, detalles: e.target.value})} /></div>
          <div className="md:col-span-2 bg-pink-50 p-4 rounded-xl border border-pink-100">
            <div className="flex items-center mb-4 text-pink-700 font-semibold"><Calculator size={18} className="mr-2"/> Calculadora de Liquidación</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-sm text-gray-600">Total ($)</label><input required type="number" min="0" placeholder="Ej. 500" className="w-full p-3 border rounded-lg font-bold" value={formulario.total} onChange={e => setFormulario({...formulario, total: e.target.value})} /></div>
              <div><label className="text-sm text-gray-600">Num. Pagos</label><input type="number" min="1" placeholder="Ej. 2" className="w-full p-3 border rounded-lg" value={formulario.numPagos} onChange={e => setFormulario({...formulario, numPagos: e.target.value})} /></div>
              <div className="bg-white p-3 rounded-lg border border-pink-200 flex flex-col justify-center items-center"><span className="text-xs text-pink-500 uppercase font-bold">Monto x Pago</span><span className="text-xl font-bold text-pink-700">${montoPorPago}</span></div>
            </div>
          </div>
        </div>
        <button type="submit" className="mt-8 w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2">{pedidoAEditar ? <Edit size={20}/> : <PlusCircle size={20}/>} {pedidoAEditar ? 'Guardar Cambios' : 'Registrar Pedido'}</button>
      </form>
    </div>
  );
};

// --- VISTAS CAFETERÍA ---
const ModalNuevoLlevar = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const [datos, setDatos] = useState({ nombre: '', telefono: '' });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120] p-4 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Smartphone size={24} className="text-orange-600"/> Nuevo Cliente "Para Llevar"</h3>
            <input placeholder="Nombre Completo" className="w-full p-3 border rounded-lg mb-3" value={datos.nombre} onChange={e=>setDatos({...datos, nombre: e.target.value})} />
            <input placeholder="Teléfono" className="w-full p-3 border rounded-lg mb-4" value={datos.telefono} onChange={e=>setDatos({...datos, telefono: e.target.value})} />
            <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-gray-600">Cancelar</button>
                <button onClick={() => { if(datos.nombre && datos.telefono) onConfirm(datos); }} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold">Crear Pedido</button>
            </div>
        </div>
    </div>
  );
};

const VistaDetalleCuenta = ({ sesion, productos, onCerrar, onAgregarProducto, onPagarCuenta }) => {
  if (!sesion) return null;
  const totalCuenta = sesion.cuenta.reduce((acc, item) => acc + item.precio, 0);

  return (
    <div className="fixed inset-0 bg-gray-100 z-[60] flex animate-fade-in-up">
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-300">
            <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-gray-800">Menú Digital</h2><p className="text-sm text-gray-500">Agregando a: <span className="font-bold text-orange-600">{sesion.nombre || sesion.nombreCliente}</span></p></div>
                <button onClick={onCerrar} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-bold"><ArrowLeft size={20}/> Volver a Mesas</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-orange-50/30">
                {ORDEN_CATEGORIAS.map(cat => {
                    const prods = productos.filter(p => p.categoria === cat);
                    if (prods.length === 0) return null;
                    return (
                        <div key={cat} className="mb-8">
                            <h3 className="font-bold text-orange-800 text-lg border-b border-orange-200 mb-3 pb-1">{cat}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {prods.map(prod => (
                                    <div key={prod.id} onClick={() => onAgregarProducto(sesion.id, prod)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-orange-300 transition active:scale-95 flex flex-col items-center text-center">
                                        <div className="text-4xl mb-2">{prod.imagen}</div>
                                        <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{prod.nombre}</h4>
                                        <span className="text-orange-600 font-bold">${prod.precio}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
        <div className="w-96 bg-white shadow-2xl flex flex-col h-full">
            <div className="p-6 bg-gray-900 text-white">
                <div className="flex justify-between items-start mb-4"><div><h3 className="text-xl font-bold">Comanda</h3><p className="text-gray-400 text-xs font-mono">{sesion.id} • {sesion.tipo === 'llevar' ? 'Para Llevar' : 'Mesa'}</p></div><Receipt className="text-orange-400"/></div>
                {sesion.tipo === 'llevar' && (<div className="bg-gray-800 p-2 rounded text-xs mb-2"><p className="text-gray-300">Cliente: <span className="text-white font-bold">{sesion.nombreCliente}</span></p><p className="text-gray-300">Tel: <span className="text-white">{sesion.telefono}</span></p></div>)}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sesion.cuenta.length === 0 ? <div className="text-center text-gray-400 py-10 italic">Cuenta vacía.<br/>Selecciona productos.</div> : (
                    sesion.cuenta.map((item, idx) => (<div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2"><div><p className="font-bold text-gray-800 text-sm">{item.nombre}</p><p className="text-xs text-gray-500">{item.categoria}</p></div><span className="font-bold text-gray-700">${item.precio}</span></div>))
                )}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4"><span className="text-lg font-bold text-gray-600">Total</span><span className="text-3xl font-bold text-gray-900">${totalCuenta}</span></div>
                <button onClick={() => onPagarCuenta(sesion)} disabled={sesion.cuenta.length === 0} className={`w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 ${sesion.cuenta.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}><DollarSign size={20}/> Cerrar Cuenta y Pagar</button>
            </div>
        </div>
    </div>
  );
};

const VistaGestionMesas = ({ mesas, pedidosLlevar, onAgregarMesa, onEliminarMesa, onAbrirSesion, onCrearLlevar }) => {
  const [modalLlevarOpen, setModalLlevarOpen] = useState(false);
  return (
    <div className="p-8 h-screen overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Puntos de Venta (QR)</h2>
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-orange-800 flex items-center"><Grid className="mr-2"/> Mesas Físicas</h3>
                <button onClick={onAgregarMesa} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 flex items-center gap-2"><PlusCircle size={18}/> Agregar Mesa</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mesas.map(mesa => (
                    <div key={mesa.id} onClick={() => onAbrirSesion(mesa.id)} className={`relative p-6 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[160px] transition-all cursor-pointer group hover:shadow-lg ${mesa.estado === 'Ocupada' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-orange-300'}`}>
                        {mesa.estado === 'Libre' ? (
                            <>
                                <QrCode size={40} className="text-gray-300 mb-2 group-hover:text-orange-500 transition-colors"/>
                                <h3 className="font-bold text-lg text-gray-600">{mesa.nombre}</h3>
                                <p className="text-xs text-green-600 font-bold mt-1">Disponible</p>
                                <button onClick={(e) => {e.stopPropagation(); onEliminarMesa(mesa.id);}} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={14}/></button>
                            </>
                        ) : (
                            <>
                                <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mb-2">Ocupada</div>
                                <h3 className="font-bold text-lg text-gray-800">{mesa.nombre}</h3>
                                <p className="text-2xl font-bold text-red-600 mt-1">${mesa.cuenta.reduce((a,b)=>a+b.precio,0)}</p>
                                <p className="text-xs text-gray-500">{mesa.cuenta.length} items</p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-4 border-t pt-8 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center"><ShoppingBag className="mr-2 text-orange-500"/> Pedidos Para Llevar (Activos)</h3>
                <button onClick={() => setModalLlevarOpen(true)} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-700 flex items-center gap-2"><QrCode size={20}/> Escanear QR Mostrador/Llevar</button>
            </div>
            {pedidosLlevar.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                    <Smartphone size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>No hay pedidos para llevar activos.</p>
                    <p className="text-sm">Escanea el QR de "Llevar" para iniciar uno nuevo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pedidosLlevar.map(p => (
                        <div key={p.id} onClick={() => onAbrirSesion(p.id)} className="bg-orange-50 p-5 rounded-xl border border-orange-200 shadow-sm cursor-pointer hover:shadow-md transition flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-orange-200 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Llevar</span>
                                    <span className="font-mono text-xs text-gray-500 font-bold">{p.id}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg">{p.nombreCliente}</h4>
                                <p className="text-xs text-gray-500">{p.telefono}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-orange-600">${p.cuenta.reduce((a,b)=>a+b.precio,0)}</p>
                                <p className="text-xs text-gray-500">{p.cuenta.length} productos</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <ModalNuevoLlevar isOpen={modalLlevarOpen} onClose={() => setModalLlevarOpen(false)} onConfirm={(datos) => { onCrearLlevar(datos); setModalLlevarOpen(false); }} />
    </div>
  );
};

const VistaMenuCafeteria = ({ productos, onGuardarProducto }) => {
  const [productoEdit, setProductoEdit] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const categorias = [...new Set(productos.map(p => p.categoria))];
  const abrirNuevo = () => { setProductoEdit(null); setModalAbierto(true); };
  const abrirEditar = (prod) => { setProductoEdit(prod); setModalAbierto(true); };

  return (
    <div className="p-8 h-screen overflow-y-auto bg-orange-50/50">
      <div className="flex justify-between items-center mb-8">
        <div className="bg-orange-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex-1 mr-6">
          <div className="relative z-10"><h2 className="text-3xl font-serif font-bold mb-1">Menú Digital</h2><p className="text-orange-100">Gestión de Productos por Sección</p></div>
          <Coffee className="absolute right-[-10px] bottom-[-20px] text-orange-700 opacity-20" size={120} />
        </div>
        <button onClick={abrirNuevo} className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-2 transition transform active:scale-95"><PlusCircle size={24}/> Nuevo Producto</button>
      </div>
      {categorias.map(cat => (
        <div key={cat} className="mb-10">
            <div className="flex items-center gap-4 mb-4"><h3 className="text-2xl font-bold text-orange-800 border-b-2 border-orange-200 pb-1">{cat}</h3><button onClick={() => { setProductoEdit({categoria: cat}); setModalAbierto(true); }} className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition">+ Agregar en {cat}</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.filter(p => p.categoria === cat).map(prod => (
                <div key={prod.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-orange-100 flex flex-col">
                    <div className="h-40 bg-orange-50 flex items-center justify-center overflow-hidden relative">
                        <div style={{ transform: `scale(${prod.zoom ? prod.zoom / 100 : 1})` }} className="text-6xl transition-transform duration-300">
                            {prod.imagen && (prod.imagen.startsWith('http') || prod.imagen.startsWith('data:image')) ? (
                                <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-contain" />
                            ) : prod.imagen}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => abrirEditar(prod)} className="bg-white p-2 rounded-full shadow text-blue-600 hover:bg-blue-50"><Edit size={16}/></button></div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{prod.nombre}</h4>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{prod.descripcion || 'Sin descripción'}</p>
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100"><span className="text-xl font-bold text-orange-700">${prod.precio}</span></div>
                    </div>
                </div>
            ))}
            </div>
        </div>
      ))}
      <ModalProducto isOpen={modalAbierto} onClose={() => setModalAbierto(false)} producto={productoEdit} onGuardar={(prod) => { onGuardarProducto(prod); setModalAbierto(false); }} />
    </div>
  );
};

const VistaInicioCafeteria = ({ ventas }) => {
  const ventasHoy = useMemo(() => { const hoy = getFechaHoy(); return ventas.filter(v => v.fecha === hoy); }, [ventas]);
  return (
    <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Cafetería - Inicio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CardStat titulo="Ventas Hoy" valor={ventasHoy.length} color="bg-orange-100 text-orange-800" icon={<Coffee size={30}/>} />
            <CardStat titulo="Ingresos Totales (Hoy)" valor={`$${ventasHoy.reduce((acc, v)=>acc+v.total,0)}`} color="bg-green-100 text-green-800" icon={<DollarSign size={30}/>} />
        </div>
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
            <Grid size={48} className="mx-auto text-orange-300 mb-4"/>
            <h3 className="text-xl font-bold text-gray-700">Gestión de Piso</h3>
            <p className="text-gray-500 mt-2 mb-6">Administra mesas y pedidos para llevar desde la sección dedicada.</p>
        </div>
    </div>
  );
};

// --- NUEVA LÓGICA DE REPORTES: CALENDARIO Y RANGOS (SIN ERRORES DE FECHA) ---
const VistaReporteUniversal = ({ pedidosPasteleria, ventasCafeteria, modo, onAbrirModalDia }) => {
  // Estado inicial: Diciembre 2025 (YYYY-MM)
  const [mesSeleccionado, setMesSeleccionado] = useState('2025-12');
  // Rango de fechas opcional (Strings YYYY-MM-DD)
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');

  // 1. Unificar Datos
  const todosLosDatosCompletos = useMemo(() => {
      let datos = [];
      if (modo === 'admin') datos = [...pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' })), ...ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }))];
      else if (modo === 'pasteleria') datos = pedidosPasteleria.map(p => ({ ...p, origen: 'Pastelería' }));
      else datos = ventasCafeteria.map(v => ({ ...v, origen: 'Cafetería' }));
      return datos.filter(p => p.estado !== 'Cancelado');
  }, [pedidosPasteleria, ventasCafeteria, modo]);

  // 2. Filtrado y Cálculo (Usando Strings para evitar errores de zona horaria)
  const datosReporte = useMemo(() => {
    let datosFiltrados = todosLosDatosCompletos;
    let tituloPeriodo = "";
    
    // Extracción segura de Año y Mes del selector de mes
    const [anioStr, mesStr] = mesSeleccionado.split('-');
    const anio = parseInt(anioStr);
    const mes = parseInt(mesStr) - 1; // 0-11 para lógica JS si se necesita

    // Lógica de Filtro
    if (rangoInicio && rangoFin) {
        // Filtrar por rango estricto de texto (YYYY-MM-DD)
        datosFiltrados = datosFiltrados.filter(d => d.fecha >= rangoInicio && d.fecha <= rangoFin);
        tituloPeriodo = `Del ${formatearFechaLocal(rangoInicio)} al ${formatearFechaLocal(rangoFin)}`;
    } else {
        // Filtrar por mes seleccionado (YYYY-MM)
        datosFiltrados = datosFiltrados.filter(d => d.fecha.startsWith(mesSeleccionado));
        const fechaObj = new Date(anio, mes, 1);
        tituloPeriodo = fechaObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    let totalPasteleria = 0, totalCafeteria = 0;
    
    // Generar estructura de gráfica (Días del mes seleccionado)
    // Nota: Aunque estemos en rango, mostramos la estructura del mes base para mantener la gráfica estable
    let desglose = [];
    const diasEnMes = new Date(anio, mes + 1, 0).getDate(); // Último día del mes
    
    for(let i=1; i<=diasEnMes; i++) {
        desglose.push({ label: `${i}`, valorP: 0, valorC: 0 });
    }

    // Llenar datos
    datosFiltrados.forEach(p => {
        // Parsear fecha manualmente: YYYY-MM-DD
        const [y, m, d] = p.fecha.split('-').map(Number);
        
        if (p.origen === 'Pastelería') totalPasteleria += p.total;
        else totalCafeteria += p.total;

        // Solo sumamos a la gráfica si el dato pertenece al mes/año que estamos visualizando en la gráfica
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
    <div className="p-8">
      {/* CABECERA Y CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Reporte Ventas</h2>
        
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200 items-end">
            <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Mes Principal</label>
                <input 
                    type="month" 
                    value={mesSeleccionado} 
                    min="2025-12" // Restricción visual de inicio
                    onChange={(e) => { setMesSeleccionado(e.target.value); limpiarRango(); }}
                    className="border rounded-lg p-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition"
                />
            </div>
            
            <div className="h-10 w-px bg-gray-300 mx-2 hidden md:block"></div>

            <div className="flex items-end gap-2">
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Desde</label>
                    <input 
                        type="date" 
                        value={rangoInicio} 
                        min="2025-12-01"
                        onChange={(e) => setRangoInicio(e.target.value)}
                        className="border rounded-lg p-2 text-sm text-gray-600 w-32"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">Hasta</label>
                    <input 
                        type="date" 
                        value={rangoFin} 
                        min="2025-12-01"
                        onChange={(e) => setRangoFin(e.target.value)}
                        className="border rounded-lg p-2 text-sm text-gray-600 w-32"
                    />
                </div>
            </div>
            
            {(rangoInicio || rangoFin) && (
                <button onClick={limpiarRango} className="text-xs text-red-500 font-bold hover:underline mb-3 flex items-center gap-1">
                    <X size={12}/> Limpiar Rango
                </button>
            )}
        </div>
      </div>

      {/* TARJETAS DE TOTALES (Se actualizan con el filtro) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {modo !== 'cafeteria' && <CardStat titulo="Total Pastelería" valor={`$${datosReporte.totalPasteleria}`} color="bg-pink-100 text-pink-800" />}
        {modo !== 'pasteleria' && <CardStat titulo="Total Cafetería" valor={`$${datosReporte.totalCafeteria}`} color="bg-orange-100 text-orange-800" />}
        {modo === 'admin' && <CardStat titulo="Gran Total" valor={`$${datosReporte.totalGlobal}`} color="bg-green-100 text-green-800" />}
      </div>

      {/* GRÁFICA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 capitalize">
                <BarChart3 size={20}/> 
                {datosReporte.tituloPeriodo}
            </h3>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-1 px-2 pb-2">
          {datosReporte.desglose.map((item, i) => {
            const tieneDatos = item.valorP > 0 || item.valorC > 0;
            return (
                <div 
                    key={i} 
                    className={`flex flex-col items-center justify-end h-full flex-1 group relative ${tieneDatos ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                        if (tieneDatos) {
                            onAbrirModalDia(item.label, datosReporte.mes, datosReporte.anio, todosLosDatosCompletos);
                        }
                    }}
                >
                  {/* Tooltip al pasar el mouse */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg transition-opacity">
                    Día {item.label}: ${item.valorP + item.valorC}
                  </div>

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
  );
};

// --- APP PRINCIPAL ---
export default function PasteleriaApp() {
  const [modo, setModo] = useState('admin');
  const [vistaActual, setVistaActual] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados Globales
  const [productosCafeteria, setProductosCafeteria] = useState(PRODUCTOS_CAFETERIA_INIT);
  const [mesas, setMesas] = useState(MESAS_FISICAS_INIT); // Mesas físicas
  const [sesionesLlevar, setSesionesLlevar] = useState(SESIONES_LLEVAR_INIT); // Sesiones "Para Llevar" activas
  // Inicializamos pedidos en Dic 2025
  const [pedidosPasteleria, setPedidosPasteleria] = useState(PEDIDOS_PASTELERIA_INIT);
  const [ventasCafeteria, setVentasCafeteria] = useState(VENTAS_CAFETERIA_INIT); // Historial Ventas
  
  // Modales
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [pedidoVerDetalles, setPedidoVerDetalles] = useState(null);
  const [notificacion, setNotificacion] = useState({ visible: false, mensaje: '', tipo: 'info' });
  const [datosModalDia, setDatosModalDia] = useState(null);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [sesionActivaId, setSesionActivaId] = useState(null); // ID de Mesa o Llevar abierta actualmente

  const mostrarNotificacion = (mensaje, tipo = 'exito') => { setNotificacion({ visible: true, mensaje, tipo }); setTimeout(() => setNotificacion(prev => ({ ...prev, visible: false })), 3000); };

  // --- LÓGICA DE SESIONES (MESAS Y LLEVAR) ---
  
  const abrirSesion = (id) => {
    setSesionActivaId(id);
  };

  const crearSesionLlevar = (datosCliente) => {
    const nuevaSesion = {
      id: `PLL-${Date.now().toString().slice(-4)}`,
      tipo: 'llevar',
      nombreCliente: datosCliente.nombre,
      telefono: datosCliente.telefono,
      cuenta: [],
      estado: 'Activa'
    };
    setSesionesLlevar([...sesionesLlevar, nuevaSesion]);
    mostrarNotificacion("Pedido Para Llevar iniciado", "exito");
    setSesionActivaId(nuevaSesion.id);
  };

  const agregarProductoASesion = (idSesion, producto) => {
    const esMesa = mesas.find(m => m.id === idSesion);
    if (esMesa) {
        const nuevasMesas = mesas.map(m => m.id === idSesion ? { ...m, estado: 'Ocupada', cuenta: [...m.cuenta, producto] } : m);
        setMesas(nuevasMesas);
    } else {
        const nuevasSesiones = sesionesLlevar.map(s => s.id === idSesion ? { ...s, cuenta: [...s.cuenta, producto] } : s);
        setSesionesLlevar(nuevasSesiones);
    }
    mostrarNotificacion(`${producto.nombre} agregado`, "info");
  };

  const pagarCuenta = (sesion) => {
    const total = sesion.cuenta.reduce((acc, p) => acc + p.precio, 0);
    const nuevaVenta = {
        id: `T-${Date.now().toString().slice(-6)}`, // Folio Ticket
        fecha: getFechaHoy(), // Usamos la fecha local ajustada
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        total: total,
        items: sesion.cuenta.length,
        cliente: sesion.tipo === 'mesa' ? sesion.nombre : `${sesion.nombreCliente} (Llevar)`,
        origen: 'Cafetería'
    };

    setVentasCafeteria([...ventasCafeteria, nuevaVenta]);

    if (sesion.tipo === 'mesa') {
        setMesas(mesas.map(m => m.id === sesion.id ? { ...m, estado: 'Libre', cuenta: [] } : m));
    } else {
        setSesionesLlevar(sesionesLlevar.filter(s => s.id !== sesion.id));
    }
    
    setSesionActivaId(null); 
    mostrarNotificacion(`Cuenta pagada. Ticket: ${nuevaVenta.id}`, "exito");
  };

  const sesionActivaObj = useMemo(() => {
    if (!sesionActivaId) return null;
    return mesas.find(m => m.id === sesionActivaId) || sesionesLlevar.find(s => s.id === sesionActivaId);
  }, [sesionActivaId, mesas, sesionesLlevar]);


  // ... Funciones existentes ...
  const guardarProductoCafeteria = (prod) => { if (prod.id) setProductosCafeteria(productosCafeteria.map(p => p.id === prod.id ? prod : p)); else setProductosCafeteria([...productosCafeteria, { ...prod, id: Date.now() }]); };
  const agregarMesa = () => { setMesas([...mesas, { id: `M${mesas.length + 1}`, nombre: `Mesa ${mesas.length + 1}`, tipo: 'mesa', estado: 'Libre', cuenta: [] }]); };
  const eliminarMesa = (id) => { if(window.confirm("¿Eliminar?")) setMesas(mesas.filter(m => m.id !== id)); };
  const generarFolio = () => `FOL-${Date.now().toString().slice(-6)}`;
  const guardarPedido = (datos) => { if (pedidoAEditar) setPedidosPasteleria(pedidosPasteleria.map(p => p.folio === datos.folio ? datos : p)); else setPedidosPasteleria([...pedidosPasteleria, datos]); if(modo === 'pasteleria') setVistaActual('inicio'); };
  const registrarPago = (folio, esLiquidacion) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, pagosRealizados: esLiquidacion ? p.numPagos : (p.pagosRealizados || 0) + 1 }; return p; }); setPedidosPasteleria(nuevos); if(pedidoVerDetalles && pedidoVerDetalles.folio === folio) setPedidoVerDetalles(nuevos.find(p=>p.folio===folio)); mostrarNotificacion("Pago registrado", "exito"); };
  const toggleEstadoPedido = (folio) => { const nuevos = pedidosPasteleria.map(p => { if(p.folio === folio) return { ...p, estado: p.estado === 'Pendiente' ? 'Entregado' : 'Pendiente' }; return p; }); setPedidosPasteleria(nuevos); mostrarNotificacion("Estado actualizado", "info"); };
  const iniciarCancelacion = (folio) => setPedidoACancelar(folio);
  const confirmarCancelacion = () => { if(!pedidoACancelar) return; const nuevos = pedidosPasteleria.map(p => { if(p.folio === pedidoACancelar) return { ...p, estado: 'Cancelado' }; return p; }); setPedidosPasteleria(nuevos); setPedidoACancelar(null); };

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
            {vistaActual === 'inicio' && <VistaInicioCafeteria ventas={ventasCafeteria} />}
            {vistaActual === 'menu' && <VistaMenuCafeteria productos={productosCafeteria} onGuardarProducto={guardarProductoCafeteria} />}
            {vistaActual === 'mesas' && (
                <VistaGestionMesas
                    mesas={mesas}
                    pedidosLlevar={sesionesLlevar}
                    onAgregarMesa={agregarMesa}
                    onEliminarMesa={eliminarMesa}
                    onAbrirSesion={abrirSesion}
                    onCrearLlevar={crearSesionLlevar}
                />
            )}
            {vistaActual === 'ventas' && <VistaReporteUniversal pedidosPasteleria={[]} ventasCafeteria={ventasCafeteria} modo="cafeteria" onAbrirModalDia={(dia, mes, anio, datos) => setDatosModalDia({ dia, mes, anio, ventas: datos })} />}
          </>
        )}
      </main>
      
      {/* VISTA SUPERPUESTA DE TOMA DE ORDEN (POS) */}
      {sesionActivaId && (
        <VistaDetalleCuenta
            sesion={sesionActivaObj}
            productos={productosCafeteria}
            onCerrar={() => setSesionActivaId(null)}
            onAgregarProducto={agregarProductoASesion}
            onPagarCuenta={pagarCuenta}
        />
      )}

      <ModalDetalles pedido={pedidoVerDetalles} cerrar={() => setPedidoVerDetalles(null)} onRegistrarPago={registrarPago} />
      
      {datosModalDia && (
        <ModalVentasDia 
            dia={datosModalDia.dia} 
            mes={datosModalDia.mes} 
            anio={datosModalDia.anio} 
            ventas={datosModalDia.ventas} 
            cerrar={() => setDatosModalDia(null)} 
            onVerDetalle={(item) => {
                // Al hacer clic, abrimos el modal de detalles
                setPedidoVerDetalles(item);
            }}
        />
      )}

      <ModalConfirmacion isOpen={!!pedidoACancelar} onClose={() => setPedidoACancelar(null)} onConfirm={confirmarCancelacion} />
    </div>
  );
}