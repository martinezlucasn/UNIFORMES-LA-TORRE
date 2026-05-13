import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Sale } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MonthlyData {
  month: string;
  monthName: string;
  revenue: number;
  cost: number;
  profit: number;
}

export default function Finances() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const sales = localDb.getSales();
    processFinances(sales);
  }, []);

  const processFinances = (sales: Sale[]) => {
    const monthlyMap = new Map<string, MonthlyData>();

    let tProfit = 0;
    let tRevenue = 0;

    sales.forEach(sale => {
      const date = parseISO(sale.createdAt);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yy', { locale: es });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthName,
          revenue: 0,
          cost: 0,
          profit: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      
      // Revenue is the total subtotal (before surcharge/discounts, or maybe the actual total?)
      // User says "precio de venta" vs "precio de compra". 
      // Subtotal covers the selling prices. 
      // Surcharges (card fee) usually cover processing costs, 
      // but let's stick to the core subtotal for sales revenue vs purchase cost for profit calculation.
      
      let saleRevenue = 0;
      let saleCost = 0;

      sale.items.forEach(item => {
        saleRevenue += item.subtotal;
        // If purchasePrice is missing (older sales), use sellingPrice as fallback cost (0 profit) 
        // or just 0. Better to assume 0 profit if data is missing.
        saleCost += (item.purchasePrice || item.price) * item.quantity;
      });

      monthData.revenue += saleRevenue;
      monthData.cost += saleCost;
      monthData.profit += (saleRevenue - saleCost);

      tRevenue += saleRevenue;
      tProfit += (saleRevenue - saleCost);
    });

    const sortedData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    setData(sortedData);
    setTotalRevenue(tRevenue);
    setTotalProfit(tProfit);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="border-l-8 border-slate-900 pl-6 mb-12">
        <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic">Finanzas</h1>
        <p className="text-emerald-600 text-xl font-bold uppercase tracking-widest">Balance de Ganancias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="Facturación Total (Ventas)" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={<DollarSign className="text-blue-600" />}
          description="Bruto acumulado"
        />
        <StatCard 
          title="Ganancia Neta" 
          value={`$${totalProfit.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-600" />}
          description="Diferencia Venta/Costo"
          highlight
        />
        <StatCard 
          title="Margen Promedio" 
          value={totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'} 
          icon={<PieChart className="text-amber-600" />}
          description="Rentabilidad del negocio"
        />
      </div>

      <div className="bg-white border-8 border-black p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Evolución de Ganancias</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-600"></div>
              <span className="text-[10px] font-black uppercase">Ganancia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300"></div>
              <span className="text-[10px] font-black uppercase">Ventas Brutas</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }}
                axisLine={{ stroke: '#000', strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#000' }}
                axisLine={{ stroke: '#000', strokeWidth: 2 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#000', 
                  border: 'none', 
                  borderRadius: '0',
                  color: '#fff',
                  fontFamily: 'Arial',
                  fontWeight: 900,
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#50C878', marginBottom: '4px' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="revenue" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Ventas" />
              <Bar dataKey="profit" fill="#059669" radius={[4, 4, 0, 0]} name="Ganancia" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 text-white border-8 border-black p-8 shadow-2xl">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Detalle por Período</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-4 border-slate-700">
                <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mes</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ventas</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Costo (Mercadería)</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ganancia</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                  <td className="py-4 font-black uppercase italic text-sm">{row.monthName}</td>
                  <td className="py-4 text-right font-bold text-slate-300">${row.revenue.toLocaleString()}</td>
                  <td className="py-4 text-right font-bold text-slate-300">${row.cost.toLocaleString()}</td>
                  <td className="py-4 text-right font-black text-emerald-400 text-lg">${row.profit.toLocaleString()}</td>
                  <td className="py-4 text-right font-black text-emerald-600">
                    <span className="bg-emerald-400/10 px-2 py-1 flex items-center justify-end gap-1 ml-auto w-fit">
                      {((row.profit / row.revenue) * 100).toFixed(0)}%
                      <ArrowUpRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 font-black uppercase italic">Sin datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, highlight }: { title: string, value: string, icon: React.ReactNode, description: string, highlight?: boolean }) {
  return (
    <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${highlight ? 'bg-emerald-900 text-white' : 'bg-white text-slate-900'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-none border-2 border-black ${highlight ? 'bg-white' : 'bg-slate-50'}`}>
          {icon}
        </div>
        {highlight && <ArrowUpRight className="text-emerald-400" size={24} />}
      </div>
      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-emerald-400' : 'text-slate-500'}`}>{title}</h4>
      <p className="text-4xl font-black italic tracking-tighter overflow-hidden truncate">{value}</p>
      <p className={`text-[9px] font-bold uppercase mt-2 ${highlight ? 'text-emerald-500' : 'text-slate-400'}`}>{description}</p>
    </div>
  );
}
