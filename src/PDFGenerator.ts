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
  
  // Logo
  try {
    doc.addImage('/logo.png', 'PNG', pageWidth / 2 - 15, 5, 30, 30);
  } catch (e) {
    console.error('Core: could not load logo for PDF');
  }

  // Header
  doc.setFont('Helvetica', 'bold'); // Arial fallback in jsPDF
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Uniformes La Torre', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'normal');
  doc.text('Avenida 44 numero 1873, entre 132 y 133, La Plata', pageWidth / 2, 46, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(10, 50, pageWidth - 10, 50);
  
  // Sale Info
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Boleta Nro: ${sale.receiptNumber}`, 10, 58);
  
  let dateObj: Date;
  if (typeof sale.createdAt === 'string') {
    dateObj = new Date(sale.createdAt);
  } else if ((sale.createdAt as any)?.toDate) {
    dateObj = (sale.createdAt as any).toDate();
  } else {
    dateObj = new Date(sale.createdAt as any);
  }

  doc.setFont('Helvetica', 'normal');
  doc.text(`Fecha: ${format(dateObj, 'dd/MM/yyyy HH:mm')}`, pageWidth - 10, 58, { align: 'right' });
  
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 10, 64);
  }
  
  // Table
  const tableData = sale.items.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${item.subtotal.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: sale.customerName ? 70 : 64,
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
  doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, pageWidth - 10, finalY, { align: 'right' });
  
  if (sale.surcharge > 0) {
    doc.text(`Recargo Tarjeta (10%): $${sale.surcharge.toFixed(2)}`, pageWidth - 10, finalY + 5, { align: 'right' });
  } else if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
    doc.text('Descuento aplicado', pageWidth - 10, finalY + 5, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  const totalY = sale.surcharge > 0 || sale.paymentMethod !== 'card' ? finalY + 12 : finalY + 8;
  doc.text(`TOTAL: $${sale.total.toFixed(2)}`, pageWidth - 10, totalY, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.text('No válido como factura comercial.', pageWidth / 2, totalY + 10, { align: 'center' });
  doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 15, { align: 'center' });
  
  doc.save(`boleta_${sale.receiptNumber}.pdf`);
};
