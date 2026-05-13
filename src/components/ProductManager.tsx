import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.purchasePrice === undefined || currentProduct.sellingPrice === undefined || currentProduct.stock === undefined) return;

    try {
      const productData = {
        name: currentProduct.name,
        purchasePrice: Number(currentProduct.purchasePrice),
        sellingPrice: Number(currentProduct.sellingPrice),
        details: currentProduct.details || '',
        stock: Number(currentProduct.stock),
        updatedAt: serverTimestamp(),
      };

      if (currentProduct.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-12 border-b-8 border-emerald-900 pb-4">
        <div>
          <h2 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter">Inventario</h2>
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Control de Stock y Precios</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setCurrentProduct({}); setIsEditing(true); }}
            className="bold-button px-6 py-3 flex items-center gap-2 text-lg shadow-[8px_8px_0px_0px_rgba(6,78,59,1)]"
          >
            <Plus size={24} /> NUEVO PRODUCTO
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bold-card p-8 mb-12"
          >
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="bold-label">Nombre del Producto</label>
                <input
                  required
                  type="text"
                  value={currentProduct?.name || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="bold-input text-2xl h-14"
                  placeholder="Ej: CHOMBA ESCOLAR AZUL"
                />
              </div>
              <div>
                <label className="bold-label">Precio de Compra ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={currentProduct?.purchasePrice || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, purchasePrice: Number(e.target.value) })}
                  className="bold-input"
                />
              </div>
              <div>
                <label className="bold-label">Precio de Venta ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={currentProduct?.sellingPrice || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, sellingPrice: Number(e.target.value) })}
                  className="bold-input"
                />
              </div>
              <div>
                <label className="bold-label">Stock Actual (un.)</label>
                <input
                  required
                  type="number"
                  value={currentProduct?.stock || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                  className="bold-input"
                />
              </div>
              <div>
                <label className="bold-label">Detalles / Especificaciones</label>
                <input
                  type="text"
                  value={currentProduct?.details || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, details: e.target.value })}
                  className="bold-input"
                  placeholder="Material, talle, etc."
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setCurrentProduct(null); }}
                  className="px-6 py-2 text-slate-500 hover:text-slate-900 font-black uppercase text-sm italic underline transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bold-button px-10 py-4 text-xl flex items-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                >
                  <Save size={20} /> GUARDAR
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-2xl border-2 border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Compra</th>
                <th className="px-6 py-4 text-right">Venta</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase italic">Cargando Inventario...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase italic">No hay productos.</td>
                </tr>
              ) : products.map(product => (
                <tr key={product.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-gray-900 font-black text-lg uppercase tracking-tighter">{product.name}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{product.details}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 font-black text-sm uppercase tracking-tighter ${product.stock < 5 ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                      {product.stock} UN.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-400 italic">${product.purchasePrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-2xl font-black text-emerald-900 tracking-tighter font-sans">${product.sellingPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => handleEdit(product)} className="text-slate-900 hover:text-emerald-600 transition-colors font-black italic uppercase text-xs border-b-2 border-slate-900">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 transition-colors font-black italic uppercase text-xs border-b-2 border-red-500">
                        Borrar
                      </button>
                    </div>
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
