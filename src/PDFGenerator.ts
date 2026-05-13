import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale } from './types';

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
  
  // Header
  doc.setFont('Helvetica', 'bold'); // Arial fallback in jsPDF
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Uniformes La Torre', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'normal');
  doc.text('Avenida 44 numero 1873, entre 132 y 133, La Plata', pageWidth / 2, 18, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(10, 22, pageWidth - 10, 22);
  
  // Non-valid info
  doc.setFontSize(7);
  doc.setFont('Helvetica', 'italic');
  doc.text('No válido como factura comercial.', pageWidth / 2, 26, { align: 'center' });

  // Sale Info
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Boleta Nro: ${sale.receiptNumber}`, 10, 32);
  
  let dateObj: Date;
  if (typeof sale.createdAt === 'string') {
    dateObj = new Date(sale.createdAt);
  } else if ((sale.createdAt as any)?.toDate) {
    dateObj = (sale.createdAt as any).toDate();
  } else {
    dateObj = new Date(sale.createdAt as any);
  }

  doc.setFont('Helvetica', 'normal');
  doc.text(`Fecha: ${format(dateObj, 'dd/MM/yyyy HH:mm')}`, pageWidth - 10, 32, { align: 'right' });
  
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 10, 38);
  }
  
  // Table
  const tableData = sale.items.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${item.subtotal.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: sale.customerName ? 44 : 38,
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
    doc.text(`Recargo Tarjeta (10%): $${sale.surcharge.toFixed(2)}`, pageWidth - 10, finalY, { align: 'right' });
  } else if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
    doc.text('Descuento aplicado', pageWidth - 10, finalY, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  const totalY = (sale.surcharge > 0 || sale.paymentMethod !== 'card') ? finalY + 8 : finalY;
  doc.text(`TOTAL: $${sale.total.toFixed(2)}`, pageWidth - 10, totalY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'italic');
  
  if (sale.deposit && sale.deposit > 0) {
    doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 6, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`SEÑA / PAGO: $${sale.deposit.toFixed(2)}`, pageWidth - 10, totalY + 14, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.text(`SALDO PENDIENTE: $${(sale.balanceDue || 0).toFixed(2)}`, pageWidth - 10, totalY + 20, { align: 'right' });
  } else {
    doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 8, { align: 'center' });
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
  
  // Table
  const tableData = quoteItems.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${item.subtotal.toFixed(2)}`
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
  doc.text(`$${subtotal.toLocaleString()}`, pageWidth - 25, finalY + 10, { align: 'right' });
  
  // 2. Card 1 Payment (Assuming 10% surcharge as in sales or maybe flat? User didn't specify. I'll use +10% as it's standard for them)
  const card1Total = subtotal * 1.10;
  doc.setFont('Helvetica', 'normal');
  doc.text('2. Tarjeta de Crédito (1 Pago - 10% recargo):', 25, finalY + 18);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${card1Total.toLocaleString()}`, pageWidth - 25, finalY + 18, { align: 'right' });
  
  // 3. 3 Installments (+34.66%)
  const total3 = subtotal * 1.3466;
  const cuota3 = total3 / 3;
  doc.setFont('Helvetica', 'normal');
  doc.text('3. Tarjeta de Crédito (3 Cuotas - 34.66% recargo):', 25, finalY + 26);
  doc.setFont('Helvetica', 'bold');
  doc.text(`3 cuotas de $${cuota3.toLocaleString()}`, pageWidth - 25, finalY + 26, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text(`Total en cuotas: $${total3.toLocaleString()}`, pageWidth - 25, finalY + 30, { align: 'right' });
  
  // 4. 6 Installments (+51.71%)
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const total6 = subtotal * 1.5171;
  const cuota6 = total6 / 6;
  doc.text('4. Tarjeta de Crédito (6 Cuotas - 51.71% recargo):', 25, finalY + 38);
  doc.setFont('Helvetica', 'bold');
  doc.text(`6 cuotas de $${cuota6.toLocaleString()}`, pageWidth - 25, finalY + 38, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text(`Total en cuotas: $${total6.toLocaleString()}`, pageWidth - 25, finalY + 42, { align: 'right' });
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const footerY = 280;
  doc.text('Este presupuesto tiene una validez de 7 días corridos.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Precios sujetos a cambios sin previo aviso.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  doc.save(`presupuesto_${customerName || 'sin_nombre'}.pdf`);
};
