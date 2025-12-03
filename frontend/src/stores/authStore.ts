/**
 * Authentication Store (Zustand)
 * 
 * Global state management for authentication.
 * 🦸 CODE MASTER: He-Man's Power - Centralized State Control!
 */

import { create } from 'zustand';
import { authService, type User } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ email, password, name });
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ 
        error: errorMessage, 
        isLoading: false,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    });
  },

  checkAuth: async () => {
    if (!authService.isAuthenticated()) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      // Token expired or invalid
      authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));
