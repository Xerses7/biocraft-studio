'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      // Check for stored session
      const storedAuth = localStorage.getItem('biocraft_auth');
      
      if (storedAuth) {
        try {
          const parsedAuth = JSON.parse(storedAuth);
          
          // Validate stored session token against backend
          const response = await fetch(`${BACKEND_URL}/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${parsedAuth.token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setSession(data.session);
          } else {
            // If token is invalid, remove from storage
            localStorage.removeItem('biocraft_auth');
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.removeItem('biocraft_auth');
        }
      }
      
      setIsLoading(false);
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
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      setSession(data.session);
      
      // Store session in localStorage
      localStorage.setItem('biocraft_auth', JSON.stringify({
        token: data.session.access_token,
        timestamp: Date.now(),
      }));
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'An unexpected error occurred',
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
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      toast({
        title: 'Account created',
        description: 'Please check your email to verify your account.',
      });
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'An unexpected error occurred',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      if (session?.access_token) {
        await fetch(`${BACKEND_URL}/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      }
      
      setSession(null);
      localStorage.removeItem('biocraft_auth');
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      
      router.push('/');
      
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear the session even if the API call fails
      setSession(null);
      localStorage.removeItem('biocraft_auth');
    } finally {
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

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        signup,
        logout,
        socialLogin,
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