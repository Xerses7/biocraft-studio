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
        const response = await fetch(`${BACKEND_URL}/csrf-token`, {
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

  useEffect(() => {
    const initAuth = async () => {
      // Check for stored session
      let storedAuth = null;
      
      try {
        storedAuth = localStorage.getItem('biocraft_auth');
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        setIsLoading(false);
        return;
      }
      
      if (!storedAuth) {
        setIsLoading(false);
        return;
      }
      
      try {
        const parsedAuth = JSON.parse(storedAuth);
        
        // Check if token is expired (if timestamp exists)
        if (parsedAuth.timestamp) {
          const now = Date.now();
          const tokenAge = now - parsedAuth.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          
          if (tokenAge > maxAge) {
            console.log('Stored token expired');
            localStorage.removeItem('biocraft_auth');
            setIsLoading(false);
            return;
          }
        }
        
        // Validate stored session token against backend
        try {
          const response = await fetch(`${BACKEND_URL}/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${parsedAuth.token}`,
            },
            // Adding timeout to prevent long hanging requests
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Reconstruct session from stored token and user data
            const reconstructedSession = {
              access_token: parsedAuth.token,
              token_type: 'bearer',
              expires_in: 3600, // Default expiration
              expires_at: parsedAuth.timestamp + (3600 * 1000),
              refresh_token: parsedAuth.refresh_token || '',
              user: data.user
            };
            
            setSession(reconstructedSession);
          } else {
            // If token is invalid, remove from storage
            console.log('Token validation failed with status:', response.status);
            localStorage.removeItem('biocraft_auth');
          }
        } catch (fetchError) {
          // Handle network errors during token validation
          console.error('Network error during token validation:', fetchError);
          
          // Create a session from stored data, but mark it as potentially invalid
          // This allows the app to work offline with limited functionality
          if (parsedAuth.token) {
            const offlineSession = {
              access_token: parsedAuth.token,
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: parsedAuth.timestamp + (3600 * 1000),
              refresh_token: parsedAuth.refresh_token || '',
              user: { 
                id: 'offline',
                email: 'offline@example.com',
                role: 'user'
              }
            };
            setSession(offlineSession);
            
            // Let the user know they're working in offline mode
            toast({
              title: 'Network Error',
              description: 'Working in offline mode. Some features may be limited.',
              variant: 'destructive',
            });
          }
        }
      } catch (parseError) {
        console.error('Error parsing stored auth:', parseError);
        localStorage.removeItem('biocraft_auth');
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, [toast]);

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
        credentials: 'include',
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      setSession(data.session);
      
      // Store session in localStorage
      localStorage.setItem('biocraft_auth', JSON.stringify({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        timestamp: Date.now(),
      }));
      
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
    
    // First, clean up local state regardless of API call result
    console.log('Starting logout process - clearing local state');
    setSession(null);
    localStorage.removeItem('biocraft_auth');
    
    // Then attempt to communicate with the backend, but don't block on it
    if (session?.access_token) {
      const signoutUrl = `${BACKEND_URL}/signout`;
      console.log(`Attempting to notify backend at: ${signoutUrl}`);
      
      try {
        // Ensure we're sending the token as a string
        const tokenString = String(session.access_token).trim();
        
        const response = await fetch(signoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenString}`,
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          credentials: 'include', // Include cookies if needed
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });
        
        if (response.ok) {
          console.log('Backend signout successful:', response.status);
        } else {
          console.error('Backend signout returned error status:', response.status);
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response as JSON');
          }
        }
      } catch (error) {
        console.error('Backend signout notification failed with error:', error);
      }
    } else {
      console.log('No active session token found, skipping backend notification');
    }
    
    // Show success message and redirect
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    
    router.push('/');
    setIsLoading(false);
    console.log('Logout process completed');
  };
  

  const socialLogin = async (provider: string) => {
    try {
      // For social login, we're redirecting to the backend, so no need for timeout
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