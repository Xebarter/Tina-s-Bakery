import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface PhoneRegisterData {
  phone: string;
  password: string;
  fullName: string;
}

export interface VerifyOtpData {
  phone: string;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  shippingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface PhoneLoginData {
  phone: string;
  password: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface Address {
  id: string;
  addressType: 'shipping' | 'billing';
  isDefault: boolean;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  id: string;
  paymentType: 'card' | 'mobile_money' | 'bank_account';
  isDefault: boolean;
  provider: string;
  maskedNumber: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
}

class AuthService {
  async registerWithPhone(data: PhoneRegisterData): Promise<{ userId: string }> {
    try {
      // First, check if phone number already exists
      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', data.phone)
        .single();

      if (existingUser) {
        throw new Error('Phone number already registered');
      }

      // Create user in auth table
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: data.phone,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
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
          phone: data.phone,
          full_name: data.fullName,
          phone_verified: false,
        });

      if (profileError) throw profileError;

      return { userId: authData.user.id };
    } catch (error) {
      console.error('Phone registration error:', error);
      throw error;
    }
  }

  async sendOtp(phone: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: false,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOtp({ phone, token }: VerifyOtpData): Promise<{ session: any }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
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

      return { session: data.session };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  async loginWithPhone({ phone, password }: PhoneLoginData): Promise<{ user: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      return { user: data.user };
    } catch (error) {
      console.error('Phone login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<{ user: User; needsVerification: boolean }> {
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile immediately after signup
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            email_verified: !!authData.user.email_confirmed_at,
          });

        if (profileError) throw profileError;

        // Create default shipping address
        const { error: addressError } = await supabase
          .from('user_addresses')
          .insert({
            user_id: authData.user.id,
            address_type: 'shipping',
            is_default: true,
            full_name: data.fullName,
            address_line_1: data.shippingAddress.addressLine1,
            address_line_2: data.shippingAddress.addressLine2,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postal_code: data.shippingAddress.postalCode,
            country: data.shippingAddress.country,
            phone: data.phone,
          });

        if (addressError) throw addressError;

        // Log security event
        await this.logSecurityEvent(authData.user.id, 'registration', true);

        return {
          user: {
            id: authData.user.id,
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            emailVerified: !!authData.user.email_confirmed_at,
            createdAt: new Date().toISOString(),
          },
          needsVerification: !authData.user.email_confirmed_at
        };
      }

      throw new Error('Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<User> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        // Get user profile
        let { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!profile) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email || data.email,
              full_name: authData.user.user_metadata?.full_name || 'User',
              phone: authData.user.user_metadata?.phone,
              email_verified: !!authData.user.email_confirmed_at,
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create user profile:', createError);
            throw new Error('Failed to create user profile');
          }

          profile = newProfile;
        }

        // Update last login now that we know the profile exists
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);

        // Log security event after profile is confirmed to exist
        await this.logSecurityEvent(authData.user.id, 'login', true);

        return {
          id: authData.user.id,
          email: profile.email,
          fullName: profile.full_name,
          phone: profile.phone,
          emailVerified: profile.email_verified,
          lastLogin: profile.last_login,
          createdAt: profile.created_at,
        };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      await this.logSecurityEvent(null, 'login', false, { email: data.email });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Invalidate remember me sessions
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Log security event
        await this.logSecurityEvent(user.id, 'logout', true);
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) return null;

      return {
        id: user.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        emailVerified: profile.email_verified,
        lastLogin: profile.last_login,
        createdAt: profile.created_at,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(null, 'password_reset_request', true, { email });
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.logSecurityEvent(user.id, 'password_reset', true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async getUserAddresses(): Promise<Address[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return data.map(addr => ({
        id: addr.id,
        addressType: addr.address_type,
        isDefault: addr.is_default,
        fullName: addr.full_name,
        addressLine1: addr.address_line_1,
        addressLine2: addr.address_line_2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        phone: addr.phone,
      }));
    } catch (error) {
      console.error('Get addresses error:', error);
      throw error;
    }
  }

  async getUserPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return data.map(pm => ({
        id: pm.id,
        paymentType: pm.payment_type,
        isDefault: pm.is_default,
        provider: pm.provider,
        maskedNumber: pm.masked_number,
        expiryMonth: pm.expiry_month,
        expiryYear: pm.expiry_year,
        cardholderName: pm.cardholder_name,
      }));
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  private async logSecurityEvent(
    userId: string | null,
    eventType: string,
    success: boolean,
    details?: any
  ): Promise<void> {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          event_type: eventType,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          success,
          details,
        });
    } catch (error) {
      console.error('Log security event error:', error);
      // Don't throw error for audit logging failures
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '0.0.0.0';
    }
  }
}

export const authService = new AuthService();