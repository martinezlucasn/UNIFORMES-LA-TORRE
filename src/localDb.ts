
import { Product, Sale } from './types';

const PRODUCTS_KEY = 'torre_productos';
const SALES_KEY = 'torre_ventas';
const RECEIPT_COUNTER_KEY = 'torre_boleta_counter';

export const localDb = {
  // --- Productos ---
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  getNextReceiptNumber: (): string => {
    const current = localStorage.getItem(RECEIPT_COUNTER_KEY);
    // If it doesn't exist, start from 0
    const nextValue = current !== null ? parseInt(current) + 1 : 0;
    localStorage.setItem(RECEIPT_COUNTER_KEY, nextValue.toString());
    return nextValue.toString().padStart(5, '0');
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const products = localDb.getProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    localDb.saveProducts(products);
    return newProduct;
  },

  updateProduct: (id: string, updates: Partial<Product>) => {
    const products = localDb.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { 
        ...products[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      localDb.saveProducts(products);
    }
  },

  deleteProduct: (id: string) => {
    const products = localDb.getProducts();
    localDb.saveProducts(products.filter(p => p.id !== id));
  },

  // --- Ventas ---
  getSales: (): Sale[] => {
    const data = localStorage.getItem(SALES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSales: (sales: Sale[]) => {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  },

  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    const sales = localDb.getSales();
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    sales.unshift(newSale); // Nueva venta al principio
    localDb.saveSales(sales);
    return newSale;
  },

  // --- Utilidades de Stock ---
  updateStock: (productId: string, quantitySold: number) => {
    const products = localDb.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index].stock -= quantitySold;
      localDb.saveProducts(products);
    }
  }
};
