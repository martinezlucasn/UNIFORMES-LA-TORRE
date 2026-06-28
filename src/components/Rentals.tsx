import React, { useState, useEffect } from 'react';
import { localDb } from '../localDb';
import { RentalProduct, Rental } from '../types';
import { generateRentalReceiptPDF } from '../PDFGenerator';
import { 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Package, 
  Search, 
  Image as ImageIcon, 
  Eye, 
  X,
  Clock,
  Briefcase
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Rentals() {
  const [activeTab, setActiveTab] = useState<'rent' | 'inventory' | 'history'>('rent');
  
  // States for Rental Products
  const [rentalProducts, setRentalProducts] = useState<RentalProduct[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RentalProduct | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    details: '',
    stock: ''
  });

  // States for Renting (Cart)
  const [cart, setCart] = useState<{ productId: string; productName: string; quantity: number; price: number; maxStock: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [dniPhoto, setDniPhoto] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // States for local store logo
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  
  const defaultTerms = 
    "1. El cliente se compromete a devolver las prendas alquiladas en las mismas condiciones de higiene y estado óptimo en las que fueron entregadas.\n" +
    "2. El plazo acordado de devolución es improrrogable; cualquier retraso incurrirá en recargos automáticos por día de demora.\n" +
    "3. En caso de roturas, daños permanentes, manchas irreparables o pérdida de la prenda, el cliente deberá abonar de forma obligatoria el valor total de reposición de la misma.\n" +
    "4. Queda estrictamente prohibido realizar cualquier tipo de modificación, costura, dobladillo permanente o lavado con productos químicos abrasivos.";
    
  const [terms, setTerms] = useState(defaultTerms);

  // States for Rentals History
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'returned'>('all');
  
  // DNI Modal preview
  const [previewDni, setPreviewDni] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setRentalProducts(localDb.getRentalProducts());
    setRentals(localDb.getRentals());
    setStoreLogo(localDb.getStoreLogo());
  };

  // --- Manage Rental Products ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;

    localDb.addRentalProduct({
      name: newProduct.name.toUpperCase(),
      price: parseFloat(newProduct.price),
      details: newProduct.details.toUpperCase(),
      stock: parseInt(newProduct.stock)
    });

    setNewProduct({ name: '', price: '', details: '', stock: '' });
    setIsAddingProduct(false);
    loadAllData();
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    localDb.updateRentalProduct(editingProduct.id, {
      name: editingProduct.name.toUpperCase(),
      price: editingProduct.price,
      details: editingProduct.details.toUpperCase(),
      stock: editingProduct.stock
    });

    setEditingProduct(null);
    loadAllData();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este artículo del stock de alquiler?')) {
      localDb.deleteRentalProduct(id);
      loadAllData();
    }
  };

  // --- Image Handling for DNI ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      convertToBase64(file);
    }
  };

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setDniPhoto(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error('Error al convertir imagen a Base64:', error);
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      convertToBase64(file);
    }
  };

  // --- Image Handling for Store Logo ---
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      convertLogoToBase64(file);
    }
  };

  const convertLogoToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      localDb.saveStoreLogo(base64);
      setStoreLogo(base64);
    };
    reader.onerror = (error) => {
      console.error('Error al convertir logo a Base64:', error);
    };
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(true);
  };

  const handleLogoDragLeave = () => {
    setIsLogoDragging(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      convertLogoToBase64(file);
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('¿Desea eliminar el logo del local de las boletas?')) {
      localDb.deleteStoreLogo();
      setStoreLogo(null);
    }
  };

  // --- Cart Management Functions ---
  const handleAddToCart = (prod: RentalProduct) => {
    if (prod.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === prod.id);
      if (existing) {
        return prev.map(item => 
          item.productId === prod.id 
            ? { ...item, quantity: Math.min(item.maxStock, item.quantity + 1) } 
            : item
        );
      } else {
        return [...prev, {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          price: prod.price,
          maxStock: prod.stock
        }];
      }
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const qty = Math.max(1, Math.min(item.maxStock, newQty));
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- Register Rental ---
  const handleConfirmRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Por favor, seleccione al menos un artículo para alquilar.');
      return;
    }
    if (!customerName || !customerContact || !customerAddress) {
      alert('Todos los datos del cliente son obligatorios (Nombre, Contacto, Domicilio).');
      return;
    }

    const rentalData = {
      customerName: customerName.toUpperCase(),
      customerContact: customerContact.toUpperCase(),
      customerAddress: customerAddress.toUpperCase(),
      items: cart.map(c => ({
        productId: c.productId,
        productName: c.productName,
        quantity: c.quantity,
        price: c.price
      })),
      total: cartTotal,
      terms: terms,
      customerDniPhoto: dniPhoto || undefined
    };

    const newRental = localDb.addRental(rentalData);

    // Automatically trigger Double PDF print
    generateRentalReceiptPDF(newRental);

    // Reset Rental Form
    setCart([]);
    setCustomerName('');
    setCustomerContact('');
    setCustomerAddress('');
    setDniPhoto('');
    setTerms(defaultTerms);
    
    // Switch to history tab to view saved rentals
    setActiveTab('history');
    loadAllData();
  };

  // --- Return Rental item ---
  const handleReturnRental = (id: string) => {
    if (confirm('¿Confirmar que las prendas alquiladas han sido devueltas? Esto restablecerá el stock.')) {
      localDb.returnRental(id);
      loadAllData();
    }
  };

  // Filter rentals
  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rental.productName && rental.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rental.items && rental.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase())));
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && !rental.returned;
    if (filterStatus === 'returned') return matchesSearch && rental.returned;
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div className="border-l-[6px] border-emerald-900 pl-5 mb-8">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">Alquileres</h1>
        <p className="text-emerald-600 text-xl font-bold uppercase tracking-widest">Gestión de Prendas y Contratos</p>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-4 border-b-4 border-slate-900 pb-3">
        <button
          onClick={() => setActiveTab('rent')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wider transition-all border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
            activeTab === 'rent' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          REGISTRAR ALQUILER
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wider transition-all border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
            activeTab === 'history' 
              ? 'bg-emerald-900 text-white' 
              : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          HISTORIAL DE ALQUILERES
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wider transition-all border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
            activeTab === 'inventory' 
              ? 'bg-slate-950 text-white' 
              : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          STOCK DE ALQUILER ({rentalProducts.length})
        </button>
      </div>

      {/* TAB: REGISTER RENTAL */}
      {activeTab === 'rent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Middle: Select Product and Fill Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Select Rental Product */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
                <Package className="text-emerald-600" size={24} />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                  1. Seleccione Artículos y Cantidades para Alquilar
                </h3>
              </div>

              {rentalProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold uppercase text-sm border-2 border-dashed border-slate-200">
                  No hay artículos de alquiler en stock. Vaya a la pestaña "STOCK DE ALQUILER" para agregar artículos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                  {rentalProducts.map((prod) => {
                    const cartItem = cart.find(item => item.productId === prod.id);
                    const outOfStock = prod.stock <= 0;
                    return (
                      <div
                        key={prod.id}
                        className={`p-4 border-2 transition-all flex flex-col justify-between ${
                          outOfStock 
                            ? 'opacity-50 bg-slate-50 border-slate-200' 
                            : cartItem 
                              ? 'bg-emerald-50/50 border-emerald-600 shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]' 
                              : 'bg-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
                        }`}
                      >
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight text-slate-950 truncate">{prod.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{prod.details || 'SIN DETALLES'}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-emerald-600 font-black text-base italic">
                            ${Math.round(prod.price).toLocaleString('es-AR')}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 ${outOfStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-800'}`}>
                            STOCK: {prod.stock}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          {outOfStock ? (
                            <div className="text-center text-[10px] font-black text-red-600 uppercase py-1 bg-red-50 border border-red-200">
                              SIN STOCK DISPONIBLE
                            </div>
                          ) : cartItem ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 border-2 border-slate-900 bg-white">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(prod.id, cartItem.quantity - 1)}
                                  className="px-2 py-1 font-black text-xs hover:bg-slate-100 transition-colors border-r border-slate-900"
                                >
                                  -
                                </button>
                                <span className="px-2 font-black text-xs text-slate-950 w-8 text-center">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(prod.id, cartItem.quantity + 1)}
                                  disabled={cartItem.quantity >= prod.stock}
                                  className={`px-2 py-1 font-black text-xs border-l border-slate-900 transition-colors ${
                                    cartItem.quantity >= prod.stock 
                                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                      : 'hover:bg-slate-100'
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(prod.id)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-200 hover:border-red-600"
                                title="Quitar de la boleta"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod)}
                              className="w-full py-1.5 bg-slate-900 hover:bg-emerald-600 text-white hover:text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                            >
                              <Plus size={12} />
                              AGREGAR AL ALQUILER
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Customer Mandatory Information */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
                <User className="text-emerald-600" size={24} />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                  2. Datos Obligatorios del Cliente
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nombre y Apellido *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      placeholder="EJ: JUAN PÉREZ"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 pl-10 pr-4 py-2 font-bold uppercase text-sm focus:border-emerald-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Número de Contacto *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="EJ: 221-555-5555"
                        value={customerContact}
                        onChange={(e) => setCustomerContact(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 pl-10 pr-4 py-2 font-bold uppercase text-sm focus:border-emerald-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Domicilio / Dirección *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        placeholder="EJ: CALLE 44 Nº 1873, LA PLATA"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 pl-10 pr-4 py-2 font-bold uppercase text-sm focus:border-emerald-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Terms and Conditions */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
                <FileText className="text-emerald-600" size={24} />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                  3. Términos, Uso y Condiciones de la Boleta (Editable)
                </h3>
              </div>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={5}
                className="w-full bg-slate-50 border-2 border-slate-200 p-4 font-bold text-xs focus:border-emerald-600 outline-none transition-all resize-y custom-scrollbar"
                placeholder="Condiciones del contrato de alquiler..."
              />
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                * Este texto se imprimirá en el pie de ambas boletas (Cliente y Comercio).
              </p>
            </div>
          </div>

          {/* Right Column: DNI Photo upload and Confirmation */}
          <div className="space-y-8">
            {/* DNI File Uploader */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
                <ImageIcon className="text-emerald-600" size={24} />
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
                  Foto de Documento / DNI
                </h3>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-4 border-dashed rounded-none p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
                  isDragging 
                    ? 'border-emerald-600 bg-emerald-50 scale-102' 
                    : dniPhoto 
                      ? 'border-emerald-600 bg-white' 
                      : 'border-slate-300 hover:border-slate-900 bg-slate-50'
                }`}
                onClick={() => document.getElementById('dni-file-input')?.click()}
              >
                <input
                  id="dni-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {dniPhoto ? (
                  <div className="space-y-4 w-full">
                    <img 
                      src={dniPhoto} 
                      alt="Vista previa DNI" 
                      className="max-h-24 mx-auto border border-slate-200 shadow-sm"
                    />
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDni(dniPhoto);
                        }}
                        className="bg-emerald-50 text-emerald-900 border border-emerald-600 text-[10px] font-black uppercase px-2 py-1 hover:bg-emerald-100 transition-colors"
                      >
                        AMPLIAR FOTO
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDniPhoto('');
                        }}
                        className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase px-2 py-1 hover:bg-red-100 transition-colors"
                      >
                        REMOVER
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-slate-400 mb-3" size={32} />
                    <p className="font-black uppercase text-xs text-slate-900 mb-1">Arrastre la foto del DNI aquí</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">o haga click para explorar</p>
                  </>
                )}
              </div>
            </div>

            {/* Resume and Confirmation */}
            <div className="bg-emerald-900 text-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6">
              <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-emerald-800 pb-2">
                Resumen de Alquiler
              </h3>

              <div className="space-y-4 font-bold text-sm">
                <div className="border-b border-emerald-800/40 pb-2 space-y-1">
                  <span className="text-emerald-400 uppercase text-xs block">Artículos Seleccionados:</span>
                  {cart.length === 0 ? (
                    <span className="text-amber-400 uppercase font-black text-xs block">NINGUNO SELECCIONADO</span>
                  ) : (
                    <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {cart.map(item => (
                        <div key={item.productId} className="flex justify-between text-xs font-black uppercase text-white">
                          <span className="truncate max-w-[140px]">{item.productName}</span>
                          <span>x{item.quantity} - ${Math.round(item.price * item.quantity).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between border-b border-emerald-800/40 pb-2">
                  <span className="text-emerald-400 uppercase text-xs">Total Alquiler:</span>
                  <span className="text-right font-black italic text-lg text-emerald-300">
                    ${Math.round(cartTotal).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-800/40 pb-2">
                  <span className="text-emerald-400 uppercase text-xs">Cliente:</span>
                  <span className="text-right truncate max-w-[150px] uppercase">
                    {customerName ? customerName : 'NO ESPECIFICADO'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-800/40 pb-2">
                  <span className="text-emerald-400 uppercase text-xs">Fecha:</span>
                  <span className="text-right">
                    {format(new Date(), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-800/40 pb-2">
                  <span className="text-emerald-400 uppercase text-xs">DNI Cargado:</span>
                  <span className={`text-xs uppercase font-black ${dniPhoto ? 'text-emerald-300' : 'text-amber-400'}`}>
                    {dniPhoto ? 'SÍ (BASE64)' : 'NO CARGADO'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || !customerName || !customerContact || !customerAddress}
                onClick={handleConfirmRental}
                className={`w-full py-4 border-2 border-slate-900 font-black uppercase italic tracking-wider text-center text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                  (cart.length === 0 || !customerName || !customerContact || !customerAddress)
                    ? 'bg-emerald-950/40 text-emerald-800 border-emerald-950 cursor-not-allowed shadow-none'
                    : 'bg-white text-slate-900 hover:bg-emerald-50'
                }`}
              >
                CONFIRMAR ALQUILER Y GENERAR BOLETA DOBLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RENTALS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Controls: Search and Status Filters */}
          <div className="bg-white border-4 border-slate-900 p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="BUSCAR POR CLIENTE, NRO BOLETA O PRENDA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 pl-10 pr-4 py-2 font-bold uppercase text-sm focus:border-emerald-600 outline-none transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {(['all', 'pending', 'returned'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 font-black text-xs uppercase border-2 border-slate-900 transition-colors ${
                    filterStatus === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {status === 'all' && 'TODOS'}
                  {status === 'pending' && 'PENDIENTES DE DEVOLUCIÓN'}
                  {status === 'returned' && 'DEVUELTOS'}
                </button>
              ))}
            </div>
          </div>

          {/* List or Grid */}
          {filteredRentals.length === 0 ? (
            <div className="py-20 text-center text-slate-300 font-black uppercase italic text-2xl border-4 border-dotted border-slate-100 bg-white">
              No hay alquileres registrados que coincidan con los filtros.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRentals.map((rental) => {
                const dateVal = new Date(rental.rentalDate);
                return (
                  <div 
                    key={rental.id} 
                    className={`bg-white border-t-8 shadow-2xl p-6 relative overflow-hidden group transition-all border-4 ${
                      rental.returned 
                        ? 'border-slate-900 border-t-emerald-600' 
                        : 'border-slate-900 border-t-amber-500'
                    }`}
                  >
                    {/* Top right floating Badge */}
                    <div className="absolute top-0 right-0 p-2 bg-slate-900 text-white font-black text-[10px] uppercase tracking-tighter z-10">
                      {rental.receiptNumber}
                    </div>

                    {/* Status Ribbon */}
                    <div className="mb-4">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 tracking-widest ${
                        rental.returned 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {rental.returned ? 'DEVUELTO / COMPLETO' : 'PENDIENTE DE DEVOLUCIÓN'}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-400">MONTO DE ALQUILER</h4>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
                          ${Math.round(rental.total !== undefined ? rental.total : (rental.price || 0)).toLocaleString('es-AR')}
                        </h3>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Download PDF */}
                        <button
                          onClick={() => generateRentalReceiptPDF(rental)}
                          className="bg-emerald-100 text-emerald-900 p-2.5 hover:bg-emerald-600 hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(6,78,59,1)] active:translate-x-0.5 active:translate-y-0.5"
                          title="Imprimir Boleta Doble PDF"
                        >
                          <Download size={18} />
                        </button>
                        
                        {/* Expand DNI if present */}
                        {rental.customerDniPhoto && (
                          <button
                            onClick={() => setPreviewDni(rental.customerDniPhoto!)}
                            className="bg-blue-100 text-blue-900 p-2.5 hover:bg-blue-600 hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(30,58,138,1)] active:translate-x-0.5 active:translate-y-0.5"
                            title="Ver DNI guardado"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-2 mb-6 bg-slate-50 p-3 border-l-4 border-slate-900">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-950 uppercase tracking-tight">
                        <User size={13} className="text-emerald-600" />
                        <span className="truncate">{rental.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        <Phone size={13} className="text-slate-400" />
                        <span>{rental.customerContact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{rental.customerAddress}</span>
                      </div>
                    </div>

                    {/* Article Info */}
                    <div className="mb-6 space-y-2.5 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ARTÍCULOS ALQUILADOS</p>
                        {rental.items && rental.items.length > 0 ? (
                          <div className="space-y-1 mt-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {rental.items.map((item, idx) => (
                              <p key={idx} className="text-xs font-black uppercase text-slate-950 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Package size={12} className="text-emerald-600 flex-shrink-0" />
                                  <span className="truncate">{item.productName}</span>
                                </span>
                                <span className="text-slate-500 font-bold text-[10px]">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-black uppercase text-slate-950 flex items-center gap-2 mt-0.5">
                            <Package size={14} className="text-emerald-600" />
                            {rental.productName || 'PRENDA ALQUILADA'}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase text-slate-400">
                        <div>
                          <span>F. Alquiler:</span>
                          <span className="block font-black text-slate-950 text-[10px] mt-0.5">{format(dateVal, 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                        {rental.returned && rental.returnedDate && (
                          <div>
                            <span>F. Devolución:</span>
                            <span className="block font-black text-emerald-600 text-[10px] mt-0.5">{format(new Date(rental.returnedDate), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    {!rental.returned && (
                      <button
                        onClick={() => handleReturnRental(rental.id)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase italic tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      >
                        <CheckCircle size={15} />
                        MARCAR COMO DEVUELTO
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: STOCK DE ALQUILER (PRODUCTS MANAGEMENT) */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: List of Rental items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
                Inventario de Artículos de Alquiler
              </h3>

              {rentalProducts.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-black uppercase italic text-xl border-4 border-dotted border-slate-100">
                  No hay artículos registrados para alquiler en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-4 border-slate-900 text-slate-400 text-left text-[10px] font-black uppercase tracking-widest">
                        <th className="py-3">Artículo</th>
                        <th className="py-3">Descripción / Detalles</th>
                        <th className="py-3 text-right">Precio Alquiler</th>
                        <th className="py-3 text-center">Stock</th>
                        <th className="py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentalProducts.map((prod) => (
                        <tr key={prod.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 font-black uppercase text-sm text-slate-950">{prod.name}</td>
                          <td className="py-4 font-bold text-xs uppercase text-slate-500">{prod.details || 'SIN ESPECIFICAR'}</td>
                          <td className="py-4 text-right font-black text-emerald-600 italic text-base">${Math.round(prod.price).toLocaleString('es-AR')}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 font-black text-xs ${prod.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-900'}`}>
                              {prod.stock}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white px-2 py-1 text-[10px] font-black uppercase border border-slate-900 transition-colors"
                              >
                                EDITAR
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2 py-1 text-[10px] font-black uppercase border border-red-200 hover:border-red-600 transition-colors"
                              >
                                BORRAR
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Add / Edit form */}
          <div>
            {editingProduct ? (
              // Edit Form
              <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] sticky top-6">
                <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-slate-100">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                    Editar Artículo
                  </h3>
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nombre del Artículo</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold uppercase text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Precio de Alquiler ($)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Detalles / Talles</label>
                    <input
                      type="text"
                      value={editingProduct.details}
                      onChange={(e) => setEditingProduct({ ...editingProduct, details: e.target.value })}
                      placeholder="EJ: TALLES 38 AL 46, COMPLETO"
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold uppercase text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic tracking-wider text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    GUARDAR CAMBIOS
                  </button>
                </form>
              </div>
            ) : (
              // Add Form
              <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] sticky top-6">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-6 pb-2 border-b-2 border-slate-100">
                  Agregar Artículo Nuevo
                </h3>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nombre del Artículo</label>
                    <input
                      type="text"
                      required
                      placeholder="EJ: SACO DE EGRESADO"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold uppercase text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Precio Alquiler</label>
                      <input
                        type="number"
                        required
                        placeholder="Precio ($)"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold text-sm focus:border-slate-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Stock</label>
                      <input
                        type="number"
                        required
                        placeholder="Stock Inicial"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold text-sm focus:border-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Detalles / Talles (Opcional)</label>
                    <input
                      type="text"
                      placeholder="EJ: COLOR AZUL FRANCIA, TALLES S-M-L"
                      value={newProduct.details}
                      onChange={(e) => setNewProduct({ ...newProduct, details: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-200 p-2 font-bold uppercase text-sm focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-emerald-600 hover:text-white text-white font-black uppercase italic tracking-wider text-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    AGREGAR AL STOCK
                  </button>
                </form>
              </div>
            )}

            {/* Store Logo Management Card */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] mt-8">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
                <ImageIcon className="text-emerald-600" size={24} />
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
                  Logo del Local para Boletas
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 leading-tight">
                SUBIR EL LOGO DEL LOCAL PARA MOSTRARLO CENTRADO EN LA PARTE SUPERIOR DE LAS BOLETAS (TAMAÑO 4CM).
              </p>

              <div
                onDragOver={handleLogoDragOver}
                onDragLeave={handleLogoDragLeave}
                onDrop={handleLogoDrop}
                className={`border-4 border-dashed rounded-none p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
                  isLogoDragging 
                    ? 'border-emerald-600 bg-emerald-50 scale-102' 
                    : storeLogo 
                      ? 'border-emerald-600 bg-white' 
                      : 'border-slate-300 hover:border-slate-900 bg-slate-50'
                }`}
                onClick={() => document.getElementById('logo-file-input')?.click()}
              >
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                {storeLogo ? (
                  <div className="space-y-3 w-full">
                    <img 
                      src={storeLogo} 
                      alt="Logo del Local" 
                      className="max-h-16 mx-auto object-contain border border-slate-200 p-1"
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase px-3 py-1 hover:bg-red-100 transition-colors"
                      >
                        ELIMINAR LOGO
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="font-black uppercase text-[11px] text-slate-900 mb-0.5">Arrastre el Logo aquí</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">o haga click para explorar</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to view enlarged DNI Photo */}
      {previewDni && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-8 border-slate-900 p-6 max-w-4xl w-full shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] relative">
            <button
              onClick={() => setPreviewDni(null)}
              className="absolute top-4 right-4 bg-slate-900 text-white p-2 hover:bg-red-600 transition-colors border border-slate-900"
            >
              <X size={20} />
            </button>
            <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-slate-900 flex items-center gap-2">
              <ImageIcon className="text-emerald-600" /> Documento / DNI del Cliente
            </h4>
            <div className="flex justify-center border-4 border-slate-200 p-2 bg-slate-50 overflow-auto max-h-[70vh]">
              <img 
                src={previewDni} 
                alt="DNI del cliente ampliado" 
                className="max-w-full h-auto object-contain"
              />
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setPreviewDni(null)}
                className="bg-slate-900 text-white px-6 py-2.5 font-black uppercase text-xs hover:bg-emerald-600 transition-colors border border-slate-900"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
