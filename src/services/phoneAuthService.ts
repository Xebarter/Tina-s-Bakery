export interface PhoneUser {
  id: string;
  phone: string;
  name?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface PhoneLoginData {
  phone: string;
  name?: string;
}

class PhoneAuthService {
  private currentUser: PhoneUser | null = null;
  private users: PhoneUser[] = [];

  constructor() {
    // Load users from localStorage on initialization
    this.loadUsersFromStorage();
  }

  private loadUsersFromStorage(): void {
    try {
      const storedUsers = localStorage.getItem('phoneUsers');
      const currentUserData = localStorage.getItem('currentPhoneUser');
      
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }
      
      if (currentUserData) {
        this.currentUser = JSON.parse(currentUserData);
      }
    } catch (error) {
      console.error('Failed to load users from storage:', error);
      this.users = [];
      this.currentUser = null;
    }
  }

  private saveUsersToStorage(): void {
    try {
      localStorage.setItem('phoneUsers', JSON.stringify(this.users));
      if (this.currentUser) {
        localStorage.setItem('currentPhoneUser', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('currentPhoneUser');
      }
    } catch (error) {
      console.error('Failed to save users to storage:', error);
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

  async loginOrRegister(data: PhoneLoginData): Promise<PhoneUser> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(data.phone);
      
      if (!this.validatePhoneNumber(normalizedPhone)) {
        throw new Error('Please enter a valid phone number (e.g., 0700123456)');
      }

      // Check if user already exists
      let user = this.users.find(u => u.phone === normalizedPhone);
      
      if (user) {
        // Existing user - login
        user.lastLogin = new Date().toISOString();
        if (data.name && data.name.trim()) {
          user.name = data.name.trim();
        }
      } else {
        // New user - register
        user = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          phone: normalizedPhone,
          name: data.name?.trim() || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        this.users.push(user);
      }

      this.currentUser = user;
      this.saveUsersToStorage();
      
      return user;
    } catch (error) {
      console.error('Login/Register error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<PhoneUser | null> {
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('currentPhoneUser');
  }

  async updateProfile(updates: Partial<Pick<PhoneUser, 'name'>>): Promise<PhoneUser> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    // Update current user
    if (updates.name !== undefined) {
      this.currentUser.name = updates.name.trim() || undefined;
    }

    // Update in users array
    const userIndex = this.users.findIndex(u => u.id === this.currentUser!.id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.currentUser };
    }

    this.saveUsersToStorage();
    return this.currentUser;
  }

  // Get all users (for admin purposes)
  getAllUsers(): PhoneUser[] {
    return [...this.users];
  }

  // Delete user account
  async deleteAccount(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    this.users = this.users.filter(u => u.id !== this.currentUser!.id);
    this.currentUser = null;
    this.saveUsersToStorage();
  }
}

export const phoneAuthService = new PhoneAuthService();