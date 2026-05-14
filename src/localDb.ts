
import { Product, Sale, Expense } from './types';

const PRODUCTS_KEY = 'torre_productos';
const SALES_KEY = 'torre_ventas';
const EXPENSES_KEY = 'torre_gastos';
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

  // --- Gastos ---
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  },

  addExpense: (expense: Omit<Expense, 'id'>) => {
    const expenses = localDb.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString()
    };
    expenses.unshift(newExpense);
    localDb.saveExpenses(expenses);
    return newExpense;
  },

  deleteExpense: (id: string) => {
    const expenses = localDb.getExpenses();
    localDb.saveExpenses(expenses.filter(e => e.id !== id));
  },

  // --- Utilidades de Stock ---
  updateStock: (productId: string, quantitySold: number) => {
    const products = localDb.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index].stock -= quantitySold;
      localDb.saveProducts(products);
    }
  },

  // --- Backup & Restore ---
  exportData: () => {
    const data = {
      products: localDb.getProducts(),
      sales: localDb.getSales(),
      expenses: localDb.getExpenses(),
      counter: localStorage.getItem(RECEIPT_COUNTER_KEY),
      version: '1.1',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_torre_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products) localDb.saveProducts(data.products);
      if (data.sales) localDb.saveSales(data.sales);
      if (data.expenses) localDb.saveExpenses(data.expenses);
      if (data.counter) localStorage.setItem(RECEIPT_COUNTER_KEY, data.counter);
      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }
};
