import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale, Rental } from './types';

export const generateReceiptPDF = (sale: Sale) => {
  // Use A5 landscape or a smaller format to represent half page, 
  // or stick to A4 and draw in a half-width section.
  // User asked for "costado de la hoja" (side of the page), let's use A5 or similar.
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [148, 210] // A5 size
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Right side info (Top Right)
  doc.setFontSize(7);
  doc.setFont('Helvetica', 'italic');
  doc.text('No válido como factura comercial.', pageWidth - 10, 8, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Boleta Nro: ${sale.receiptNumber}`, pageWidth - 10, 14, { align: 'right' });
  
  let dateObj: Date;
  if (typeof sale.createdAt === 'string') {
    dateObj = new Date(sale.createdAt);
  } else if ((sale.createdAt as any)?.toDate) {
    dateObj = (sale.createdAt as any).toDate();
  } else {
    dateObj = new Date(sale.createdAt as any);
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha: ${format(dateObj, 'dd/MM/yyyy HH:mm')}`, pageWidth - 10, 19, { align: 'right' });

  if (sale.customerName) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Cliente: ${sale.customerName}`, pageWidth - 10, 24, { align: 'right' });
  }

  // Left side info
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.setFont('Helvetica', 'bold');
  doc.text('Uniformes La Torre', 10, 12);
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'normal');
  doc.text('Av. 44 Nº 1873 e/ 132 y 133, La Plata', 10, 18);
  doc.text('Whatsapp: (0221) 15-3090741', 10, 23);

  doc.setLineWidth(0.3);
  doc.line(10, 28, pageWidth - 10, 28);
  
  // Helper for localized currency (dots for thousands, no decimals)
  const f = (n: number) => Math.round(n).toLocaleString('es-AR');
  
  // Table
  const tableData = sale.items.map(item => [
    item.size ? `${item.name} (${item.size})` : item.name,
    item.quantity.toString(),
    `$${f(item.price)}`,
    `$${f(item.subtotal)}`
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [['Producto', 'Cant.', 'Precio', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 10, right: 10 }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  
  // Totals
  doc.setFontSize(9);
  
  if (sale.surcharge > 0) {
    doc.text(`Recargo Tarjeta (10%): $${f(sale.surcharge)}`, pageWidth - 10, finalY, { align: 'right' });
  } else if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
    doc.text('Descuento aplicado', pageWidth - 10, finalY, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  const totalY = (sale.surcharge > 0 || sale.paymentMethod !== 'card') ? finalY + 8 : finalY;
  const totalText = `TOTAL: $${f(sale.total)}`;
  const textWidth = doc.getTextWidth(totalText);
  
  // Draw box around total
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 10 - textWidth - 4, totalY - 7, textWidth + 8, 10);
  doc.text(totalText, pageWidth - 14, totalY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'italic');
  
  if (sale.deposit && sale.deposit > 0) {
    doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 6, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`SEÑA / PAGO: $${f(sale.deposit)}`, pageWidth - 10, totalY + 14, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.text(`SALDO PENDIENTE: $${f(sale.balanceDue || 0)}`, pageWidth - 10, totalY + 20, { align: 'right' });
  } else {
    doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 8, { align: 'center' });
  }

  // Contact Info at bottom left
  if (sale.customerContact) {
    const bottomY = doc.internal.pageSize.getHeight() - 10;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Nro contacto: ${sale.customerContact}`, 10, bottomY);
  }
  
  doc.save(`boleta_${sale.receiptNumber}.pdf`);
};

export const generateQuotePDF = (quoteItems: any[], customerName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const subtotal = quoteItems.reduce((acc, item) => acc + item.subtotal, 0);
  
  // Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('PRESUPUESTO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Uniformes La Torre', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-400
  doc.setFont('Helvetica', 'normal');
  doc.text('Avenida 44 numero 1873, entre 132 y 133, La Plata', pageWidth / 2, 34, { align: 'center' });
  doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, 38, { align: 'center' });
  
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(20, 45, pageWidth - 20, 45);
  
  if (customerName) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Para: ${customerName}`, 20, 55);
  }
  
  // Helper for localized currency
  const f = (n: number) => Math.round(n).toLocaleString('es-AR');

  // Table
  const tableData = quoteItems.map(item => [
    item.name,
    item.quantity.toString(),
    `$${f(item.price)}`,
    `$${f(item.subtotal)}`
  ]);
  
  autoTable(doc, {
    startY: customerName ? 60 : 50,
    head: [['Producto', 'Cant.', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 20, right: 20 }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Payment Options
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text('OPCIONES DE PAGO:', 20, finalY);
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  
  // 1. Cash / Transfer
  doc.text('1. Efectivo o Transferencia:', 25, finalY + 10);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${f(subtotal)}`, pageWidth - 25, finalY + 10, { align: 'right' });
  
  // 2. Card 1 Payment
  const card1Total = subtotal * 1.10;
  doc.setFont('Helvetica', 'normal');
  doc.text('2. Tarjeta de Crédito (1 Pago - 10% recargo):', 25, finalY + 18);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${f(card1Total)}`, pageWidth - 25, finalY + 18, { align: 'right' });
  
  // 3. 3 Installments (+34.66%)
  const total3 = subtotal * 1.3466;
  const cuota3 = total3 / 3;
  doc.setFont('Helvetica', 'normal');
  doc.text('3. Tarjeta de Crédito (3 Cuotas - 34.66% recargo):', 25, finalY + 26);
  doc.setFont('Helvetica', 'bold');
  doc.text(`3 cuotas de $${f(cuota3)}`, pageWidth - 25, finalY + 26, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text(`Total en cuotas: $${f(total3)}`, pageWidth - 25, finalY + 30, { align: 'right' });
  
  // 4. 6 Installments (+51.71%)
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const total6 = subtotal * 1.5171;
  const cuota6 = total6 / 6;
  doc.text('4. Tarjeta de Crédito (6 Cuotas - 51.71% recargo):', 25, finalY + 38);
  doc.setFont('Helvetica', 'bold');
  doc.text(`6 cuotas de $${f(cuota6)}`, pageWidth - 25, finalY + 38, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text(`Total en cuotas: $${f(total6)}`, pageWidth - 25, finalY + 42, { align: 'right' });
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const footerY = 280;
  doc.text('Este presupuesto tiene una validez de 7 días corridos.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Precios sujetos a cambios sin previo aviso.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  doc.save(`presupuesto_${customerName || 'sin_nombre'}.pdf`);
};

export const generateRentalReceiptPDF = (rental: Rental) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const f = (n: number) => Math.round(n).toLocaleString('es-AR');

  const drawHalf = (yOffset: number, isCopyComercio: boolean) => {
    // Top Copy Type Indicator
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Documento no válido como factura comercial. ${isCopyComercio ? 'COPIA COMERCIO' : 'COPIA CLIENTE'}`,
      pageWidth / 2,
      yOffset + 7,
      { align: 'center' }
    );

    // Upper Center Logo
    const logoBase64 = localStorage.getItem('torre_store_logo');
    if (logoBase64) {
      try {
        const props = doc.getImageProperties(logoBase64);
        const imgWidth = props.width;
        const imgHeight = props.height;
        const aspectRatio = imgWidth / imgHeight;

        // Base width is 4 centimeters (40 mm) as requested
        let logoWidth = 40;
        let logoHeight = logoWidth / aspectRatio;

        // To prevent layout overflow if the logo is extremely tall:
        // constrain height to max 18 mm and scale width down accordingly.
        if (logoHeight > 18) {
          logoHeight = 18;
          logoWidth = logoHeight * aspectRatio;
        }

        const xPos = pageWidth / 2 - logoWidth / 2;
        // Vertically center inside the 18 mm tall space (from yOffset + 10 to yOffset + 28)
        const yPos = yOffset + 10 + (18 - logoHeight) / 2;

        doc.addImage(logoBase64, props.fileType, xPos, yPos, logoWidth, logoHeight);
      } catch (e) {
        console.error("Error adding store logo to PDF", e);
        // Fallback: draw placeholder text
        doc.setFontSize(14);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(5, 150, 105);
        doc.text('Uniformes La Torre', pageWidth / 2, yOffset + 21, { align: 'center' });
      }
    } else {
      // Fallback text "Uniformes La Torre" in big bold text centered
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('Uniformes La Torre', pageWidth / 2, yOffset + 21, { align: 'center' });
    }

    // Top left header: Dirección and below Whatsapp
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.text('Av. 44 132 y 133', 15, yOffset + 18);
    doc.setFont('Helvetica', 'normal');
    doc.text('Whatsapp: (0221) 15-3090741', 15, yOffset + 23);

    // Top right header: Fecha, below Hora, below Número de Boleta
    const dateObj = new Date(rental.rentalDate);
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Fecha: ${format(dateObj, 'dd/MM/yyyy')}`, pageWidth - 15, yOffset + 16, { align: 'right' });
    doc.text(`Hora: ${format(dateObj, 'HH:mm')}`, pageWidth - 15, yOffset + 21, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.text(`Boleta N°: ${rental.receiptNumber}`, pageWidth - 15, yOffset + 26, { align: 'right' });

    // Decorative Separator
    doc.setDrawColor(15, 23, 42); // slate-900 / black
    doc.setLineWidth(0.6);
    doc.line(15, yOffset + 29, pageWidth - 15, yOffset + 29);

    // Client Info Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setLineWidth(0.3);
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.rect(15, yOffset + 32, pageWidth - 30, 22, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DATOS DE LA PERSONA QUE ALQUILA:', 18, yOffset + 37);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(`Nombre y Apellido:`, 18, yOffset + 42);
    doc.setFont('Helvetica', 'normal');
    doc.text(rental.customerName, 50, yOffset + 42);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Teléfono / Contacto:`, 18, yOffset + 47);
    doc.setFont('Helvetica', 'normal');
    doc.text(rental.customerContact, 50, yOffset + 47);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Domicilio / Dirección:`, 18, yOffset + 52);
    doc.setFont('Helvetica', 'normal');
    doc.text(rental.customerAddress, 50, yOffset + 52);

    // Table of Rented Products
    const tableData = rental.items && rental.items.length > 0
      ? rental.items.map(item => [
          item.productName,
          item.quantity.toString(),
          `$${f(item.price)}`,
          `$${f(item.price * item.quantity)}`
        ])
      : [
          [
            rental.productName || 'PRENDA ALQUILADA',
            '1',
            `$${f(rental.price || 0)}`,
            `$${f(rental.price || 0)}`
          ]
        ];

    autoTable(doc, {
      startY: yOffset + 58,
      head: [['Artículo Alquilado', 'Cant.', 'Precio de Alquiler', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      margin: { left: 15, right: 15 },
      styles: { cellPadding: 2 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Total Display
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const totalAmount = rental.total !== undefined ? rental.total : (rental.price || 0);
    const totalText = `TOTAL ALQUILER: $${f(totalAmount)}`;
    const textWidth = doc.getTextWidth(totalText);
    doc.rect(pageWidth - 15 - textWidth - 4, finalY - 5, textWidth + 8, 8);
    doc.text(totalText, pageWidth - 19, finalY + 1, { align: 'right' });

    // Terms and Conditions Box
    const termsY = finalY + 7;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('MODO DE USO Y CONDICIONES GENERALES:', 15, termsY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600

    const wrappedTerms = doc.splitTextToSize(rental.terms, pageWidth - 30);
    const termsHeight = wrappedTerms.length * 3.5 + 4;
    doc.rect(15, termsY + 2, pageWidth - 30, termsHeight, 'S');
    doc.text(wrappedTerms, 18, termsY + 6);

    // Signatures at bottom
    const sigY = termsY + termsHeight + 12;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    
    // Client signature line
    doc.line(20, sigY, 75, sigY);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Firma del Cliente', 47.5, sigY + 4, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.text(`Aclaración: _________________`, 20, sigY + 8);

    // Store signature line
    doc.line(pageWidth - 75, sigY, pageWidth - 20, sigY);
    doc.setFont('Helvetica', 'bold');
    doc.text('Por Uniformes La Torre', pageWidth - 47.5, sigY + 4, { align: 'center' });
  };

  // Draw Top Half (Cliente Copy)
  drawHalf(0, false);

  // Dash Line in the Middle
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, 148.5, pageWidth - 10, 148.5);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('Helvetica', 'bold');
  doc.text('--- CORTAR AQUÍ (ENTREGAR UNA COPIA AL CLIENTE Y ARCHIVAR LA OTRA) ---', pageWidth / 2, 147.5, { align: 'center' });

  // Reset dash pattern
  doc.setLineDashPattern([], 0);

  // Draw Bottom Half (Comercio Copy)
  drawHalf(148.5, true);

  doc.save(`boleta_alquiler_${rental.receiptNumber}.pdf`);
};

