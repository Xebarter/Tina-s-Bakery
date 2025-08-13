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
  slug?: string;
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
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loyaltyPoints: number;
  orders: Order[];
  joinDate: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderDate: string;
  pickupDate?: string;
  notes?: string;
  paymentMethod: string;
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

export interface AboutSection {
  id: string;
  title: string;
  content: string;
  images: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutContent {
  sections: AboutSection[];
}