import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { Product } from '../types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product & { newStock?: number }> | null>(null);
  const [variants, setVariants] = useState<{ size: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const data = localDb.getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.purchasePrice === undefined || currentProduct.sellingPrice === undefined) return;

    const finalStock = currentProduct.hasVariants 
      ? variants.reduce((acc, v) => acc + v.stock, 0)
      : (Number(currentProduct.stock) || 0) + (Number(currentProduct.newStock) || 0);

    const productData = {
      name: currentProduct.name,
      purchasePrice: Number(currentProduct.purchasePrice),
      sellingPrice: Number(currentProduct.sellingPrice),
      details: currentProduct.details || '',
      stock: finalStock,
      hasVariants: currentProduct.hasVariants || false,
      variants: currentProduct.hasVariants ? variants : undefined
    };

    if (currentProduct.id) {
      localDb.updateProduct(currentProduct.id, productData);
    } else {
      localDb.addProduct(productData);
    }
    
    loadProducts();
    setIsEditing(false);
    setCurrentProduct(null);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct({ ...product, newStock: 0 });
    setVariants(product.variants || []);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      localDb.deleteProduct(id);
      loadProducts();
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', stock: 0 }]);
  };

  const updateVariant = (index: number, field: 'size' | 'stock', value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: field === 'stock' ? Number(value) : value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10 border-b-[6px] border-emerald-900 pb-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Inventario</h2>
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

      {/* Filtro de búsqueda */}
      {!isEditing && (
        <div className="bold-card p-4 mb-8 flex items-center gap-4">
          <div className="bg-slate-900 p-2 text-white italic font-black text-xs uppercase tracking-widest px-4">FILTRAR</div>
          <input
            type="text"
            className="w-full h-full outline-none text-xl font-black uppercase tracking-tighter placeholder:text-slate-200"
            placeholder="Buscar por nombre o detalle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bold-card p-8 mb-12 max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
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

              {/* Variantes / Talles */}
              <div className="md:col-span-2 bg-emerald-50 p-6 border-4 border-emerald-900 shadow-[8px_8px_0px_0px_rgba(6,78,59,1)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="hasVariants"
                      className="w-6 h-6 accent-emerald-900"
                      checked={currentProduct?.hasVariants || false}
                      onChange={e => setCurrentProduct({ ...currentProduct, hasVariants: e.target.checked })}
                    />
                    <label htmlFor="hasVariants" className="font-black uppercase italic text-emerald-900 cursor-pointer">¿Tiene Variedad de Talles?</label>
                  </div>
                  {currentProduct?.hasVariants && (
                    <button 
                      type="button"
                      onClick={addVariant}
                      className="bg-emerald-900 text-white p-2 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-4"
                    >
                      <Plus size={14} /> AGREGAR TALLE
                    </button>
                  )}
                </div>

                {currentProduct?.hasVariants ? (
                  <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar bg-white/30 p-2 border-2 border-emerald-900/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {variants.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center bg-white p-2 border border-emerald-900/30 shadow-[2px_2px_0px_0px_rgba(6,78,59,0.1)]">
                          <div className="flex-1">
                            <label className="block text-[8px] font-black text-emerald-700 uppercase leading-none mb-1">Talle</label>
                            <input 
                              type="text" 
                              value={v.size}
                              onChange={e => updateVariant(i, 'size', e.target.value)}
                              className="w-full border-b border-transparent focus:border-emerald-500 font-black uppercase outline-none text-xs"
                              placeholder="M, 42..."
                            />
                          </div>
                          <div className="w-16">
                            <label className="block text-[8px] font-black text-emerald-700 uppercase leading-none mb-1">Stock</label>
                            <input 
                              type="number" 
                              value={v.stock}
                              onChange={e => updateVariant(i, 'stock', e.target.value)}
                              className="w-full border-b border-transparent focus:border-emerald-500 font-black outline-none text-xs"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeVariant(i)} 
                            className="text-red-400 hover:text-red-600 p-1 mt-3"
                            title="Eliminar talle"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {variants.length === 0 && (
                      <p className="text-center italic text-emerald-800/50 py-6 font-bold uppercase text-[10px]">Sin talles agregados</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="bold-label">Stock Actual (un.)</label>
                      <input
                        required
                        disabled={currentProduct?.id !== undefined}
                        type="number"
                        value={currentProduct?.stock || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                        className={`bold-input ${currentProduct?.id ? 'bg-gray-100 italic cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {currentProduct?.id && (
                      <div>
                        <label className="bold-label text-emerald-600">Ingreso de Nuevo Stock (+)</label>
                        <input
                          type="number"
                          value={currentProduct?.newStock || ''}
                          onChange={e => setCurrentProduct({ ...currentProduct, newStock: Number(e.target.value) })}
                          className="bold-input border-emerald-300 bg-emerald-50"
                          placeholder="Escriba cantidad a sumar"
                        />
                      </div>
                    )}
                  </div>
                )}
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
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left relative">
            <thead className="bg-slate-900 text-white uppercase text-[11px] font-black tracking-widest sticky top-0 z-10">
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
              ) : products.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(product => (
                <tr key={product.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-gray-900 font-black text-lg uppercase tracking-tighter">{product.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.hasVariants && product.variants?.map((v, i) => (
                        <span key={i} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-black border border-slate-200 text-slate-500 uppercase">
                          {v.size}: {v.stock}
                        </span>
                      ))}
                    </div>
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
