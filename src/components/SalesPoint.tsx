import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Product, Sale, SaleItem } from '../types';
import { Search, ShoppingCart, Trash2, CreditCard, Receipt, User, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateReceiptPDF } from '../PDFGenerator';

export default function SalesPoint() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isCardPayment, setIsCardPayment] = useState(false);
  const [generatePDF, setGeneratePDF] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [deposit, setDeposit] = useState<number>(0);
  const [selectingSize, setSelectingSize] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(localDb.getProducts().sort((a, b) => a.name.localeCompare(b.name)));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, selectedSize?: string) => {
    // If product has variants and no size is selected yet, open modal
    if (product.hasVariants && !selectedSize) {
      setSelectingSize(product);
      return;
    }

    const cartId = selectedSize ? `${product.id}-${selectedSize}` : product.id;
    const existing = cart.find(item => (item.size ? `${item.productId}-${item.size}` : item.productId) === cartId);
    
    if (existing) {
      setCart(cart.map(item => 
        (item.size ? `${item.productId}-${item.size}` : item.productId) === cartId 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        size: selectedSize,
        quantity: 1,
        price: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        subtotal: product.sellingPrice
      }]);
    }
    setSelectingSize(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
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

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotal = calculateSubtotal();
  const surcharge = isCardPayment ? subtotal * 0.1 : 0;
  const total = subtotal + surcharge;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // 1. Check/Update Stock and validate
    for (const item of cart) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) continue;
      
      if (item.size) {
        const variant = prod.variants?.find(v => v.size === item.size);
        if (!variant || variant.stock < item.quantity) {
          alert(`Stock insuficiente para ${item.name} (Talle ${item.size}).`);
          return;
        }
      } else if (prod.stock < item.quantity) {
        alert(`Stock insuficiente para ${item.name}.`);
        return;
      }
    }

    // 2. Perform updates
    for (const item of cart) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (item.size && prod.variants) {
          const newVariants = prod.variants.map(v => 
            v.size === item.size ? { ...v, stock: v.stock - item.quantity } : v
          );
          localDb.updateProduct(prod.id, { 
            ...prod, 
            variants: newVariants,
            stock: prod.stock - item.quantity 
          });
        } else {
          localDb.updateStock(item.productId, item.quantity);
        }
      }
    }

    // 3. Register Sale
    const receiptNumber = localDb.getNextReceiptNumber();
    const finalTotal = total;
    const saleData: Omit<Sale, 'id' | 'createdAt'> = {
      receiptNumber,
      customerName: customerName.trim() || undefined,
      customerContact: customerContact.trim() || undefined,
      items: cart,
      subtotal,
      surcharge,
      total: finalTotal,
      paymentMethod: isCardPayment ? 'card' : 'cash',
      deposit: Number(deposit) || 0,
      balanceDue: finalTotal - (Number(deposit) || 0),
    };
    
    const savedSale = localDb.addSale(saleData);

    if (generatePDF) {
      generateReceiptPDF(savedSale);
    }

    alert('Venta realizada con éxito');
    setCart([]);
    setCustomerName('');
    setCustomerContact('');
    setDeposit(0);
    setIsCardPayment(false);
    loadProducts(); // Fresh stock data
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Search & Selection */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bold-card p-4 flex items-center gap-3">
          <div className="bg-emerald-900 p-2 text-white italic font-black text-xs">BUSCAR</div>
          <input
            type="text"
            className="w-full h-full outline-none text-2xl font-black uppercase tracking-tighter placeholder:text-slate-200"
            placeholder="Introduce nombre o detalle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map(product => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative shadow-xl border-4 border-slate-900 cursor-pointer flex flex-col justify-between min-h-[290px] overflow-hidden p-6 ${
                product.image ? 'text-white' : 'bg-white text-slate-900'
              }`}
              onClick={() => addToCart(product)}
            >
              {/* Full background image option occupies 100% of the rectangle */}
              {product.image ? (
                <>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle dark gradient overlay to ensure all texts/elements on top read perfectly */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/80 z-0" />
                </>
              ) : null}

              <div className="z-10 flex-grow flex flex-col justify-between">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    product.image ? 'text-emerald-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-emerald-600'
                  }`}>{product.details}</span>
                  <h3 className={`font-black text-2xl uppercase italic tracking-tighter leading-none mt-1 ${
                    product.image ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]' : 'text-gray-900'
                  }`}>{product.name}</h3>
                </div>
                {!product.image && (
                  <div className="w-full h-32 mt-2 border-4 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 flex-shrink-0">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1">Sin Imagen</span>
                  </div>
                )}
              </div>
              <div className={`z-10 flex justify-between items-end border-t-2 pt-4 mt-auto ${
                product.image ? 'border-white/20' : 'border-slate-100'
              }`}>
                <p className={`text-3xl font-black italic tracking-tighter ${
                  product.image ? 'text-emerald-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]' : 'text-slate-800'
                }`}>${Math.round(product.sellingPrice).toLocaleString('es-AR')}</p>
                <span className={`text-[11px] font-black px-2 py-1 uppercase tracking-tighter ${
                  product.stock < 5 
                    ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : product.image 
                      ? 'bg-white/20 text-slate-100 border border-white/30 backdrop-blur-xs' 
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  STOCK: {product.stock}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white p-6 border-t-[8px] border-black shadow-2xl h-fit sticky top-6 flex flex-col space-y-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter mb-2 flex items-center gap-3">
             RESUMEN
          </h2>
          <div className="w-16 h-2 bg-emerald-600"></div>
        </div>

        <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-4 custom-scrollbar">
          {cart.length === 0 && (
            <div className="py-12 text-center text-slate-300 font-black uppercase italic text-xl border-4 border-dotted border-slate-100 italic">
              Sin productos
            </div>
          )}
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.productId + (item.size || '')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between border-b-2 border-slate-50 pb-4"
              >
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm leading-tight mb-0">{item.name}</h4>
                  {item.size && <p className="text-[10px] text-emerald-600 font-bold uppercase italic mb-2">Talle: {item.size}</p>}
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-black hover:bg-emerald-600 transition-colors"> - </button>
                    <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-black hover:bg-emerald-600 transition-colors"> + </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-slate-900 italic tracking-tighter">${Math.round(item.subtotal).toLocaleString('es-AR')}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-500 font-black uppercase text-[10px] italic mt-2 border-b border-red-500 hover:text-red-700">
                    Quitar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div>
            <label className="bold-label">Cliente</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre"
                className="bold-input"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Número de contacto"
                className="bold-input"
                value={customerContact}
                onChange={e => setCustomerContact(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center justify-between p-4 bg-emerald-900 text-white cursor-pointer group hover:bg-emerald-950 transition-all border-l-4 border-emerald-400">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-6 h-6 accent-emerald-400"
                  checked={isCardPayment}
                  onChange={e => setIsCardPayment(e.target.checked)}
                />
                <span className="text-xs font-black uppercase tracking-widest">Pago Tarjeta (+10%)</span>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-100 text-slate-900 cursor-pointer group hover:bg-slate-200 transition-all border-l-4 border-slate-900">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-6 h-6 accent-emerald-600"
                  checked={generatePDF}
                  onChange={e => setGeneratePDF(e.target.checked)}
                />
                <span className="text-xs font-black uppercase tracking-widest">Generar Boleta</span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-l-8 border-black space-y-3">
          <div className="flex justify-between text-slate-500 font-bold uppercase text-[10px] tracking-widest">
            <span>Subtotal Bruto:</span>
            <span>${Math.round(subtotal).toLocaleString('es-AR')}</span>
          </div>
          {isCardPayment ? (
            <div className="flex justify-between text-emerald-600 font-black uppercase text-[10px] italic tracking-widest">
              <span>Recargo Financiero:</span>
              <span>+${Math.round(surcharge).toLocaleString('es-AR')}</span>
            </div>
          ) : (
            <div className="flex justify-between text-blue-600 font-black uppercase text-[10px] italic tracking-widest">
                <span>Descuento Efectivo</span>
                <span>Aplicado</span>
            </div>
          )}
          
          <div className="bg-emerald-50 p-3 border-2 border-emerald-900 mt-2">
            <label className="block text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Efectivo / Seña / Adelanto ($)</label>
            <input
              type="number"
              value={deposit || ''}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full bg-transparent border-b-2 border-emerald-900 text-xl font-black outline-none"
              placeholder="0"
            />
            {deposit > 0 && (
              <p className="text-[10px] text-emerald-700 font-bold mt-1 uppercase">Saldo pendiente: ${Math.round(total - (deposit || 0)).toLocaleString('es-AR')}</p>
            )}
          </div>

          <div className="flex justify-between items-end pt-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Total a Pagar</span>
            <span className="text-4xl font-black text-gray-900 tracking-tighter italic leading-none">${Math.round(total).toLocaleString('es-AR')}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={handleCheckout}
          className="bold-button w-full h-20 text-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4"
        >
          <Send size={28} /> FACTURAR
        </button>
      </div>

      {/* Modal Selección de Talle */}
      <AnimatePresence>
        {selectingSize && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-8 border-slate-900 p-8 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
            >
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{selectingSize.name}</h2>
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-8">Seleccione un talle para continuar</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar p-1">
                {selectingSize.variants?.map((v, i) => (
                  <button
                    key={i}
                    disabled={v.stock <= 0}
                    onClick={() => addToCart(selectingSize, v.size)}
                    className={`aspect-square w-full p-2 border-2 border-slate-900 text-left transition-all flex flex-col justify-between gap-1 overflow-hidden ${
                      v.stock > 0 
                        ? 'hover:bg-emerald-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5' 
                        : 'opacity-40 grayscale cursor-not-allowed'
                    }`}
                  >
                    {/* Size variant local image preview if set */}
                    {v.image ? (
                      <div className="w-full h-12 sm:h-14 border border-slate-900 overflow-hidden bg-slate-50 flex-shrink-0">
                        <img src={v.image} alt={v.size} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-12 sm:h-14 border border-dashed border-slate-200 flex items-center justify-center text-slate-200 flex-shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="block font-black text-xs sm:text-[13px] italic leading-none break-words">{v.size}</span>
                    <span className="text-[7px] sm:text-[8px] font-bold uppercase text-slate-500 mt-auto leading-none">STOCK: {v.stock}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectingSize(null)}
                className="w-full mt-8 py-3 font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
