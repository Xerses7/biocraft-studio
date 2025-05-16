import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock delle dipendenze
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(),
}));

jest.mock('next/link', () => {
  // Mock di Link che renderizza il prop children come elemento <a>
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe('Navbar Component', () => {
  // Setup default mocks
  const mockRouter = { push: jest.fn() };
  const mockLogout = jest.fn();
  const mockToast = { toast: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      session: null,
      isAuthenticated: false,
      logout: mockLogout,
    });
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useIsMobile as jest.Mock).mockReturnValue(false); // Desktop view by default
  });
  
  test('renders the navbar with logo', () => {
    render(<Navbar />);
    
    // Check logo text
    expect(screen.getByText('BioCraft Studio')).toBeInTheDocument();
  });
  
  test('shows login button when not authenticated', () => {
    render(<Navbar />);
    
    // Check login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
    
    // Login links should NOT be present
    expect(screen.queryByText('Saved Recipes')).not.toBeInTheDocument();
    expect(screen.queryByText('Account')).not.toBeInTheDocument();
    expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
  });
  
  test('shows user menu when authenticated', () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      session: { 
        access_token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' } 
      },
      isAuthenticated: true,
      logout: mockLogout,
    });
    
    render(<Navbar />);
    
    // Login button should NOT be present
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    
    // User menu items should be present
    expect(screen.getByText('Saved Recipes')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    
    // Logout button should be present
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });
  
  test('calls login handler when login button is clicked', () => {
    render(<Navbar />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    
    // Should navigate to login page
    expect(mockRouter.push).toHaveBeenCalledWith('/?login=true');
  });
  
  test('calls logout handler when logout button is clicked', () => {
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      session: { 
        access_token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' } 
      },
      isAuthenticated: true,
      logout: mockLogout,
    });
    
    render(<Navbar />);
    
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(logoutButton);
    
    // Should call logout function
    expect(mockLogout).toHaveBeenCalled();
  });
  
  test('renders mobile menu when on mobile device', () => {
    // Mock mobile view
    (useIsMobile as jest.Mock).mockReturnValue(true);
    
    render(<Navbar />);
    
    // Mobile menu toggle should be visible
    const menuToggle = screen.getByLabelText('Open menu');
    expect(menuToggle).toBeInTheDocument();
    
    // Menu should be closed initially
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    
    // Open menu
    fireEvent.click(menuToggle);
    
    // After clicking, login button should appear
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});