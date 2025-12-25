import { UserRole, User } from '../types';
import { LocalStorageService } from './local-storage.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export type AuthUser = User;

const AUTH_KEY = 'ca_practice_manager_auth';

const HARDCODED_USERS: Record<string, { user: AuthUser; password: string }> = {
  admin: {
    password: 'admin123',
    user: {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'admin@democaassociates.com',
      username: 'admin',
      full_name: 'Rajesh Sharma (Partner)',
      role: 'partner',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  manager: {
    password: 'manager123',
    user: {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'manager@democaassociates.com',
      username: 'manager',
      full_name: 'Suresh Kumar (Manager)',
      role: 'manager',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  staff: {
    password: 'staff123',
    user: {
      id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      firm_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'staff@democaassociates.com',
      username: 'staff',
      full_name: 'Anita Desai (Staff)',
      role: 'staff',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

class AuthService {
  async login(role: UserRole, credentials: LoginCredentials): Promise<AuthUser> {
    // Check credentials
    const hardcodedUser = HARDCODED_USERS[credentials.username];

    if (hardcodedUser && hardcodedUser.password === credentials.password) {
      if (hardcodedUser.user.role === role) {
        return hardcodedUser.user;
      } else {
        throw new Error('Unauthorized role for this user');
      }
    }

    throw new Error('Invalid credentials');
  }

  async logout(): Promise<void> {
    // No-op here, store handles state
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Rely on store state
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // In a fully local setup, we'd add this to a users list, 
    // but for the demo we mostly care about the active session.
    return newUser;
  }
}

export const authService = new AuthService();