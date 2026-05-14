import React, { useState } from 'react';
import { localDb } from '../localDb';
import { Banknote, User, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const EMPLOYEES = ['SAMANTA', 'BRAIAN', 'ROMINA'];

export default function Adelantos({ onBack }: { onBack: () => void }) {
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({
    SAMANTA: '',
    BRAIAN: '',
    ROMINA: ''
  });

  const handleSave = (employee: string) => {
    const amount = parseFloat(amounts[employee]);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, ingrese un monto válido');
      return;
    }

    localDb.addExpense({
      name: `ADELANTO ${employee}`,
      amount: amount,
      date: new Date().toISOString()
    });

    setAmounts({ ...amounts, [employee]: '' });
    alert(`Adelanto para ${employee} guardado con éxito`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div className="border-l-[6px] border-emerald-900 pl-5">
          <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic">Adelantos</h1>
          <p className="text-emerald-600 font-bold uppercase tracking-widest">Personal Uniformes La Torre</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-slate-900 text-white p-4 hover:bg-emerald-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="font-black italic uppercase text-xs">Volver</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {EMPLOYEES.map((emp) => (
          <motion.div
            key={emp}
            whileHover={{ y: -5 }}
            className="bg-white border-[6px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="bg-slate-100 p-4 mb-6 flex justify-center border-2 border-slate-200">
              <User size={48} className="text-slate-900" />
            </div>
            
            <h3 className="text-2xl font-black text-center uppercase italic mb-6 tracking-tighter">{emp}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Monto del Adelanto</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Banknote size={16} />
                  </div>
                  <input
                    type="number"
                    value={amounts[emp]}
                    onChange={(e) => setAmounts({ ...amounts, [emp]: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-4 border-slate-900 font-black italic text-xl outline-none focus:bg-emerald-50"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <button
                onClick={() => handleSave(emp)}
                className="w-full bg-emerald-600 text-white py-4 font-black uppercase italic tracking-tighter hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(6,78,59,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                <Send size={18} />
                Confirmar Pago
              </button>
            </div>
          </motion.div>
        ))}
      </div>


    </div>
  );
}
