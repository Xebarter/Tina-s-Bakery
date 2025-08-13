import React, { createContext, useContext, useReducer, ReactNode, useCallback, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  Product, 
  CartItem, 
  Customer, 
  Order, 
  CakeOrder, 
  Category, 
  AboutContent,
  TeamMember
} from '../types';
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  fetchCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  fetchAboutContent,
  updateAboutContent,
  fetchTeamMembers,
  addTeamMember as addTeamMemberService,
  updateTeamMember as updateTeamMemberService,
  deleteTeamMember as deleteTeamMemberService
} from '../services/supabase';

interface AppState {
  products: Product[];
  cart: CartItem[];
  currentUser: Customer | null;
  customers: Customer[];
  orders: Order[];
  cakeOrders: CakeOrder[];
  isAdminMode: boolean;
  categories: Category[];
  aboutContent: AboutContent | null;
  teamMembers: TeamMember[];
  authLoading: boolean;
  authError: string | null;
}

type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  name: string;
  imageUrl?: string;
};

type AppAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_USER'; payload: Customer | null }
  | { type: 'TOGGLE_ADMIN_MODE' }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'REMOVE_PRODUCT'; payload: string }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_ABOUT_CONTENT'; payload: AboutContent }
  | { type: 'SET_TEAM_MEMBERS'; payload: TeamMember[] }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'ADD_CAKE_ORDER'; payload: CakeOrder }
  | { type: 'UPDATE_INVENTORY'; payload: { productId: string; quantity: number } };

const initialState: AppState = {
  products: [],
  cart: [],
  currentUser: null,
  customers: [],
  orders: [],
  cakeOrders: [],
  isAdminMode: false,
  categories: [],
  aboutContent: null,
  teamMembers: [],
  authLoading: false,
  authError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART':
      // Check if product is already in cart
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.payload.id
              ? { 
                  ...item, 
                  quantity: item.quantity + 1,
                  product: { ...item.product } // Ensure product reference is updated
                }
              : item
          ),
        };
      }
      
      // Add new item to cart
      return {
        ...state,
        cart: [
          ...state.cart, 
          { 
            id: action.payload.id, 
            product: action.payload.product, 
            quantity: action.payload.quantity, 
            price: action.payload.price, 
            name: action.payload.name, 
            imageUrl: action.payload.imageUrl
          }
        ],
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { 
                ...item, 
                quantity: action.payload.quantity,
                product: { ...item.product } // Ensure product reference is updated
              }
            : item
        ),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'TOGGLE_ADMIN_MODE':
      return { ...state, isAdminMode: !state.isAdminMode };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id 
            ? { ...product, ...action.payload, updatedAt: new Date().toISOString() }
            : product
        )
      };
      
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload]
      };
      
    case 'REMOVE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };

    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };

    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
      };

    case 'ADD_CAKE_ORDER':
      return {
        ...state,
        cakeOrders: [...state.cakeOrders, action.payload],
      };

    case 'UPDATE_INVENTORY':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.productId
            ? { ...product, inventory: action.payload.quantity }
            : product
        ),
      };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'SET_ORDERS':
      return { ...state, orders: action.payload };

    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'SET_ABOUT_CONTENT':
      return { ...state, aboutContent: action.payload };

    case 'SET_TEAM_MEMBERS':
      return { ...state, teamMembers: action.payload };

    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id ? action.payload : member
        ),
      };

    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.id !== action.payload),
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Product management
  reloadProducts: () => Promise<Product[]>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  editProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Product>;
  removeProduct: (id: string) => Promise<void>;
  // Auth
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  registerWithPhone: (phone: string, password: string, fullName: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  // Order management
  reloadOrders: () => Promise<void>;
  createOrder: (order: Order) => Promise<void>;
  editOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
  // Customer management
  reloadCustomers: () => Promise<void>;
  createCustomer: (customer: Customer) => Promise<void>;
  editCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  // Category management
  reloadCategories: () => Promise<void>;
  createCategory: (category: { name: string; description?: string }) => Promise<void>;
  editCategory: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  // About content
  reloadAboutContent: () => Promise<void>;
  updateAboutContent: (id: string, updates: Partial<AboutContent>) => Promise<{ success: boolean; error?: string }>;
  // Team members
  reloadTeamMembers: () => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<TeamMember>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<TeamMember>;
  deleteTeamMember: (id: string) => Promise<void>;
}

export type { AppContextType };

// Create and export the context with a default value
export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('customers')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            dispatch({ type: 'SET_USER', payload: profile });
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null });
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);
  
  // Handle logout
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any stored tokens
      localStorage.removeItem('authToken');
      
      // Reset app state
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Failed to log out. Please try again.');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [dispatch, setAuthError, setAuthLoading]);

  // Load initial data when component mounts
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load products
        const products = await fetchProducts();
        dispatch({ type: 'SET_PRODUCTS', payload: products });

        // Load categories
        const categories = await fetchCategories();
        // Ensure each category has a slug and matches the Category type
        const categoriesWithSlugs = categories.map((cat) => ({
          ...cat,
          slug: (cat as any).slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          description: (cat as any).description || '',
        })) as Category[];
        dispatch({ type: 'SET_CATEGORIES', payload: categoriesWithSlugs });

        // Load about content
        const aboutContent = await fetchAboutContent();
        if (aboutContent) {
          dispatch({ type: 'SET_ABOUT_CONTENT', payload: aboutContent });
        }

        // Load team members
        const teamMembers = await fetchTeamMembers();
        dispatch({ type: 'SET_TEAM_MEMBERS', payload: teamMembers });
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Product management functions
  const reloadProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const products = await fetchProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
      return products;
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }, []);

  const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    try {
      // Create a complete product with required fields
      const newProductData = {
        ...productData,
        slug: productData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      };
      
      const newProduct = await addProduct(newProductData);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }, []);

  const editProduct = useCallback(async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
    try {
      const updatedProduct = await updateProduct(id, updates);
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      return updatedProduct;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }, []);

  const removeProduct = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteProduct(id);
      dispatch({ type: 'REMOVE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }, []);

  // Order management functions
  const reloadOrders = useCallback(async (): Promise<void> => {
    try {
      const orders = await fetchOrders();
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (error) {
      console.error('Failed to load orders:', error);
      throw error;
    }
  }, []);

  // Customer management functions
  const reloadCustomers = useCallback(async (): Promise<void> => {
    try {
      const customers = await fetchCustomers();
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
    } catch (error) {
      console.error('Failed to load customers:', error);
      throw error;
    }
  }, []);

  // Category management functions
  const reloadCategories = useCallback(async (): Promise<void> => {
    try {
      const categories = await fetchCategories();
      const categoriesWithSlugs: Category[] = categories.map(category => {
        const slug = 'slug' in category && category.slug 
          ? category.slug 
          : category.name
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-');
              
        return {
          ...category,
          slug,
          id: category.id,
          name: category.name,
          description: 'description' in category ? String(category.description) : '',
          createdAt: 'createdAt' in category ? String(category.createdAt) : new Date().toISOString(),
          updatedAt: 'updatedAt' in category ? String(category.updatedAt) : new Date().toISOString(),
        };
      });
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesWithSlugs });
    } catch (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
  }, []);

  // Create the context value object with all required properties
  const contextValue: AppContextType = {
    state: {
      ...state,
      authLoading,
      authError,
    },
    dispatch: (action: AppAction) => dispatch(action),
    createProduct,
    editProduct,
    removeProduct,
    reloadProducts: async (): Promise<Product[]> => {
      try {
        const products = await fetchProducts();
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        return products;
      } catch (error) {
        console.error('Failed to reload products:', error);
        throw error;
      }
    },
    loginWithPhone: async (phone: string, password: string): Promise<void> => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        
        const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password,
        });

        if (error) throw error;
        if (!data.session) throw new Error('No session returned');
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        dispatch({ type: 'SET_USER', payload: profile });
      } catch (error: any) {
        console.error('Login error:', error);
        setAuthError(error.message || 'Failed to login');
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    registerWithPhone: async (phone: string, password: string, fullName: string): Promise<void> => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        
        // Format phone number if needed
        const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
        
        // Check if phone already exists
        const { data: existingUser, error: lookupError } = await supabase
          .from('users')
          .select('id')
          .eq('phone', formattedPhone)
          .single();

        if (existingUser) {
          throw new Error('Phone number already registered');
        }

        // Create user in auth table
        const { data: authData, error: authError } = await supabase.auth.signUp({
          phone: formattedPhone,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: formattedPhone,
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            phone: formattedPhone,
            full_name: fullName,
            phone_verified: false,
          });

        if (profileError) throw profileError;
        
        return;
      } catch (error: any) {
        console.error('Registration error:', error);
        setAuthError(error.message || 'Registration failed');
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    sendOtp: async (phone: string): Promise<void> => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        
        const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
        
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: {
            shouldCreateUser: false,
          },
        });
        
        if (error) throw error;
      } catch (error: any) {
        console.error('Error sending OTP:', error);
        setAuthError(error.message || 'Failed to send OTP');
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    verifyOtp: async (phone: string, token: string): Promise<void> => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        
        const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
        
        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token,
          type: 'sms',
        });

        if (error) throw error;
        if (!data.session) throw new Error('No session returned');

        // Update user's phone_verified status
        await supabase
          .from('users')
          .update({ phone_verified: true })
          .eq('id', data.session.user.id);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileError) throw profileError;
        
        dispatch({ type: 'SET_USER', payload: profile });
        
        return;
      } catch (error: any) {
        console.error('OTP verification error:', error);
        setAuthError(error.message || 'Failed to verify OTP');
        throw error;
      } finally {
        setAuthLoading(false);
      }
    },
    logout: handleLogout,
    authLoading,
    authError,
    clearAuthError,
    // Order management
    reloadOrders: async (): Promise<void> => {
      try {
        const orders = await fetchOrders();
        dispatch({ type: 'SET_ORDERS', payload: orders });
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    },
    createOrder: async (order: Order): Promise<void> => {
      try {
        await addOrder(order);
        await reloadOrders();
      } catch (error) {
        console.error('Failed to create order:', error);
      }
    },
    editOrder: async (id: string, updates: Partial<Order>): Promise<void> => {
      try {
        await updateOrder(id, updates);
        await reloadOrders();
      } catch (error) {
        console.error('Failed to update order:', error);
      }
    },
    removeOrder: async (id: string): Promise<void> => {
      try {
        await deleteOrder(id);
        await reloadOrders();
      } catch (error) {
        console.error('Failed to delete order:', error);
      }
    },
    // Customer management
    reloadCustomers: async (): Promise<void> => {
      try {
        const customers = await fetchCustomers();
        dispatch({ type: 'SET_CUSTOMERS', payload: customers });
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    },
    createCustomer: async (customer: Customer): Promise<void> => {
      try {
        await addCustomer(customer);
        await reloadCustomers();
      } catch (error) {
        console.error('Failed to create customer:', error);
      }
    },
    editCustomer: async (id: string, updates: Partial<Customer>): Promise<void> => {
      try {
        await updateCustomer(id, updates);
        await reloadCustomers();
      } catch (error) {
        console.error('Failed to update customer:', error);
      }
    },
    removeCustomer: async (id: string): Promise<void> => {
      try {
        await deleteCustomer(id);
        await reloadCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
      }
    },
    // Category management
    reloadCategories: async (): Promise<void> => {
      try {
        const categories = await fetchCategories();
        // Ensure each category has a slug
        const categoriesWithSlugs: Category[] = categories.map(category => {
          const slug = ('slug' in category && typeof category.slug === 'string') 
            ? category.slug
            : category.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            
          return {
            id: category.id,
            name: category.name,
            description: 'description' in category ? String(category.description) : undefined,
            slug,
            createdAt: 'createdAt' in category ? String(category.createdAt) : new Date().toISOString(),
            updatedAt: 'updatedAt' in category ? String(category.updatedAt) : new Date().toISOString(),
          };
        });
        dispatch({ type: 'SET_CATEGORIES', payload: categoriesWithSlugs });
      } catch (error) {
        console.error('Failed to load categories:', error);
        throw error;
      }
    },
    createCategory: async (category: { name: string; description?: string; slug?: string }): Promise<void> => {
      try {
        // Generate a URL-friendly slug from the category name
        const slug = category.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-')      // Replace spaces with hyphens
          .replace(/-+/g, '-');      // Replace multiple hyphens with a single one
        
        await addCategory({ 
          ...category, 
          slug 
        });
        await reloadCategories();
      } catch (error) {
        console.error('Failed to add category:', error);
        throw error;
      }
    },
    editCategory: async (id: string, updates: { name?: string; description?: string; slug?: string }): Promise<void> => {
      try {
        // If name is being updated, update the slug as well
        const updateData: { name?: string; description?: string; slug?: string } = { ...updates };
        if (updates.name) {
          updateData.slug = updates.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        }
        
        await updateCategory(id, updateData);
        await reloadCategories();
      } catch (error) {
        console.error('Failed to update category:', error);
        throw error;
      }
    },
    removeCategory: async (id: string): Promise<void> => {
      try {
        await deleteCategory(id);
        await reloadCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    },
    // About content
    reloadAboutContent: async (): Promise<void> => {
      try {
        const content = await fetchAboutContent();
        dispatch({ type: 'SET_ABOUT_CONTENT', payload: content });
      } catch (error) {
        console.error('Failed to load about content:', error);
      }
    },
    updateAboutContent: async (id: string, updates: Partial<AboutContent>): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { 
            success: false, 
            error: 'You must be logged in to update the about content. Please sign in and try again.' 
          };
        }

        const updatedContent = await updateAboutContent(id, updates);
        dispatch({ type: 'SET_ABOUT_CONTENT', payload: updatedContent });
        return { success: true };
      } catch (error) {
        console.error('Failed to update about content:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while updating the about content.';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    },
    // Team members
    reloadTeamMembers: async (): Promise<void> => {
      try {
        const members = await fetchTeamMembers();
        dispatch({ type: 'SET_TEAM_MEMBERS', payload: members });
      } catch (error) {
        console.error('Failed to load team members:', error);
      }
    },
    addTeamMember: async (member: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
      try {
        const newMember = await addTeamMemberService(member);
        dispatch({ type: 'ADD_TEAM_MEMBER', payload: newMember });
        return newMember;
      } catch (error) {
        console.error('Failed to add team member:', error);
        throw error;
      }
    },
    updateTeamMember: async (id: string, updates: Partial<TeamMember>): Promise<TeamMember> => {
      try {
        const updatedMember = await updateTeamMemberService(id, updates);
        dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: updatedMember });
        return updatedMember;
      } catch (error) {
        console.error('Failed to update team member:', error);
        throw error;
      }
    },
    deleteTeamMember: async (id: string): Promise<void> => {
      try {
        await deleteTeamMemberService(id);
        dispatch({ type: 'DELETE_TEAM_MEMBER', payload: id });
      } catch (error) {
        console.error('Failed to delete team member:', error);
        throw error;
      }
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}
