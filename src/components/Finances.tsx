import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Sale, Expense, Rental } from '../types';
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
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, ShoppingCart, MinusCircle, Plus, Trash2, Wallet } from 'lucide-react';

interface MonthlyData {
  month: string;
  monthName: string;
  revenue: number;
  productCost: number;
  opExpenses: number;
  totalCost: number;
  profit: number;
}

export default function Finances() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sales = localDb.getSales();
    const exps = localDb.getExpenses();
    const rentals = localDb.getRentals();
    setExpenses(exps);
    processFinances(sales, exps, rentals);
  };

  const isStaffExpense = (name: string) => {
    const n = name.toUpperCase();
    return n.includes('SUELDO') || n.includes('ADELANTO');
  };

  const staffExpenses = expenses.filter(e => isStaffExpense(e.name));
  const otherExpenses = expenses.filter(e => !isStaffExpense(e.name));
  const staffTotal = staffExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const getStaffSummary = () => {
    const names = ['ROMINA', 'VALERIA', 'ETELVINA', 'JULIETA', 'TÍA', 'PRIMO'];
    const fortnightSalaries: { [key: string]: number } = { 
      'JULIETA': 250000
    };
    
    const now = new Date();
    const day = now.getDate();
    const currentMonthKey = format(now, 'yyyy-MM');
    const isFirstFortnight = day < 15;

    return names.map(name => {
      // Current Fortnight Expenses
      const currentFortnightExps = staffExpenses.filter(e => {
        const d = parseISO(e.date);
        const expDay = d.getDate();
        const expMonthKey = format(d, 'yyyy-MM');
        if (expMonthKey !== currentMonthKey) return false;
        if (isFirstFortnight) return expDay < 15;
        return expDay >= 15;
      }).filter(e => e.name.toUpperCase().includes(name));

      // Previous Fortnight Expenses (to check if owed)
      let prevFortnightExps: Expense[] = [];
      let prevSalary = fortnightSalaries[name] || 0;
      let prevPeriodLabel = "";

      if (isFirstFortnight) {
        // Previous was 2nd half of previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = format(prevMonth, 'yyyy-MM');
        prevFortnightExps = staffExpenses.filter(e => {
          const d = parseISO(e.date);
          return format(d, 'yyyy-MM') === prevMonthKey && d.getDate() >= 15;
        }).filter(e => e.name.toUpperCase().includes(name));
        prevPeriodLabel = `2ª Quincena ${format(prevMonth, 'MMM', {locale: es})}`;
      } else {
        // Previous was 1st half of current month
        prevFortnightExps = staffExpenses.filter(e => {
          const d = parseISO(e.date);
          return format(d, 'yyyy-MM') === currentMonthKey && d.getDate() < 15;
        }).filter(e => e.name.toUpperCase().includes(name));
        prevPeriodLabel = `1ª Quincena ${format(now, 'MMM', {locale: es})}`;
      }

      const currentTotal = currentFortnightExps.reduce((acc, curr) => acc + curr.amount, 0);
      const prevTotal = prevFortnightExps.reduce((acc, curr) => acc + curr.amount, 0);
      
      const salary = fortnightSalaries[name] || 0;
      const available = salary > 0 ? salary - currentTotal : null;
      const debt = (prevSalary > 0 && prevTotal < prevSalary) ? (prevSalary - prevTotal) : 0;

      const totalOverall = staffExpenses
        .filter(e => e.name.toUpperCase().includes(name))
        .reduce((acc, curr) => acc + curr.amount, 0);

      return { 
        name, 
        totalOverall, 
        currentTotal, 
        available, 
        salary, 
        debt, 
        prevPeriodLabel,
        isFirstFortnight
      };
    }).filter(s => s.totalOverall > 0 || s.salary > 0);
  };

  const staffSummary = getStaffSummary();

  const processFinances = (sales: Sale[], exps: Expense[], rentals: Rental[]) => {
    const monthlyMap = new Map<string, MonthlyData>();

    let tProfit = 0;
    let tRevenue = 0;
    setSalesCount(sales.length);

    // Process Sales
    sales.forEach(sale => {
      const date = parseISO(sale.createdAt);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yy', { locale: es });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthName,
          revenue: 0,
          productCost: 0,
          opExpenses: 0,
          totalCost: 0,
          profit: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      let saleRevenue = 0;
      let saleProductCost = 0;

      sale.items.forEach(item => {
        saleRevenue += item.subtotal;
        const unitCost = item.purchasePrice !== undefined ? item.purchasePrice : item.price;
        saleProductCost += unitCost * item.quantity;
      });

      monthData.revenue += saleRevenue;
      monthData.productCost += saleProductCost;
      tRevenue += saleRevenue;
    });

    // Process Rentals as direct revenue
    rentals.forEach(rental => {
      const date = parseISO(rental.rentalDate);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yy', { locale: es });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthName,
          revenue: 0,
          productCost: 0,
          opExpenses: 0,
          totalCost: 0,
          profit: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.revenue += rental.price;
      tRevenue += rental.price;
    });

    // Process Operational Expenses
    exps.forEach(exp => {
      const date = parseISO(exp.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM yy', { locale: es });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthName,
          revenue: 0,
          productCost: 0,
          opExpenses: 0,
          totalCost: 0,
          profit: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.opExpenses += exp.amount;
    });

    // Calculate totals and final profit per month
    monthlyMap.forEach(monthData => {
      monthData.totalCost = monthData.productCost + monthData.opExpenses;
      monthData.profit = monthData.revenue - monthData.totalCost;
      tProfit += monthData.profit;
    });

    const sortedData = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    setData(sortedData);
    setTotalRevenue(tRevenue);
    setTotalProfit(tProfit);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount) return;

    localDb.addExpense({
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      date: new Date(newExpense.date).toISOString()
    });

    setNewExpense({ name: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });
    setShowExpenseForm(false);
    loadData();
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Eliminar este gasto?')) {
      localDb.deleteExpense(id);
      loadData();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="border-l-[6px] border-slate-900 pl-5 mb-10">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Finanzas</h1>
        <p className="text-emerald-600 text-xl font-bold uppercase tracking-widest">Balance de Ganancias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Facturación Bruta" 
          value={`$${Math.round(totalRevenue).toLocaleString('es-AR')}`} 
          icon={<DollarSign className="text-blue-600" />}
          description="Suma de ventas"
        />
        <StatCard 
          title="Ganancia Neta Final" 
          value={`$${Math.round(totalProfit).toLocaleString('es-AR')}`} 
          icon={<TrendingUp className="text-emerald-600" />}
          description="Revenue - Costos - Gastos Ops"
          highlight
        />
        <StatCard 
          title="Gastos Operativos" 
          value={`$${Math.round(expenses.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString('es-AR')}`} 
          icon={<MinusCircle className="text-red-600" />}
          description="Sueldos, servicios, etc"
        />
        <StatCard 
          title="Ventas Totales" 
          value={salesCount.toString()} 
          icon={<ShoppingCart className="text-slate-600" />}
          description="Operaciones realizadas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white border-[6px] border-black p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Comparativa Mensual</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400"></div>
                <span className="text-[10px] font-black uppercase">Gastos Totales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-600"></div>
                <span className="text-[10px] font-black uppercase">Ganancia Neta</span>
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
                  contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontWeight: 900 }}
                  formatter={(value: any, name: string) => [`$${value.toLocaleString()}`, name]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Ingresos" />
                <Bar dataKey="totalCost" fill="#94a3b8" radius={[2, 2, 0, 0]} name="Gastos Totales" />
                <Bar dataKey="profit" fill="#059669" radius={[2, 2, 0, 0]} name="Ganancia Neta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Management */}
        <div className="bg-white border-[6px] border-black p-6 shadow-2xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gastos Extras</h3>
            <button 
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-slate-900 text-white p-2 hover:bg-emerald-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="mb-6 space-y-4 bg-slate-50 p-4 border-2 border-slate-900">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Sugerencias Rápidas</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Sueldo Tía', 'Sueldo Primo', 'Luz', 'Alquiler', 'Monotributo'].map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setNewExpense({...newExpense, name: label})}
                      className="text-[9px] font-black uppercase px-2 py-1 bg-white border border-slate-300 hover:border-slate-900 transition-colors"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Descripción</label>
                <input 
                  type="text" 
                  value={newExpense.name}
                  onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                  className="w-full border-2 border-slate-300 p-2 text-sm font-bold outline-none focus:border-slate-900"
                  placeholder="Nombre del gasto..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Monto</label>
                  <input 
                    type="number" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full border-2 border-slate-300 p-2 text-sm font-bold outline-none focus:border-slate-900"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Fecha</label>
                  <input 
                    type="date" 
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full border-2 border-slate-300 p-2 text-sm font-bold outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 font-black uppercase italic tracking-tighter hover:bg-emerald-600 transition-colors"
              >
                AGREGAR GASTO
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[500px]">
            {staffExpenses.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-emerald-50 p-2 border-l-4 border-emerald-600">
                  <span className="text-[10px] font-black uppercase text-emerald-700">Resumen Personal</span>
                  <span className="text-xs font-black text-emerald-900">${Math.round(staffTotal).toLocaleString('es-AR')}</span>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-4">
                  {staffSummary.map(s => (
                    <div key={s.name} className="bg-white border-2 border-emerald-100 p-4 shadow-sm relative overflow-hidden">
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-black uppercase text-slate-900">{s.name}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{s.isFirstFortnight ? '1ª Quincena' : '2ª Quincena'} (Actual)</span>
                          <div className="text-right">
                            <span className={`text-xs font-black ${s.available && s.available < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {s.available !== null ? `$${Math.round(s.available).toLocaleString('es-AR')} disponible` : 'Sin sueldo fijo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pb-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Detalle Adelantos/Sueldos</span>
                </div>
                {staffExpenses.map(exp => (
                  <ExpenseItem key={exp.id} exp={exp} onDelete={handleDeleteExpense} />
                ))}
              </div>
            )}

            {(staffExpenses.length > 0 && otherExpenses.length > 0) && (
              <div className="border-t-2 border-slate-100 pt-2 pb-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Otros Gastos</span>
              </div>
            )}

            {otherExpenses.map(exp => (
              <ExpenseItem key={exp.id} exp={exp} onDelete={handleDeleteExpense} />
            ))}

            {expenses.length === 0 && (
              <div className="text-center py-10 opacity-30">
                <Wallet size={48} className="mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">Sin gastos extras registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white border-[6px] border-black p-6 shadow-2xl">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Detalle por Período</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-4 border-slate-700">
                <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mes</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos (Ventas)</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Costo Mercadería</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Gastos Extras</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ganancia Neta</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                  <td className="py-4 font-black uppercase italic text-sm">{row.monthName}</td>
                  <td className="py-4 text-right font-bold text-slate-300">${Math.round(row.revenue).toLocaleString('es-AR')}</td>
                  <td className="py-4 text-right font-bold text-slate-300">${Math.round(row.productCost).toLocaleString('es-AR')}</td>
                  <td className="py-4 text-right font-bold text-red-400">-${Math.round(row.opExpenses).toLocaleString('es-AR')}</td>
                  <td className="py-4 text-right font-black text-emerald-400 text-lg">${Math.round(row.profit).toLocaleString('es-AR')}</td>
                  <td className="py-4 text-right font-black text-emerald-600">
                    <span className="bg-emerald-400/10 px-2 py-1 flex items-center justify-end gap-1 ml-auto w-fit">
                      {row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(0) : '0'}%
                      <ArrowUpRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ExpenseItem: React.FC<{ exp: Expense, onDelete: (id: string) => void }> = ({ exp, onDelete }) => {
  return (
    <div className="border-2 border-slate-200 p-3 hover:border-slate-900 transition-all group bg-white">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-black uppercase italic text-sm">{exp.name}</p>
          <p className="text-[10px] font-bold text-slate-400">{format(parseISO(exp.date), 'dd/MM/yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-red-600">-${Math.round(exp.amount).toLocaleString('es-AR')}</p>
          <button 
            onClick={() => onDelete(exp.id)}
            className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

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
