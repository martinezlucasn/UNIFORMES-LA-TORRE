import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        subtotal: product.sellingPrice
      }]);
    }
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check/Decrement Stock
        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw new Error(`Producto ${item.name} no existe.`);
          const currentStock = productSnap.data()?.stock || 0;
          if (currentStock < item.quantity) {
            alert(`Stock insuficiente para ${item.name}. Disponible: ${currentStock}`);
            throw new Error(`Insufficient stock for ${item.name}`);
          }
          transaction.update(productRef, { stock: currentStock - item.quantity });
        }

        // 2. Register Sale
        const receiptNumber = `${Date.now().toString().slice(-6)}`;
        const saleData = {
          receiptNumber,
          customerName: customerName.trim() || null,
          items: cart,
          subtotal,
          surcharge,
          total,
          paymentMethod: isCardPayment ? 'card' : 'cash',
          createdAt: serverTimestamp(),
        };
        
        const saleRef = doc(collection(db, 'sales'));
        transaction.set(saleRef, saleData);

        if (generatePDF) {
            // We can only generate PDF after successfully adding to DB, but Firestore timestamps are null in local snapshots.
            // So we'll pass a regular date to the generator.
            generateReceiptPDF({ ...saleData, createdAt: new Date() } as any);
        }
      });

      alert('Venta realizada con éxito');
      setCart([]);
      setCustomerName('');
      setIsCardPayment(false);
    } catch (error) {
      console.error("Transaction failed: ", error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Search & Selection */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bold-card p-6 flex items-center gap-4">
          <div className="bg-emerald-900 p-2 text-white italic font-black">BUSCAR</div>
          <input
            type="text"
            className="w-full h-full outline-none text-3xl font-black uppercase tracking-tighter placeholder:text-slate-200"
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
              className="bg-white p-6 shadow-xl border-4 border-slate-900 cursor-pointer flex flex-col justify-between"
              onClick={() => addToCart(product)}
            >
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{product.details}</span>
                <h3 className="font-black text-2xl text-gray-900 uppercase italic tracking-tighter leading-none mt-1">{product.name}</h3>
              </div>
              <div className="flex justify-between items-end border-t-2 border-slate-50 pt-4">
                <p className="text-3xl font-black text-slate-800">${product.sellingPrice.toFixed(0)}</p>
                <span className={`text-[11px] font-black px-2 py-1 uppercase tracking-tighter ${product.stock < 5 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  STOCK: {product.stock}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white p-8 border-t-12 border-black shadow-2xl h-fit sticky top-8 flex flex-col space-y-8">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter mb-2 flex items-center gap-3">
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
                key={item.productId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between border-b-2 border-slate-50 pb-4"
              >
                <div className="flex-1 pr-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm leading-tight mb-2">{item.name}</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-black hover:bg-emerald-600 transition-colors"> - </button>
                    <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center font-black hover:bg-emerald-600 transition-colors"> + </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-slate-900 italic tracking-tighter">${item.subtotal.toFixed(0)}</p>
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
            <input
              type="text"
              placeholder="Nombre Opcional"
              className="bold-input"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
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
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {isCardPayment ? (
            <div className="flex justify-between text-emerald-600 font-black uppercase text-[10px] italic tracking-widest">
              <span>Recargo Financiero:</span>
              <span>+${surcharge.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-blue-600 font-black uppercase text-[10px] italic tracking-widest">
                <span>Descuento Efectivo</span>
                <span>Aplicado</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Total a Pagar</span>
            <span className="text-4xl font-black text-gray-900 tracking-tighter italic leading-none">${total.toFixed(0)}</span>
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
    </div>
  );
}
