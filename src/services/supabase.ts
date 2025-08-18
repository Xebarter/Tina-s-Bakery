import { createClient } from '@supabase/supabase-js';
import type {
  Product,
  Order,
  Customer,
  TeamMember
} from '../types';

// Environment configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ───── PRODUCTS ────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addProduct(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  // Create a type-safe updates object for the database
  type ProductUpdate = {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    category_id?: string;
    image_url?: string;
    in_stock?: boolean;
    inventory?: number;
    is_seasonal?: boolean;
    is_signature?: boolean;
    display_settings?: any;
  };

  // Type assertion to access the properties we know exist on the Product type
  const productUpdates = updates as unknown as Partial<{
    image: string;
    inStock: boolean;
    isSeasonalSpecial: boolean;
    isSignatureProduct: boolean;
  }>;

  // Map frontend fields to database fields
  const { slug, ...restUpdates } = updates as any;
  const dbUpdates: ProductUpdate = {
    ...restUpdates,
    image_url: productUpdates.image,
    in_stock: productUpdates.inStock,
    // Removed is_seasonal and is_signature as they do not exist in schema
  };

  // Remove fields that shouldn't be sent to the database
  delete (dbUpdates as any).image;
  delete (dbUpdates as any).inStock;
  delete (dbUpdates as any).isSeasonalSpecial;
  delete (dbUpdates as any).isSignatureProduct;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Map database fields back to frontend model
  return {
    ...data,
    image: data.image_url,
    inStock: data.in_stock,
    // Removed isSeasonalSpecial and isSignatureProduct mapping
  };
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase
    .storage
    .from('product-images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for product image.');
  }

  return publicUrlData.publicUrl;
}

// Fetch a single product by id
export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

// ───── ORDERS ──────────────────────────────────────────────

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addOrder(order: Order): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

// ───── CUSTOMERS ───────────────────────────────────────────

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addCustomer(customer: Customer): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

// ───── TEAM MEMBERS ───────────────────────────────────────

export async function fetchTeamMembers(): Promise<any[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  return data || [];
}

export async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([member])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ───── CATEGORIES ─────────────────────────────────────────

export async function fetchCategories(): Promise<{ id: string; name: string; description?: string }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addCategory(category: { name: string; description?: string }): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: category.name, description: category.description }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, updates: { name?: string; description?: string }): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: updates.name, description: updates.description })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ───── DESIGN IMAGES ─────────────────────────────────────

export async function uploadDesignImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `design-${Date.now()}.${fileExt}`;
  const filePath = `designs/${fileName}`;

  // Upload the file to Supabase Storage
  const { error: uploadError } = await supabase
    .storage
    .from('designs')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Error uploading design image:', uploadError);
    throw new Error(`Failed to upload design image: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('designs')
    .getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error('Failed to get public URL for design image');
  }

  console.log('Design image uploaded successfully:', publicUrl);
  return publicUrl;
}

export async function getDesignImageUrl(path: string): Promise<string> {
  const { data: { publicUrl } } = supabase
    .storage
    .from('designs')
    .getPublicUrl(path);

  if (!publicUrl) {
    throw new Error('Failed to get design image URL');
  }

  return publicUrl;
}
