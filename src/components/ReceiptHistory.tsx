import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Sale } from '../types';
import { FileText, Download, User, Calendar, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { generateReceiptPDF } from '../PDFGenerator';

export default function ReceiptHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales'));
    return () => unsubscribe();
  }, []);

  const handleDownload = (sale: Sale) => {
    generateReceiptPDF(sale);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-end gap-6 mb-12 border-b-8 border-emerald-900 pb-4">
        <h2 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter">Historial</h2>
        <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-1">Registro de Operaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase italic text-2xl">Cargando Archivos...</div>
        ) : sales.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase italic text-2xl border-4 border-dotted border-slate-100">No hay ventas registradas.</div>
        ) : sales.map(sale => (
          <div key={sale.id} className="bg-white border-t-8 border-slate-900 shadow-2xl p-8 hover:transform hover:-translate-y-2 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-tighter z-10">
              {sale.receiptNumber}
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter font-sans italic">${sale.total.toFixed(0)}</h3>
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
                <span>{sale.createdAt ? format(sale.createdAt.toDate(), 'dd MMMM yyyy') : '...'}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Clock size={14} className="text-emerald-600" />
                <span>{sale.createdAt ? format(sale.createdAt.toDate(), 'HH:mm') : '...'}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 p-2">
                <User size={14} className="text-emerald-600" />
                <span className="truncate">{sale.customerName || 'Consumidor Final'}</span>
              </div>
            </div>

            <div className="border-t-2 border-slate-50 pt-4">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Detalle de Compra</p>
              <div className="flex flex-wrap gap-2">
                {sale.items.map((item, idx) => (
                  <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-900 px-2 py-1 font-black uppercase tracking-tighter">
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
