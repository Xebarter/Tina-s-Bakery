export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  category_id: string; // uuid of the category
  image: string;
  inStock: boolean;
  inventory: number;
  featured?: boolean;
  isSeasonalSpecial?: boolean;
  isSignatureProduct?: boolean;
  sold?: number;
  display_settings?: {
    badges?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  account_type?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  order_date: string;
  payment_method: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CakeOrder {
  id: string;
  customerId: string;
  cakeType: string;
  size: string;
  flavor: string;
  frosting: string;
  decorations: string[];
  customText: string;
  designImage?: string;
  price?: number; // Make price optional
  neededBy: string;
  status: 'quote' | 'confirmed' | 'in-progress' | 'ready';
  notes?: string;
}

export interface InventoryItem {
  productId: string;
  currentStock: number;
  lowStockThreshold: number;
  lastUpdated: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  orderCount: number;
  topProducts: { productId: string; quantity: number; revenue: number; }[];
  customerCount: number;
}