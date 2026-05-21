import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Product, SaleItem } from '../types';
import { generateQuotePDF } from '../PDFGenerator';
import { ShoppingCart, Plus, Minus, Trash2, FileText, Search } from 'lucide-react';

export default function QuoteSystem() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const data = localDb.getProducts();
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        subtotal: product.sellingPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleGenerateQuote = () => {
    if (cart.length === 0) return;
    generateQuotePDF(cart, customerName);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="border-l-[6px] border-slate-900 pl-5 mb-8">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Presupuestos</h1>
        <p className="text-emerald-600 text-lg font-bold uppercase tracking-widest">Generador de Cotizaciones</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Left Side: Product Selection */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bold-card p-4 mb-4 flex items-center gap-4 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <Search className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent border-none outline-none font-bold uppercase w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex justify-between items-center hover:translate-x-1 transition-transform cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <div>
                  <h3 className="font-black uppercase italic leading-tight">{product.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{product.details}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-xl italic">${Math.round(product.sellingPrice).toLocaleString('es-AR')}</span>
                  <div className="bg-slate-900 text-white p-2">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart / Quote Summary */}
        <div className="w-full md:w-96 flex flex-col">
          <div className="bg-slate-900 text-white p-6 border-b-8 border-emerald-500 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart size={24} className="text-emerald-400" />
              <h2 className="text-2xl font-black uppercase italic">En el presupuesto</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.productId} className="bg-slate-800 p-3 border-l-4 border-emerald-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs uppercase tracking-tighter truncate w-40">{item.name}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-slate-700 p-1">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="hover:text-emerald-400"><Minus size={14} /></button>
                      <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="hover:text-emerald-400"><Plus size={14} /></button>
                    </div>
                    <span className="font-black text-emerald-400 text-sm">${Math.round(item.subtotal).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic opacity-50">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-black uppercase text-sm">Lista vacía</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-slate-700 pt-6">
              <div>
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Nombre del Cliente (Opcional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border-none p-3 text-white font-bold outline-none"
                  placeholder="CLIENTE..."
                />
              </div>

              <div className="flex justify-between items-end border-t border-slate-700 pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Total Base</span>
                <span className="text-4xl font-black text-white tracking-tighter italic leading-none">${Math.round(subtotal).toLocaleString('es-AR')}</span>
              </div>

              <button 
                onClick={handleGenerateQuote}
                disabled={cart.length === 0}
                className="w-full bg-emerald-500 text-slate-900 py-4 font-black uppercase italic tracking-tighter text-xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
              >
                <FileText />
                GENERAR PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
