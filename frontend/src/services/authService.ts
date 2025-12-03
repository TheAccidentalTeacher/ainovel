/**
 * Authentication Service
 * 
 * Handles user authentication with JWT tokens.
 * 🦸 CODE MASTER: BraveStarr's Justice - Security First!
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  custom_avatars_count: number;
  projects_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user';

  /**
   * Register new user account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/api/auth/register`, data);
    this.setToken(response.data.access_token);
    this.setUser(response.data.user);
    return response.data;
  }

  /**
   * Login existing user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/api/auth/login`, data);
    this.setToken(response.data.access_token);
    this.setUser(response.data.user);
    return response.data;
  }

  /**
   * Get current user profile from API
   */
  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await axios.get<User>(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    this.setUser(response.data);
    return response.data;
  }

  /**
   * Logout user and clear local storage
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get JWT token from storage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get user from storage
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Set token in storage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Set user in storage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
