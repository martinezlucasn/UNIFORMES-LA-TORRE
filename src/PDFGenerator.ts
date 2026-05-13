import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Sale } from './types';

export const generateReceiptPDF = (sale: Sale) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('Uniformes La Torre', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Avenida 44 numero 1873, entre 132 y 133, La Plata', pageWidth / 2, 28, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);
  
  // Sale Info
  doc.setFontSize(12);
  doc.text(`Boleta Nro: ${sale.receiptNumber}`, 20, 45);
  doc.text(`Fecha: ${format(new Date(sale.createdAt.toDate ? sale.createdAt.toDate() : sale.createdAt), 'dd/MM/yyyy HH:mm')}`, pageWidth - 20, 45, { align: 'right' });
  
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 20, 55);
  }
  
  // Table
  const tableData = sale.items.map(item => [
    item.name,
    item.quantity.toString(),
    `$${item.price.toFixed(2)}`,
    `$${item.subtotal.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: sale.customerName ? 65 : 55,
    head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] },
    margin: { left: 20, right: 20 }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  doc.setFontSize(11);
  doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
  
  if (sale.surcharge > 0) {
    doc.text(`Recargo Tarjeta (10%): $${sale.surcharge.toFixed(2)}`, pageWidth - 20, finalY + 7, { align: 'right' });
  } else if (sale.paymentMethod === 'cash' || sale.paymentMethod === 'transfer') {
    doc.setFontSize(10);
    doc.text('Descuento aplicado', pageWidth - 20, finalY + 7, { align: 'right' });
    doc.setFontSize(11);
  }
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const totalY = sale.surcharge > 0 || sale.paymentMethod !== 'card' ? finalY + 15 : finalY + 10;
  doc.text(`TOTAL: $${sale.total.toFixed(2)}`, pageWidth - 20, totalY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('¡Gracias por su compra!', pageWidth / 2, totalY + 20, { align: 'center' });
  
  doc.save(`boleta_${sale.receiptNumber}.pdf`);
};
