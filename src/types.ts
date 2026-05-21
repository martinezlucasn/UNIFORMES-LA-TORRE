export interface Product {
  id: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  details: string;
  stock: number;
  hasVariants?: boolean;
  variants?: { size: string; stock: number; image?: string }[];
  image?: string;
  createdAt: any;
  updatedAt: any;
}

export interface SaleItem {
  productId: string;
  name: string;
  size?: string;
  quantity: number;
  price: number;
  purchasePrice: number; // Added to track cost at time of sale
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerName?: string;
  customerContact?: string;
  items: SaleItem[];
  subtotal: number;
  surcharge: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  deposit?: number;
  balanceDue?: number;
  createdAt: any;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO String
}

export type ViewType = 'menu' | 'products' | 'sales' | 'history' | 'finances' | 'quotes' | 'settings' | 'advances';
