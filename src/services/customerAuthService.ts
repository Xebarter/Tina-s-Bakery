import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

export interface Customer {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  address: string;
  city: string;
  country: string;
  accountType: 'registered' | 'billing_only';
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRegistrationData {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  address: string;
  city: string;
  country?: string;
}

export interface CustomerLoginData {
  phone: string;
  password: string;
  rememberMe?: boolean;
}

export interface BillingCustomerData {
  phone: string;
  fullName: string;
  email?: string;
  address: string;
  city: string;
  country?: string;
}

class CustomerAuthService {
  private currentCustomer: Customer | null = null;
  private sessionToken: string | null = null;

  constructor() {
    this.loadSession();
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming Uganda +256)
    if (digits.length === 9 && digits.startsWith('7')) {
      return `+256${digits}`;
    } else if (digits.length === 10 && digits.startsWith('07')) {
      return `+256${digits.substring(1)}`;
    } else if (digits.length === 12 && digits.startsWith('256')) {
      return `+${digits}`;
    } else if (digits.length === 13 && digits.startsWith('256')) {
      return `+${digits}`;
    }
    
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  private validatePhoneNumber(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    const ugandaPhoneRegex = /^\+256[7][0-9]{8}$/;
    return ugandaPhoneRegex.test(normalized);
  }

  private validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password + 'bakery_salt_2024').toString();
  }

  private generateSessionToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private async saveSession(customer: Customer, token: string, rememberMe: boolean = false): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (rememberMe ? 24 * 30 : 24)); // 30 days or 24 hours

    try {
      // Save session to database
      const { error } = await supabase
        .from('customer_sessions')
        .insert({
          customer_id: customer.id,
          session_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // Save to localStorage
      localStorage.setItem('customerSession', JSON.stringify({
        token,
        customerId: customer.id,
        expiresAt: expiresAt.toISOString(),
      }));

      this.currentCustomer = customer;
      this.sessionToken = token;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session');
    }
  }

  private async loadSession(): Promise<void> {
    try {
      const sessionData = localStorage.getItem('customerSession');
      if (!sessionData) return;

      const { token, customerId, expiresAt } = JSON.parse(sessionData);
      
      if (new Date() > new Date(expiresAt)) {
        this.clearSession();
        return;
      }

      // Verify session in database
      const { data: sessionRecord, error: sessionError } = await supabase
        .from('customer_sessions')
        .select('*')
        .eq('session_token', token)
        .eq('customer_id', customerId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (sessionError || !sessionRecord) {
        this.clearSession();
        return;
      }

      // Load customer data
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('is_active', true)
        .maybeSingle();

      if (customerError || !customer) {
        this.clearSession();
        return;
      }

      this.currentCustomer = this.mapCustomerFromDB(customer);
      this.sessionToken = token;
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('customerSession');
    this.currentCustomer = null;
    this.sessionToken = null;
  }

  private mapCustomerFromDB(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      phone: dbCustomer.phone,
      fullName: dbCustomer.full_name,
      email: dbCustomer.email,
      address: dbCustomer.address,
      city: dbCustomer.city,
      country: dbCustomer.country,
      accountType: dbCustomer.account_type,
      isActive: dbCustomer.is_active,
      totalOrders: dbCustomer.total_orders,
      totalSpent: parseFloat(dbCustomer.total_spent || '0'),
      lastOrderDate: dbCustomer.last_order_date,
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at,
    };
  }

  async register(data: CustomerRegistrationData): Promise<Customer> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(data.phone);
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number (e.g., 0700123456)');
      }

      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join('. '));
      }

      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingCustomer) {
        throw new Error('An account with this phone number already exists');
      }

      const passwordHash = this.hashPassword(data.password);

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          phone: normalizedPhone,
          password_hash: passwordHash,
          full_name: data.fullName.trim(),
          email: data.email?.trim() || null,
          address: data.address.trim(),
          city: data.city.trim(),
          country: data.country || 'Uganda',
          account_type: 'registered',
        })
        .select()
        .single();

      if (error) throw error;

      const customer = this.mapCustomerFromDB(newCustomer);
      const sessionToken = this.generateSessionToken();
      await this.saveSession(customer, sessionToken);

      return customer;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: CustomerLoginData): Promise<Customer> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(data.phone);
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number');
      }

      const passwordHash = this.hashPassword(data.password);

      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .eq('account_type', 'registered')
        .maybeSingle();

      if (error) throw error;

      if (!customer) {
        throw new Error('Invalid phone number or password');
      }

      const customerData = this.mapCustomerFromDB(customer);
      const sessionToken = this.generateSessionToken();
      await this.saveSession(customerData, sessionToken, data.rememberMe);

      return customerData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async createBillingCustomer(data: BillingCustomerData): Promise<Customer> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(data.phone);
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number');
      }

      // Check if customer already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingCustomer) {
        // Update existing customer with new information if provided
        const updateData: any = {};
        if (data.fullName.trim() !== existingCustomer.full_name) {
          updateData.full_name = data.fullName.trim();
        }
        if (data.email && data.email.trim() !== existingCustomer.email) {
          updateData.email = data.email.trim();
        }
        if (data.address.trim() !== existingCustomer.address) {
          updateData.address = data.address.trim();
        }
        if (data.city.trim() !== existingCustomer.city) {
          updateData.city = data.city.trim();
        }

        if (Object.keys(updateData).length > 0) {
          const { data: updatedCustomer, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', existingCustomer.id)
            .select()
            .single();

          if (error) throw error;
          return this.mapCustomerFromDB(updatedCustomer);
        }

        return this.mapCustomerFromDB(existingCustomer);
      }

      // Create new billing-only customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          phone: normalizedPhone,
          full_name: data.fullName.trim(),
          email: data.email?.trim() || null,
          address: data.address.trim(),
          city: data.city.trim(),
          country: data.country || 'Uganda',
          account_type: 'billing_only',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapCustomerFromDB(newCustomer);
    } catch (error) {
      console.error('Billing customer creation error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.sessionToken) {
        // Remove session from database
        await supabase
          .from('customer_sessions')
          .delete()
          .eq('session_token', this.sessionToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  getCurrentCustomer(): Customer | null {
    return this.currentCustomer;
  }

  async updateProfile(updates: Partial<CustomerRegistrationData>): Promise<Customer> {
    if (!this.currentCustomer) {
      throw new Error('No customer logged in');
    }

    try {
      const updateData: any = {};

      if (updates.fullName?.trim()) {
        updateData.full_name = updates.fullName.trim();
      }

      if (updates.email !== undefined) {
        updateData.email = updates.email?.trim() || null;
      }

      if (updates.address?.trim()) {
        updateData.address = updates.address.trim();
      }

      if (updates.city?.trim()) {
        updateData.city = updates.city.trim();
      }

      if (updates.password) {
        const passwordValidation = this.validatePassword(updates.password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.errors.join('. '));
        }
        updateData.password_hash = this.hashPassword(updates.password);
      }

      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', this.currentCustomer.id)
        .select()
        .single();

      if (error) throw error;

      this.currentCustomer = this.mapCustomerFromDB(updatedCustomer);
      return this.currentCustomer;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return customers.map(this.mapCustomerFromDB);
    } catch (error) {
      console.error('Get customers error:', error);
      throw error;
    }
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number;
    registeredCustomers: number;
    billingOnlyCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('customers')
        .select('account_type, is_active, total_spent');

      if (error) throw error;

      const totalCustomers = stats.length;
      const registeredCustomers = stats.filter(c => c.account_type === 'registered').length;
      const billingOnlyCustomers = stats.filter(c => c.account_type === 'billing_only').length;
      const activeCustomers = stats.filter(c => c.is_active).length;
      const totalRevenue = stats.reduce((sum, c) => sum + parseFloat(c.total_spent || '0'), 0);

      return {
        totalCustomers,
        registeredCustomers,
        billingOnlyCustomers,
        activeCustomers,
        totalRevenue,
      };
    } catch (error) {
      console.error('Get customer stats error:', error);
      throw error;
    }
  }
}

export const customerAuthService = new CustomerAuthService();