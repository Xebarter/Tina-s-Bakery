// User and Authentication
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer' | 'staff';
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Product related types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  isFeatured: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  stock?: number;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Cart related types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  specialInstructions?: string;
}

// Order related types
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: string;
  paymentMethod: 'card' | 'cash' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

// Custom Cake Order types
export interface CakeOrder {
  id: string;
  userId: string;
  size: string;
  flavor: string;
  frosting: string;
  filling?: string;
  toppings?: string[];
  decorations?: string[];
  customText?: string;
  message?: string;
  specialInstructions?: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'quote';
  pickupDate: string;
  price: number;
  imageUrl?: string;
  designImage?: string; // For design inspiration images
  cakeType?: string;
  notes?: string;
  customerId?: string;
  neededBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Team Member
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// About Content
export interface AboutContent {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: 'card' | 'cash' | 'bank_transfer';
  specialInstructions?: string;
}
