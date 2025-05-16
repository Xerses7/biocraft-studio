'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { clientConfig } from '@/utils/clientConfig';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  socialLogin: (provider: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  csrfToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const BACKEND_URL = clientConfig.apiUrl;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch CSRF token on initial load
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/csrf-token`, {
          credentials: 'include' // Important for including cookies
        });
        
        if (response.ok) {
          // Get token from header
          const token = response.headers.get('X-CSRF-Token');
          if (token) {
            setCsrfToken(token);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    
    fetchCSRFToken();
  }, []);

  // Get session from cookie-based auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Directly get session from backend using HttpOnly cookie
        const response = await fetch(`${BACKEND_URL}/user/session`, {
          method: 'GET',
          credentials: 'include', // Important for including cookies
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });
        
        if (!response.ok) {
          // If session is invalid or expired, that's fine, user is just not logged in
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (data && data.session) {
          setSession(data.session);
        }
      } catch (error) {
        console.error('Error checking authentication session:', error);
        // Continue without session in case of error
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for receiving the HttpOnly cookie
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Set session state (user info is included in the response)
      setSession(data.session);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
      return data.session;
      
    } catch (error: any) {
      const errorMessage = error.name === 'TimeoutError' 
        ? 'Login request timed out. Please check your connection and try again.'
        : error.message || 'An unexpected error occurred';
        
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important even for signup
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      toast({
        title: 'Account created',
        description: 'Please check your email to verify your account.',
      });
      
      return data;
      
    } catch (error: any) {
      const errorMessage = error.name === 'TimeoutError' 
        ? 'Signup request timed out. Please check your connection and try again.'
        : error.message || 'An unexpected error occurred';
        
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call backend to clear session cookie
      const response = await fetch(`${BACKEND_URL}/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include', // Important for including cookies
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });
      
      if (!response.ok) {
        console.error('Logout API error:', response.status);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local state regardless of API response
      setSession(null);
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      
      router.push('/');
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: string) => {
    try {
      window.location.href = `${BACKEND_URL}/auth/${provider.toLowerCase()}`;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `${provider} login failed`,
        description: 'Unable to initiate social login. Please try again.',
      });
      console.error('Social login error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }
      
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists with this email, you will receive a password reset link.',
      });
      
    } catch (error: any) {
      const errorMessage = error.name === 'TimeoutError' 
        ? 'Password reset request timed out. Please check your connection and try again.'
        : error.message || 'Failed to send password reset email';
        
      toast({
        variant: 'destructive',
        title: 'Password Reset Failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        csrfToken,
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        signup,
        logout,
        socialLogin,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};