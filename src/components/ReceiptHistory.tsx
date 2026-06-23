import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Sale } from '../types';
import { FileText, Download, User, Calendar, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { generateReceiptPDF } from '../PDFGenerator';

export default function ReceiptHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(localDb.getSales());
    setLoading(false);
  };

  const handleDownload = (sale: Sale) => {
    generateReceiptPDF(sale);
  };

  // Filter sales based on search term
  const filteredSales = sales.filter(sale => sale.receiptNumber.includes(searchTerm));

  // Group sales by day
  const groupedSales: { [dateStr: string]: { dateLabel: string; sales: Sale[]; dailyTotal: number } } = {};

  filteredSales.forEach(sale => {
    let dateKey = 'sin-fecha';
    let dateLabel = 'Sin Fecha';
    
    if (sale.createdAt) {
      try {
        const d = new Date(sale.createdAt);
        dateKey = format(d, 'yyyy-MM-dd');
        const labelRaw = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        // Capitalize month names (e.g., "22 de mayo de 2026" -> "22 de Mayo de 2026")
        dateLabel = labelRaw.replace(/ de ([a-z])/g, (match, letter) => ' de ' + letter.toUpperCase());
      } catch (e) {
        // Fallback
      }
    }
    
    if (!groupedSales[dateKey]) {
      groupedSales[dateKey] = {
        dateLabel,
        sales: [],
        dailyTotal: 0
      };
    }
    
    groupedSales[dateKey].sales.push(sale);
    groupedSales[dateKey].dailyTotal += sale.total;
  });

  // Sort dates descending (newest first)
  const sortedDateKeys = Object.keys(groupedSales).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-end gap-6 mb-10 border-b-[6px] border-emerald-900 pb-4">
        <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Historial</h2>
        <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-1">Registro de Operaciones</p>
      </div>

      {/* Filtro de búsqueda */}
      <div className="bold-card p-4 mb-8 flex items-center gap-4 bg-white border-4 border-emerald-900 shadow-[8px_8px_0px_0px_rgba(6,78,59,1)]">
        <div className="bg-emerald-900 p-2 text-white italic font-black text-xs uppercase tracking-widest px-4">BUSCAR BOLETA</div>
        <input
          type="text"
          className="w-full h-full outline-none text-xl font-black uppercase tracking-tighter placeholder:text-slate-200"
          placeholder="Escriba el número de boleta (ej: 00001)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-300 font-black uppercase italic text-2xl">Cargando Archivos...</div>
      ) : sales.length === 0 ? (
        <div className="py-20 text-center text-slate-300 font-black uppercase italic text-2xl border-4 border-dotted border-slate-100">No hay ventas registradas.</div>
      ) : sortedDateKeys.length === 0 ? (
        <div className="py-20 text-center text-slate-300 font-black uppercase italic text-2xl border-4 border-dotted border-slate-100">No se encontraron ventas para la búsqueda.</div>
      ) : (
        <div className="space-y-12">
          {sortedDateKeys.map(dateKey => {
            const group = groupedSales[dateKey];
            return (
              <div key={dateKey} className="space-y-6">
                {/* Cabecera del Día con Suma Total - Estilo Neobrutalista */}
                <div className="bg-white border-4 border-slate-900 p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-emerald-600 w-6 h-6 flex-shrink-0" />
                    <h3 className="text-xl md:text-2xl font-black uppercase italic text-slate-900 tracking-tight leading-none">
                      {group.dateLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 justify-between md:justify-end border-t-2 md:border-t-0 pt-2 md:pt-0 border-dashed border-slate-100">
                    <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">
                      VENTAS DEL DÍA:
                    </span>
                    <span className="bg-emerald-100 text-emerald-990 px-4 py-2 border-2 border-slate-900 font-black text-base md:text-xl tracking-tighter shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] italic">
                      ${Math.round(group.dailyTotal).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Grilla de Ventas del Día */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.sales.map(sale => (
                    <div key={sale.id} className="bg-white border-t-8 border-slate-900 shadow-2xl p-8 hover:transform hover:-translate-y-2 transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-tighter z-10">
                        {sale.receiptNumber}
                      </div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tighter font-sans italic">${Math.round(sale.total).toLocaleString('es-AR')}</h3>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${sale.paymentMethod === 'card' ? 'text-emerald-600' : 'text-blue-600'}`}>
                            PAGO {sale.paymentMethod}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(sale)}
                          className="bg-emerald-100 text-emerald-900 p-3 hover:bg-emerald-600 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(6,78,59,1)]"
                          title="Descargar PDF"
                        >
                          <Download size={24} />
                        </button>
                      </div>

                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar size={14} className="text-emerald-600" />
                          <span>{sale.createdAt ? format(new Date(sale.createdAt), 'dd MMMM yyyy') : '...'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock size={14} className="text-emerald-600" />
                          <span>{sale.createdAt ? format(new Date(sale.createdAt), 'HH:mm') : '...'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 p-2">
                          <User size={14} className="text-emerald-600" />
                          <span className="truncate">{sale.customerName || 'Consumidor Final'}</span>
                        </div>
                      </div>

                      <div className="border-t-2 border-slate-100 pt-4">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Detalle de Compra</p>
                        <div className="flex flex-wrap gap-2">
                          {sale.items.map((item, idx) => (
                            <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-900 px-2 py-1 font-black uppercase tracking-tighter border border-emerald-100">
                              {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
