import { supabase } from './supabase';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  registrationSource: 'direct' | 'order';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithOrders extends Customer {
  orders: any[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export interface CustomerRegistrationData {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  registrationSource: 'direct' | 'order';
}

class CustomerService {
  private customers: Customer[] = [];

  constructor() {
    this.loadCustomersFromStorage();
  }

  private loadCustomersFromStorage(): void {
    try {
      const storedCustomers = localStorage.getItem('bakeryCustomers');
      if (storedCustomers) {
        this.customers = JSON.parse(storedCustomers);
      }
    } catch (error) {
      console.error('Failed to load customers from storage:', error);
      this.customers = [];
    }
  }

  private saveCustomersToStorage(): void {
    try {
      localStorage.setItem('bakeryCustomers', JSON.stringify(this.customers));
    } catch (error) {
      console.error('Failed to save customers to storage:', error);
    }
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
    
    // Return as-is if already formatted or unknown format
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  private validatePhoneNumber(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    // Basic validation for Uganda phone numbers
    const ugandaPhoneRegex = /^\+256[7][0-9]{8}$/;
    return ugandaPhoneRegex.test(normalized);
  }

  async registerCustomer(data: CustomerRegistrationData): Promise<Customer> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(data.phone);
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number (e.g., 0700123456)');
      }

      if (!data.fullName.trim()) {
        throw new Error('Full name is required');
      }

      if (!data.address.trim()) {
        throw new Error('Address is required');
      }

      if (!data.city.trim()) {
        throw new Error('City is required');
      }

      // Check if customer already exists
      const existingCustomer = this.customers.find(c => c.phone === normalizedPhone);
      if (existingCustomer) {
        // Update existing customer with new information
        existingCustomer.fullName = data.fullName.trim();
        existingCustomer.email = data.email?.trim() || existingCustomer.email;
        existingCustomer.address = data.address.trim();
        existingCustomer.city = data.city.trim();
        existingCustomer.updatedAt = new Date().toISOString();
        
        this.saveCustomersToStorage();
        return existingCustomer;
      }

      // Create new customer
      const newCustomer: Customer = {
        id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fullName: data.fullName.trim(),
        phone: normalizedPhone,
        email: data.email?.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        registrationSource: data.registrationSource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.customers.push(newCustomer);
      this.saveCustomersToStorage();
      
      return newCustomer;
    } catch (error) {
      console.error('Customer registration error:', error);
      throw error;
    }
  }

  async findOrCreateCustomer(data: CustomerRegistrationData): Promise<Customer> {
    const normalizedPhone = this.normalizePhoneNumber(data.phone);
    const existingCustomer = this.customers.find(c => c.phone === normalizedPhone);
    
    if (existingCustomer) {
      // Update customer information if new details provided
      let updated = false;
      
      if (data.fullName.trim() && data.fullName.trim() !== existingCustomer.fullName) {
        existingCustomer.fullName = data.fullName.trim();
        updated = true;
      }
      
      if (data.email?.trim() && data.email.trim() !== existingCustomer.email) {
        existingCustomer.email = data.email.trim();
        updated = true;
      }
      
      if (data.address.trim() && data.address.trim() !== existingCustomer.address) {
        existingCustomer.address = data.address.trim();
        updated = true;
      }
      
      if (data.city.trim() && data.city.trim() !== existingCustomer.city) {
        existingCustomer.city = data.city.trim();
        updated = true;
      }
      
      if (updated) {
        existingCustomer.updatedAt = new Date().toISOString();
        this.saveCustomersToStorage();
      }
      
      return existingCustomer;
    }
    
    // Create new customer
    return await this.registerCustomer(data);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    return this.customers.find(c => c.phone === normalizedPhone) || null;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customers.find(c => c.id === id) || null;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return [...this.customers].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCustomersWithOrders(orders: any[]): Promise<CustomerWithOrders[]> {
    const customers = await this.getAllCustomers();
    
    return customers.map(customer => {
      const customerOrders = orders.filter(order => 
        order.customerId === customer.id || order.customerPhone === customer.phone
      );
      
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const lastOrderDate = customerOrders.length > 0 
        ? customerOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0].orderDate
        : undefined;

      return {
        ...customer,
        orders: customerOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
        totalOrders: customerOrders.length,
        totalSpent,
        lastOrderDate,
      };
    });
  }

  async updateCustomer(id: string, updates: Partial<CustomerRegistrationData>): Promise<Customer> {
    const customerIndex = this.customers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    const customer = this.customers[customerIndex];
    
    if (updates.phone) {
      const normalizedPhone = this.normalizePhoneNumber(updates.phone);
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number');
      }
      
      // Check if phone number is already used by another customer
      const existingCustomer = this.customers.find(c => c.phone === normalizedPhone && c.id !== id);
      if (existingCustomer) {
        throw new Error('Phone number is already registered to another customer');
      }
      
      customer.phone = normalizedPhone;
    }

    if (updates.fullName?.trim()) {
      customer.fullName = updates.fullName.trim();
    }

    if (updates.email !== undefined) {
      customer.email = updates.email?.trim() || undefined;
    }

    if (updates.address?.trim()) {
      customer.address = updates.address.trim();
    }

    if (updates.city?.trim()) {
      customer.city = updates.city.trim();
    }

    customer.updatedAt = new Date().toISOString();
    this.saveCustomersToStorage();
    
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customerIndex = this.customers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    this.customers.splice(customerIndex, 1);
    this.saveCustomersToStorage();
  }

  // Statistics methods
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    directRegistrations: number;
    orderRegistrations: number;
    customersWithOrders: number;
    customersWithoutOrders: number;
  }> {
    const totalCustomers = this.customers.length;
    const directRegistrations = this.customers.filter(c => c.registrationSource === 'direct').length;
    const orderRegistrations = this.customers.filter(c => c.registrationSource === 'order').length;
    
    // This would need to be calculated with actual order data
    const customersWithOrders = 0; // Placeholder
    const customersWithoutOrders = totalCustomers;

    return {
      totalCustomers,
      directRegistrations,
      orderRegistrations,
      customersWithOrders,
      customersWithoutOrders,
    };
  }
}

export const customerService = new CustomerService();