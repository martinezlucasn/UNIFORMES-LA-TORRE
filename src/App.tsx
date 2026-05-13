import React, { useState } from 'react';
import { ViewType } from './types';
import ProductManager from './components/ProductManager';
import SalesPoint from './components/SalesPoint';
import ReceiptHistory from './components/ReceiptHistory';
import { 
  Menu, 
  Package, 
  ShoppingCart, 
  History, 
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('menu');

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col md:flex-row border-8 border-emerald-900">
      {/* Sidebar Navigation */}
      <nav className="bg-emerald-900 w-full md:w-64 flex flex-col p-6 h-screen md:sticky md:top-0 text-white shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain mb-4" />
          <span className="font-black text-white text-xl tracking-tighter uppercase leading-none text-center">
            La Torre <br /><span className="text-emerald-400 text-xs tracking-widest">Uniformes</span>
          </span>
        </div>

        <div className="flex-1 space-y-3">
          <NavItem 
            active={currentView === 'menu'} 
            onClick={() => setCurrentView('menu')} 
            icon={<Menu size={20} />} 
            label="INICIO" 
          />
          <NavItem 
            active={currentView === 'products'} 
            onClick={() => setCurrentView('products')} 
            icon={<Package size={20} />} 
            label="PRODUCTOS" 
          />
          <NavItem 
            active={currentView === 'sales'} 
            onClick={() => setCurrentView('sales')} 
            icon={<ShoppingCart size={20} />} 
            label="VENTAS" 
          />
          <NavItem 
            active={currentView === 'history'} 
            onClick={() => setCurrentView('history')} 
            icon={<History size={20} />} 
            label="HISTORIAL" 
          />
        </div>

        <div className="mt-auto pt-6 border-t border-emerald-800">
          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2">Modo Offline</p>
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded bg-emerald-700 flex items-center justify-center font-bold">A</div>
            <div className="overflow-hidden">
               <p className="text-xs font-bold truncate">Admin Local</p>
               <p className="text-[9px] text-emerald-400 font-bold uppercase">Datos en Navegador</p>
            </div>
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
              {currentView === 'menu' && <MainView onNavigate={setCurrentView} />}
              {currentView === 'products' && <ProductManager />}
              {currentView === 'sales' && <SalesPoint />}
              {currentView === 'history' && <ReceiptHistory />}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      </div>

      <div className="mt-12 bg-white p-8 border-8 border-black flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="bg-emerald-900 p-2 rounded italic text-white flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain" />
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
