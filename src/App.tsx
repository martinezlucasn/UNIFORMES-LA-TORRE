import React, { useState } from 'react';
import { ViewType } from './types';
import ProductManager from './components/ProductManager';
import SalesPoint from './components/SalesPoint';
import ReceiptHistory from './components/ReceiptHistory';
import Finances from './components/Finances';
import QuoteSystem from './components/QuoteSystem';
import { 
  Menu, 
  Package, 
  ShoppingCart, 
  History, 
  Store,
  BarChart2,
  FileText
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
    <div className="min-h-screen bg-emerald-50 flex flex-col md:flex-row border-8 border-emerald-900">
      {/* Sidebar Navigation */}
      <nav className="bg-emerald-900 w-full md:w-64 flex flex-col p-6 h-screen md:sticky md:top-0 text-white shadow-2xl">
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
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12 border-l-8 border-emerald-900 pl-6">
        <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic">Panel de Control</h1>
        <p className="text-emerald-600 text-xl font-bold uppercase tracking-widest">Uniformes La Torre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        <MenuCard 
          onClick={() => onNavigate('finances')}
          icon={<BarChart2 className="w-12 h-12" />}
          title="FINANZAS"
          description="BALANCE MENSUAL"
          color="bg-blue-900"
        />
      </div>

      <div className="mt-12 bg-white p-8 border-8 border-black flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="bg-emerald-900 p-6 rounded italic text-white flex items-center justify-center">
          <Store size={48} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-gray-900 uppercase italic">Uniformes La Torre</h3>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest bg-slate-100 inline-block px-2 py-1 mt-2">Av. 44 Nº 1873 e/ 132 y 133, La Plata</p>
        </div>
      </div>
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
        <h3 className="text-3xl font-black mb-1 leading-none uppercase italic tracking-tighter">{title}</h3>
        <p className="text-white/50 text-xs font-black uppercase tracking-widest">{description}</p>
      </div>
    </motion.button>
  );
}
