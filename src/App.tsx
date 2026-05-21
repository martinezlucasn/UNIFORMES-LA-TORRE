import React, { useState, useEffect } from 'react';
import { ViewType, Product } from './types';
import { localDb } from './localDb';
import ProductManager from './components/ProductManager';
import SalesPoint from './components/SalesPoint';
import ReceiptHistory from './components/ReceiptHistory';
import Finances from './components/Finances';
import Adelantos from './components/Adelantos';
import QuoteSystem from './components/QuoteSystem';
import Settings from './components/Settings';
import { 
  Menu, 
  Package, 
  ShoppingCart, 
  History, 
  Store,
  BarChart2,
  FileText,
  AlertTriangle,
  Coins,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('menu');

  const handleNavigate = (view: ViewType) => {
    if (view === 'finances') {
      const pass = prompt('Ingrese contraseña para acceder a Finanzas:');
      if (pass !== 'skj2ljbk') {
        alert('Acceso denegado: Contraseña incorrecta');
        return;
      }
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col md:flex-row border-[6px] border-emerald-900">
      {/* Sidebar Navigation */}
      <nav className="bg-emerald-900 w-full md:w-56 flex flex-col p-5 h-screen md:sticky md:top-0 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-white text-emerald-900 p-2 rounded font-black text-xl italic">
            LT
          </div>
          <span className="font-black text-white text-2xl tracking-tighter uppercase leading-none">
            La Torre <br /><span className="text-emerald-400 text-xs tracking-widest">Uniformes</span>
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <NavItem 
            active={currentView === 'menu'} 
            onClick={() => handleNavigate('menu')} 
            icon={<Menu size={20} />} 
            label="INICIO" 
          />
          <NavItem 
            active={currentView === 'products'} 
            onClick={() => handleNavigate('products')} 
            icon={<Package size={20} />} 
            label="PRODUCTOS" 
          />
          <NavItem 
            active={currentView === 'sales'} 
            onClick={() => handleNavigate('sales')} 
            icon={<ShoppingCart size={20} />} 
            label="VENTAS" 
          />
          <NavItem 
            active={currentView === 'history'} 
            onClick={() => handleNavigate('history')} 
            icon={<History size={20} />} 
            label="HISTORIAL" 
          />
          <NavItem 
            active={currentView === 'quotes'} 
            onClick={() => handleNavigate('quotes')} 
            icon={<FileText size={20} />} 
            label="PRESUPUESTOS" 
          />
          <NavItem 
            active={currentView === 'settings'} 
            onClick={() => handleNavigate('settings')} 
            icon={<SettingsIcon size={20} />} 
            label="CONFIGURACIÓN" 
          />
          <NavItem 
            active={currentView === 'advances'} 
            onClick={() => handleNavigate('advances')} 
            icon={<Coins size={20} />} 
            label="ADELANTOS" 
          />
          
          <div className="pt-4 mt-4 border-t border-emerald-800">
            <NavItem 
              active={currentView === 'finances'} 
              onClick={() => handleNavigate('finances')} 
              icon={<BarChart2 size={20} />} 
              label="FINANZAS" 
            />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-0">
        <div className="min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.15 }}
            >
              {currentView === 'menu' && <MainView onNavigate={handleNavigate} />}
              {currentView === 'products' && <ProductManager />}
              {currentView === 'sales' && <SalesPoint />}
              {currentView === 'history' && <ReceiptHistory />}
              {currentView === 'quotes' && <QuoteSystem />}
              {currentView === 'finances' && <Finances />}
              {currentView === 'advances' && <Adelantos onBack={() => setCurrentView('menu')} />}
              {currentView === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 flex items-center gap-4 transition-all border-l-4 ${
        active 
          ? 'bg-white text-emerald-900 border-white font-black scale-105 shadow-xl' 
          : 'text-emerald-100/60 border-transparent hover:bg-emerald-800 hover:text-white font-bold'
      }`}
    >
      <span className={active ? "text-emerald-900" : "text-emerald-400"}>{icon}</span>
      <span className="tracking-tighter uppercase text-sm">{label}</span>
    </button>
  );
}

function MainView({ onNavigate }: { onNavigate: (v: ViewType) => void }) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const products = localDb.getProducts();
    // Consideramos stock bajo si el total es < 5 o si alguna variante es < 5
    const low = products.filter(p => {
      if (p.hasVariants && p.variants) {
        return p.variants.some(v => v.stock < 5);
      }
      return p.stock < 5;
    });
    setLowStockProducts(low);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 border-l-[6px] border-emerald-900 pl-5">
        <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic">Panel de Control</h1>
        <p className="text-emerald-600 text-xl font-bold uppercase tracking-widest">Uniformes La Torre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <MenuCard 
          onClick={() => onNavigate('products')}
          icon={<Package className="w-12 h-12" />}
          title="INVENTARIO"
          description="GESTIÓN DE STOCK"
          color="bg-slate-900"
        />
        <MenuCard 
          onClick={() => onNavigate('sales')}
          icon={<ShoppingCart className="w-12 h-12" />}
          title="NUEVA VENTA"
          description="PUNTO DE FACTURACIÓN"
          color="bg-emerald-600"
        />
        <MenuCard 
          onClick={() => onNavigate('history')}
          icon={<History className="w-12 h-12" />}
          title="HISTORIAL"
          description="RESUMEN DE BOLETAS"
          color="bg-emerald-900"
        />
        <MenuCard 
          onClick={() => onNavigate('quotes')}
          icon={<FileText className="w-12 h-12" />}
          title="PRESUPUESTOS"
          description="GENERAR COTIZACIONES"
          color="bg-slate-700"
        />
      </div>

      {/* Quick Daily Expense Section */}
      <QuickExpenseWidget />

      {/* Discreet Low Stock Footer */}
      {lowStockProducts.length > 0 && (
        <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 py-2 border-t border-red-200">
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle className="text-red-600 shrink-0" size={16} />
            <span className="text-[10px] font-black uppercase text-red-600 tracking-tighter">Stock Crítico:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(p => (
              <span key={p.id} className="text-[10px] font-bold text-red-600/80 bg-red-50 px-2 py-0.5 border border-red-100 flex items-center gap-1">
                {p.name} 
                <span className="font-black text-red-700">
                  [{p.hasVariants ? p.variants?.filter(v => v.stock < 5).map(v => `${v.size}:${v.stock}`).join(' | ') : p.stock}]
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickExpenseWidget() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    setIsSaving(true);
    localDb.addExpense({
      name: name.toUpperCase(),
      amount: parseFloat(amount),
      date: new Date().toISOString()
    });

    setTimeout(() => {
      setName('');
      setAmount('');
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="mt-12 pt-8 border-t-2 border-emerald-900/10">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="text-emerald-900" size={20} />
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-emerald-900">Registro de Gastos</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white border-4 border-emerald-900 p-4 shadow-[8px_8px_0px_0px_rgba(6,78,59,0.1)] flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Concepto / Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="EJ: ART. LIMPIEZA, ENCENDEDOR, AGUA..."
            className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold uppercase text-sm focus:border-emerald-600 outline-none transition-all"
          />
        </div>
        <div className="md:w-48">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Monto ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold text-sm focus:border-emerald-600 outline-none transition-all"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSaving || !name || !amount}
            className={`w-full md:w-auto px-8 py-2 font-black uppercase text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
              isSaving 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Registrar Gasto'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MenuCard({ onClick, icon, title, description, color }: { onClick: () => void, icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, rotate: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${color} text-white p-8 text-left shadow-[12px_12px_0px_0px_rgba(6,78,59,0.2)] border-4 border-emerald-950 relative overflow-hidden group h-64 flex flex-col justify-end`}
    >
      <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-black mb-1 leading-none uppercase italic tracking-tighter">{title}</h3>
        <p className="text-white/50 text-xs font-black uppercase tracking-widest">{description}</p>
      </div>
    </motion.button>
  );
}
