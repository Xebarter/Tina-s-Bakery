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

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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

// ───── ABOUT CONTENT ───────────────────────────────────────

// Default about content to use when not logged in or if there's an error
const defaultAboutContent = {
  id: 'default',
  title: 'Our Story',
  content: 'Welcome to our bakery. We are passionate about creating delicious baked goods with the finest ingredients.',
  images: ['https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export async function fetchAboutContent(): Promise<any> {
  console.log('Fetching about content...');
  try {
    // First, try to fetch existing content
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .limit(1);

    console.log('About content fetch result:', { data, error });

    // If we have data, return it
    if (data && data.length > 0) {
      console.log('Returning existing about content:', data[0]);
      return data[0];
    }

    console.log('No existing about content found, checking for session...');
    
    // If no content exists and we're authenticated, try to create a default entry
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    console.log('Session check:', { session, sessionError });
    
    if (session) {
      console.log('Creating default about content...');
      const { data: newData, error: insertError } = await supabase
        .from('about_content')
        .insert([{
          id: 'default',
          title: defaultAboutContent.title,
          content: defaultAboutContent.content,
          images: defaultAboutContent.images,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      console.log('Create default content result:', { newData, insertError });

      if (insertError) {
        console.error('Error creating default content:', insertError);
      } else if (newData) {
        return newData;
      }
    }
    
    console.log('Returning default about content');
    return defaultAboutContent;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetchAboutContent:', errorMessage);
    return defaultAboutContent;
  }
}

export interface AboutContentUpdate {
  title: string;
  content: string;
  images: string[];
  updated_at?: string;
}

export async function updateAboutContent(id: string, updates: Omit<AboutContentUpdate, 'updated_at'>): Promise<AboutContentUpdate> {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Authentication required:', sessionError?.message || 'No active session');
      throw new Error('You must be logged in to update the about content');
    }

    // Prepare the update data
    const updateData: AboutContentUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Check if content exists
    const { data: existingContent, error: fetchError } = await supabase
      .from('about_content')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    let result;
    
    if (existingContent) {
      // Update existing content
      const { data, error: updateError } = await supabase
        .from('about_content')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      result = data;
    } else {
      // Insert new content
      const { data, error: insertError } = await supabase
        .from('about_content')
        .insert([{ id, ...updateData, created_at: new Date().toISOString() }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      result = data;
    }
    
    if (!result) {
      throw new Error('Failed to save about content: No data returned');
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateAboutContent:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while updating the about content'
    );
  }
}

// Team Members
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

export async function addCategory(category: { name: string; slug: string; description?: string }): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, updates: { name?: string; slug?: string; description?: string }): Promise<any> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
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
