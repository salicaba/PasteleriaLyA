// --- HELPER DE FECHAS (ROBUSTO) ---
export const getFechaHoy = () => {
    const d = new Date();
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    const fechaStr = local.toISOString().slice(0, 10);
    return fechaStr < '2025-12-01' ? '2025-12-01' : fechaStr;
};
  
export const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return '-';
    const parts = fechaString.split('-'); 
    const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
    return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
  
// --- DATA INICIAL ---
export const ORDEN_CATEGORIAS = [
    'Bebidas Calientes', 'Bebidas Frías', 'Pasteles', 'Cheesecakes', 'Rosca', 'Cupcakes', 'Brownies', 'Postres', 'Otros'
];
  
export const PRODUCTOS_CAFETERIA_INIT = [
    { id: 6, nombre: 'Cappuccino Vainilla', descripcion: 'Espresso con leche espumada y vainilla.', precio: 55, categoria: 'Bebidas Calientes', imagen: '☕', zoom: 100 },
    { id: 7, nombre: 'Frappé Moka', descripcion: 'Bebida helada de café con chocolate.', precio: 70, categoria: 'Bebidas Frías', imagen: '🥤', zoom: 100 },
    { id: 1, nombre: 'Pastel de Zanahoria', descripcion: 'Delicioso pastel con nueces y betún de queso crema.', precio: 450, categoria: 'Pasteles', imagen: '🥕', zoom: 100 },
    { id: 2, nombre: 'Cheesecake de Fresa', descripcion: 'Clásico cheesecake estilo NY con salsa de fresa.', precio: 65, categoria: 'Cheesecakes', imagen: '🍰', zoom: 100 },
    { id: 4, nombre: 'Cupcake Red Velvet', descripcion: 'Suave pan rojo con frosting de vainilla.', precio: 35, categoria: 'Cupcakes', imagen: '🧁', zoom: 100 },
    { id: 5, nombre: 'Brownie Doble Choco', descripcion: 'Con trozos de chocolate amargo.', precio: 40, categoria: 'Brownies', imagen: '🍫', zoom: 100 },
    { id: 3, nombre: 'Fresas con Crema', descripcion: 'Fresas frescas con nuestra crema especial.', precio: 80, categoria: 'Postres', imagen: '🍓', zoom: 100 },
];
  
export const MESAS_FISICAS_INIT = [
    { id: 'M1', nombre: 'Mesa 1', tipo: 'mesa', estado: 'Libre', cuentas: [] },
    { id: 'M2', nombre: 'Mesa 2', tipo: 'mesa', estado: 'Libre', cuentas: [] },
    { id: 'M3', nombre: 'Mesa 3', tipo: 'mesa', estado: 'Libre', cuentas: [] },
    { id: 'M4', nombre: 'Mesa 4', tipo: 'mesa', estado: 'Libre', cuentas: [] },
];
  
export const SESIONES_LLEVAR_INIT = [];
  
export const VENTAS_CAFETERIA_INIT = [
    { id: 'V-101', fecha: '2025-12-05', total: 150, items: 3, hora: '08:30', cliente: 'Mesa 1 - Principal', origen: 'Cafetería' },
];
  
export const PEDIDOS_PASTELERIA_INIT = [];

// --- FUNCIÓN DE IMPRESIÓN (ACTUALIZADA NOMBRE LyA) ---
export const imprimirTicket = (datos, tipo = 'ticket') => {
    const ventana = window.open('', 'PRINT', 'height=600,width=400');
    if (!ventana) { alert("Por favor, permite las ventanas emergentes para imprimir."); return; }

    const estilos = `
        <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 80mm; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            /* CAMBIO: Fuente italic para el título */
            .title { font-size: 22px; font-weight: bold; display: block; margin-bottom: 5px; font-style: italic; }
            .subtitle { font-size: 12px; display: block; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .item-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
            .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; }
            
            .comanda-box { border: 2px solid #000; padding: 10px; border-radius: 5px; margin-top: 10px; }
            .comanda-label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #444; display: block; margin-top: 8px; }
            .comanda-value { font-size: 14px; font-weight: bold; display: block; }
            .comanda-detail { font-size: 16px; font-weight: bold; white-space: pre-wrap; background: #eee; padding: 10px; display: block; margin-top: 5px; }
        </style>
    `;

    let contenido = '';

    if (tipo === 'ticket') {
        const items = datos.items || [];
        const itemsHtml = items.map(item => `
            <div class="item-row">
                <span>${item.cantidad || 1}x ${item.nombre}</span>
                <span>$${(item.precio * (item.cantidad || 1)).toFixed(2)}</span>
            </div>
        `).join('');

        contenido = `
            <div class="header">
                <span class="title">LyA</span>
                <span class="subtitle">Ticket de Venta</span>
            </div>
            <div class="info-row"><span class="bold">Folio:</span> <span>${datos.folio || datos.id}</span></div>
            <div class="info-row"><span class="bold">Fecha:</span> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
            <div class="info-row"><span class="bold">Cliente:</span> <span>${datos.cliente || datos.nombreCliente}</span></div>
            <div class="divider"></div>
            ${itemsHtml.length > 0 ? itemsHtml : `<div class="item-row"><span>${datos.tipoProducto || 'Consumo General'}</span><span>$${datos.total}</span></div>`}
            <div class="divider"></div>
            <div class="total-row"><span>TOTAL</span><span>$${parseFloat(datos.total).toFixed(2)}</span></div>
            ${datos.saldoPendiente ? `<div class="info-row" style="margin-top:5px"><span>Restante:</span> <span>$${datos.saldoPendiente.toFixed(2)}</span></div>` : ''}
            <div class="footer">¡Gracias por su compra!<br/>Vuelva pronto</div>
        `;
    } else if (tipo === 'comanda') {
        contenido = `
            <div class="header">
                <span class="title">LyA</span>
                <span class="subtitle">COMANDA PRODUCCIÓN</span>
                <span class="subtitle">Folio: ${datos.folio}</span>
            </div>
            <div class="comanda-box">
                <span class="comanda-label">Cliente</span>
                <span class="comanda-value">${datos.cliente}</span>
                
                <span class="comanda-label">Teléfono</span>
                <span class="comanda-value">${datos.telefono}</span>

                <span class="comanda-label">Fecha Entrega</span>
                <span class="comanda-value" style="font-size: 18px">${formatearFechaLocal(datos.fechaEntrega)}</span>

                <div class="divider"></div>

                <span class="comanda-label">Producto / Categoría</span>
                <span class="comanda-value">${datos.tipoProducto}</span>

                <span class="comanda-label">Detalles / Decoración</span>
                <span class="comanda-detail">${datos.detalles}</span>
            </div>
            <div class="footer">Impreso: ${new Date().toLocaleDateString()}</div>
        `;
    }

    ventana.document.write('<html><head><title>Imprimir</title>' + estilos + '</head><body>');
    ventana.document.write(contenido);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
        ventana.print();
        ventana.close();
    }, 250);
};