
import { Product, Sale, Expense, RentalProduct, Rental } from './types';

const PRODUCTS_KEY = 'torre_productos';
const SALES_KEY = 'torre_ventas';
const EXPENSES_KEY = 'torre_gastos';
const RECEIPT_COUNTER_KEY = 'torre_boleta_counter';
const RENTAL_PRODUCTS_KEY = 'torre_alquiler_productos';
const RENTALS_KEY = 'torre_alquileres';
const RENTAL_RECEIPT_COUNTER_KEY = 'torre_alquiler_boleta_counter';

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

  // --- Alquileres Productos ---
  getRentalProducts: (): RentalProduct[] => {
    const data = localStorage.getItem(RENTAL_PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRentalProducts: (products: RentalProduct[]) => {
    localStorage.setItem(RENTAL_PRODUCTS_KEY, JSON.stringify(products));
  },

  addRentalProduct: (product: Omit<RentalProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const products = localDb.getRentalProducts();
    const newProduct: RentalProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    localDb.saveRentalProducts(products);
    return newProduct;
  },

  updateRentalProduct: (id: string, updates: Partial<RentalProduct>) => {
    const products = localDb.getRentalProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { 
        ...products[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      localDb.saveRentalProducts(products);
    }
  },

  deleteRentalProduct: (id: string) => {
    const products = localDb.getRentalProducts();
    localDb.saveRentalProducts(products.filter(p => p.id !== id));
  },

  // --- Alquileres ---
  getRentals: (): Rental[] => {
    const data = localStorage.getItem(RENTALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRentals: (rentals: Rental[]) => {
    localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
  },

  addRental: (rental: Omit<Rental, 'id' | 'receiptNumber' | 'rentalDate' | 'returned'>) => {
    const rentals = localDb.getRentals();
    const receiptNumber = localDb.getNextRentalReceiptNumber();
    const newRental: Rental = {
      ...rental,
      id: Date.now().toString(),
      receiptNumber,
      rentalDate: new Date().toISOString(),
      returned: false
    };
    rentals.unshift(newRental);
    localDb.saveRentals(rentals);

    // Subtract stock from the rented products
    const products = localDb.getRentalProducts();
    if (newRental.items && newRental.items.length > 0) {
      newRental.items.forEach(item => {
        const index = products.findIndex(p => p.id === item.productId);
        if (index !== -1) {
          products[index].stock = Math.max(0, products[index].stock - item.quantity);
        }
      });
    } else if (newRental.productId) {
      const index = products.findIndex(p => p.id === newRental.productId);
      if (index !== -1) {
        products[index].stock = Math.max(0, products[index].stock - 1);
      }
    }
    localDb.saveRentalProducts(products);

    return newRental;
  },

  returnRental: (id: string) => {
    const rentals = localDb.getRentals();
    const index = rentals.findIndex(r => r.id === id);
    if (index !== -1 && !rentals[index].returned) {
      rentals[index].returned = true;
      rentals[index].returnedDate = new Date().toISOString();
      localDb.saveRentals(rentals);

      // Restore stock
      const products = localDb.getRentalProducts();
      const rental = rentals[index];
      if (rental.items && rental.items.length > 0) {
        rental.items.forEach(item => {
          const pIndex = products.findIndex(p => p.id === item.productId);
          if (pIndex !== -1) {
            products[pIndex].stock += item.quantity;
          }
        });
      } else if (rental.productId) {
        const pIndex = products.findIndex(p => p.id === rental.productId);
        if (pIndex !== -1) {
          products[pIndex].stock += 1;
        }
      }
      localDb.saveRentalProducts(products);
    }
  },

  getNextRentalReceiptNumber: (): string => {
    const current = localStorage.getItem(RENTAL_RECEIPT_COUNTER_KEY);
    const nextValue = current !== null ? parseInt(current) + 1 : 1;
    localStorage.setItem(RENTAL_RECEIPT_COUNTER_KEY, nextValue.toString());
    return 'ALQ-' + nextValue.toString().padStart(5, '0');
  },

  getStoreLogo: (): string | null => {
    return localStorage.getItem('torre_store_logo');
  },

  saveStoreLogo: (logoBase64: string) => {
    localStorage.setItem('torre_store_logo', logoBase64);
  },

  deleteStoreLogo: () => {
    localStorage.removeItem('torre_store_logo');
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
      rentalProducts: localDb.getRentalProducts(),
      rentals: localDb.getRentals(),
      counter: localStorage.getItem(RECEIPT_COUNTER_KEY),
      rentalCounter: localStorage.getItem(RENTAL_RECEIPT_COUNTER_KEY),
      version: '1.2',
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
      if (data.rentalProducts) localDb.saveRentalProducts(data.rentalProducts);
      if (data.rentals) localDb.saveRentals(data.rentals);
      if (data.counter) localStorage.setItem(RECEIPT_COUNTER_KEY, data.counter);
      if (data.rentalCounter) localStorage.setItem(RENTAL_RECEIPT_COUNTER_KEY, data.rentalCounter);
      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }
};
