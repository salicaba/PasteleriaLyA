import { jsPDF } from "jspdf";

const URL_PRODUCCION = 'https://pastelerialya-cd733.web.app'; 

export const OBTENER_URL_BASE = () => {
    // Si estamos probando en tu compu, usa localhost.
    // Si ya está subido, usa la dirección de internet.
    if (window.location.hostname.includes('localhost')) {
        return window.location.origin; 
    }
    return URL_PRODUCCION;
};

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
  
// --- DATA INICIAL (LIMPIA) ---
export const ORDEN_CATEGORIAS = [
    'Bebidas Calientes', 'Bebidas Frías', 'Pasteles', 'Cheesecakes', 'Rosca', 'Cupcakes', 'Brownies', 'Postres', 'Otros'
];
  
export const PRODUCTOS_CAFETERIA_INIT = [];
export const MESAS_FISICAS_INIT = [];
export const SESIONES_LLEVAR_INIT = [];
export const VENTAS_CAFETERIA_INIT = [];
export const PEDIDOS_PASTELERIA_INIT = [];

// --- FUNCIÓN DE IMPRESIÓN CLÁSICA (NAVEGADOR) ---
export const imprimirTicket = (datos, tipo = 'ticket') => {
    const ventana = window.open('', 'PRINT', 'height=600,width=400');
    if (!ventana) { alert("Por favor, permite las ventanas emergentes para imprimir."); return; }

    const estilos = `
        <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 80mm; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; display: block; margin-bottom: 5px; font-style: italic; }
            .subtitle { font-size: 12px; display: block; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .item-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; align-items: flex-start; }
            .item-name-group { display: flex; flex-direction: column; }
            .item-calc { font-size: 10px; color: #555; margin-top: 2px; }
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
                <div class="item-name-group">
                    <span>${item.cantidad || 1}x ${item.nombre}</span>
                    <span class="item-calc">$${item.precio} x ${item.cantidad || 1}</span>
                </div>
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
            
            ${datos.recibido ? `
                <div class="info-row" style="margin-top: 5px;"><span>Efectivo recibido:</span> <span>$${parseFloat(datos.recibido).toFixed(2)}</span></div>
                <div class="info-row"><span>Cambio:</span> <span>$${parseFloat(datos.cambio).toFixed(2)}</span></div>
            ` : ''}

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

                <div class="divider"></div>
                
                <span class="comanda-label">Costo Total del Pedido</span>
                <span class="comanda-value" style="font-size: 18px">$${parseFloat(datos.total).toFixed(2)}</span>
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

// --- NUEVA FUNCIÓN: GENERAR Y DESCARGAR PDF (CLIENTE) ---
export const generarTicketPDF = (datos) => {
    // 80mm de ancho para simular ticket
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200]
    });

    let y = 10; // Posición Y inicial

    // Helper para centrar texto horizontalmente
    const centerText = (text, yPos) => {
        const fontSize = doc.getFontSize();
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, yPos);
    };

    // --- ENCABEZADO ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    centerText("LyA", y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    centerText("Ticket de Compra", y);
    y += 6;
    
    // --- INFO GENERAL ---
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 5, y);
    y += 5;
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 5, y);
    y += 5;
    
    const clienteNombre = datos.cliente || datos.nombreCliente || 'Mostrador';
    doc.text(`Cliente: ${clienteNombre}`, 5, y);
    y += 6;

    // Línea separadora
    doc.line(5, y, 75, y); 
    y += 5;

    // --- LISTA DE PRODUCTOS ---
    const items = datos.items || datos.cuenta || [];
    items.forEach(item => {
        const cantidad = item.cantidad || 1;
        const totalItem = (item.precio * cantidad).toFixed(2);
        
        // Cortar nombre si es muy largo para que no se salga del ticket
        let nombre = item.nombre;
        if (nombre.length > 20) {
            nombre = nombre.substring(0, 20) + "...";
        }

        doc.setFontSize(9); // Asegurar tamaño normal
        doc.setTextColor(0, 0, 0); // Asegurar color negro
        doc.text(`${cantidad}x ${nombre}`, 5, y);
        doc.text(`$${totalItem}`, 75, y, { align: "right" });
        
        // --- AQUÍ: Agregado el desglose del precio unitario en PDF ---
        y += 4;
        doc.setFontSize(7); // Letra más pequeña para el detalle
        doc.setTextColor(100, 100, 100); // Color grisáceo
        doc.text(`$${item.precio} x ${cantidad}`, 5, y);
        
        y += 4; // Espacio para el siguiente item (aumentado para caber el desglose)
    });

    // Resetear estilos por si acaso
    doc.setFontSize(9); 
    doc.setTextColor(0, 0, 0);

    // Línea separadora final
    y += 2;
    doc.line(5, y, 75, y);
    y += 6;

    // --- TOTALES ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 5, y);
    doc.text(`$${parseFloat(datos.total).toFixed(2)}`, 75, y, { align: "right" });
    y += 10;

    // --- PIE DE PÁGINA ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    centerText("¡Gracias por su preferencia!", y);
    y += 5;
    centerText("Pastelería y Cafetería LyA", y);

    // Guardar archivo
    doc.save(`Ticket_LyA_${Date.now()}.pdf`);
};