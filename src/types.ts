export interface Product {
  id: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  details: string;
  stock: number;
  createdAt: any;
  updatedAt: any;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  surcharge: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdAt: any;
}

export type ViewType = 'menu' | 'products' | 'sales' | 'history';
