// src/__tests__/components/Navbar.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// src/__tests__/components/ErrorBoundary.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Mock console.error to prevent test output noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

// Component that throws an error
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working Component</div>;
};

describe('ErrorBoundary Component', () => {
  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });
  
  test('renders fallback UI when error occurs', () => {
    // We need to mock the error boundary lifecycle method
    // since Jest doesn't support error boundaries well
    const errorSpy = jest.spyOn(console, 'error');
    errorSpy.mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Error boundary should show error UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    // Buttons
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    
    errorSpy.mockRestore();
  });
  
  test('try again button resets the error state', () => {
    // We need to mock the error boundary lifecycle method
    const errorSpy = jest.spyOn(console, 'error');
    errorSpy.mockImplementation(() => {});
    
    // Using state to control if component should throw
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      React.useEffect(() => {
        // Create a mock for resetError that will update our state
        // This lets us simulate the ErrorBoundary's resetError functionality
        const originalReset = ErrorBoundary.prototype.resetError;
        ErrorBoundary.prototype.resetError = function() {
          setShouldThrow(false);
          originalReset.call(this);
        };
        
        return () => {
          ErrorBoundary.prototype.resetError = originalReset;
        };
      }, []);
      
      return (
        <ErrorBoundary>
          <BuggyComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };
    
    render(<TestComponent />);
    
    // Error boundary should show error UI initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click "Try Again" button
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    
    // Now it should show working component
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.getByText('Working Component')).toBeInTheDocument();
    
    errorSpy.mockRestore();
  });
  
  test('uses custom fallback if provided', () => {
    const errorSpy = jest.spyOn(console, 'error');
    errorSpy.mockImplementation(() => {});
    
    const customFallback = <div>Custom Error UI</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Should use custom fallback
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    
    // Default error UI should not be present
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    
    errorSpy.mockRestore();
  });
});

// src/__tests__/app/recipe/page.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipePage from '@/app/recipe/page';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRecipe } from '@/context/RecipeContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { jsPDF } from 'jspdf';

// Mock delle dipendenze
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/context/RecipeContext', () => ({
  useRecipe: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn().mockImplementation((text) => [text]),
    addPage: jest.fn(),
    internal: { pageSize: { width: 200 } },
    getNumberOfPages: jest.fn().mockReturnValue(1),
    setPage: jest.fn(),
    save: jest.fn(),
  })),
}));

describe('RecipePage Component', () => {
  // Setup default mocks
  const mockRouter = { push: jest.fn() };
  const mockToast = { toast: jest.fn() };
  const mockSetCurrentRecipe = jest.fn();
  const mockRecipeString = JSON.stringify({
    recipeName: 'Test Recipe',
    description: 'A test recipe description',
    version: '1.0',
    author: 'Test Author',
    dateCreated: '2025-01-01',
    Materials: [
      { name: 'Material 1', quantity: '10g', supplier: 'Supplier A' }
    ],
    Procedure: [
      { title: 'Step 1', steps: ['Do this', 'Do that'] }
    ],
    Troubleshooting: [
      { issue: 'Problem 1', solution: 'Solution 1' }
    ],
    Notes: [
      { note: 'Note 1' }
    ]
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useRecipe as jest.Mock).mockReturnValue({
      currentRecipe: mockRecipeString,
      setCurrentRecipe: mockSetCurrentRecipe,
      savedRecipes: [],
      setSavedRecipes: jest.fn(),
      saveRecipeToDb: jest.fn(),
      loadRecipesFromDb: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
    (useIsMobile as jest.Mock).mockReturnValue(false);
  });
  
  test('renders recipe details correctly', () => {
    render(<RecipePage />);
    
    // Check recipe title
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    
    // Check recipe description
    expect(screen.getByText('A test recipe description')).toBeInTheDocument();
    
    // Check sections
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Procedure')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    
    // Check specific content
    expect(screen.getByText('Material 1')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Problem 1')).toBeInTheDocument();
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    
    // Check metadata
    expect(screen.getByText('Created: 2025-01-01')).toBeInTheDocument();
    expect(screen.getByText('Version: 1.0')).toBeInTheDocument();
    expect(screen.getByText('Author: Test Author')).toBeInTheDocument();
  });
  
  test('displays no recipe message when no recipe data', () => {
    // Mock no recipe
    (useRecipe as jest.Mock).mockReturnValue({
      currentRecipe: null,
      setCurrentRecipe: mockSetCurrentRecipe,
      savedRecipes: [],
    });
    
    render(<RecipePage />);
    
    // Should show no recipe message
    expect(screen.getByText('No Recipe Found')).toBeInTheDocument();
    
    // Should have return button
    const returnButton = screen.getByRole('button', { name: /return to home/i });
    expect(returnButton).toBeInTheDocument();
    
    // Clicking should navigate
    fireEvent.click(returnButton);
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
  
  test('handles Download PDF button click', async () => {
    render(<RecipePage />);
    
    // Find download button
    const downloadButton = screen.getByRole('button', { name: /download as pdf/i });
    expect(downloadButton).toBeInTheDocument();
    
    // Click it
    fireEvent.click(downloadButton);
    
    // Should call jsPDF
    expect(jsPDF).toHaveBeenCalled();
    
    // Should show success toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'PDF Downloaded',
          description: 'Your recipe has been downloaded as a PDF file.',
        })
      );
    });
  });
  
  test('discard recipe button clears current recipe', () => {
    render(<RecipePage />);
    
    // Find discard button
    const discardButton = screen.getByRole('button', { name: /discard recipe/i });
    expect(discardButton).toBeInTheDocument();
    
    // Click it
    fireEvent.click(discardButton);
    
    // Should clear recipe
    expect(mockSetCurrentRecipe).toHaveBeenCalledWith(null);
    
    // Should navigate to home
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
  
  test('shows login prompt for unauthenticated users', () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
    
    render(<RecipePage />);
    
    // Should show login button
    const loginButton = screen.getByRole('button', { name: /login to save/i });
    expect(loginButton).toBeInTheDocument();
    
    // Clicking should navigate to login
    fireEvent.click(loginButton);
    expect(mockRouter.push).toHaveBeenCalledWith('/?login=true');
  });
});

// src/__tests__/hooks/use-mobile.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useIsMobile, useIsTablet, useBreakpoint, BREAKPOINTS } from '@/hooks/use-mobile';

// Mock window functions
const mockMatchMedia = jest.fn();

describe('Mobile hooks', () => {
  beforeAll(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024, // Default to desktop width
    });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for matchMedia (desktop)
    const mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQueryList);
  });
  
  test('useIsMobile returns true for mobile width', () => {
    // Mock mobile screen
    const mockMobileMediaQueryList = {
      matches: true, // Mobile width
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMobileMediaQueryList);
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.mobile - 1 });
    
    const { result } = renderHook(() => useIsMobile());
    
    // Should be true for mobile width
    expect(result.current).toBe(true);
    
    // Should have set up event listener
    expect(mockMobileMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
  
  test('useIsMobile returns false for desktop width', () => {
    // Mock desktop screen
    const mockDesktopMediaQueryList = {
      matches: false, // Not mobile width
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockMatchMedia.mockReturnValue(mockDesktopMediaQueryList);
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.tablet + 1 });
    
    const { result } = renderHook(() => useIsMobile());
    
    // Should be false for desktop width
    expect(result.current).toBe(false);
  });
  
  test('useIsTablet returns true for tablet width', () => {
    // Mock tablet screen
    const mockTabletMediaQueryList = {
      matches: true, // Tablet width
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockMatchMedia.mockReturnValue(mockTabletMediaQueryList);
    Object.defineProperty(window, 'innerWidth', { 
      value: BREAKPOINTS.tablet + 1 // Just above tablet min
    });
    
    const { result } = renderHook(() => useIsTablet());
    
    // Should be true for tablet width
    expect(result.current).toBe(true);
  });
  
  test('useBreakpoint returns correct breakpoint for different widths', () => {
    // Test mobile
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.mobile - 1 });
    const { result: mobileResult, unmount: mobileUnmount } = renderHook(() => useBreakpoint());
    expect(mobileResult.current).toBe('mobile');
    mobileUnmount();
    
    // Test tablet
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.tablet + 1 });
    const { result: tabletResult, unmount: tabletUnmount } = renderHook(() => useBreakpoint());
    expect(tabletResult.current).toBe('tablet');
    tabletUnmount();
    
    // Test desktop
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.desktop + 1 });
    const { result: desktopResult, unmount: desktopUnmount } = renderHook(() => useBreakpoint());
    expect(desktopResult.current).toBe('desktop');
    desktopUnmount();
    
    // Test wide
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINTS.wide + 1 });
    const { result: wideResult } = renderHook(() => useBreakpoint());
    expect(wideResult.current).toBe('wide');
  });
  
  test('hooks should cleanup event listeners on unmount', () => {
    // Setup event listeners
    const mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQueryList);
    
    // Render hooks
    const { unmount: unmountMobile } = renderHook(() => useIsMobile());
    const { unmount: unmountTablet } = renderHook(() => useIsTablet());
    const { unmount: unmountBreakpoint } = renderHook(() => useBreakpoint());
    
    // Unmount hooks
    unmountMobile();
    unmountTablet();
    unmountBreakpoint();
    
    // Check if event listeners were removed
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
  });
});

// src/__tests__/utils/utils.test.ts
import { cn, formatDate, truncateText, delay, getInitials } from '@/lib/utils';

describe('Utils functions', () => {
  test('cn merges class names correctly', () => {
    // Basic class merging
    expect(cn('class1', 'class2')).toBe('class1 class2');
    
    // Conditional classes
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
    
    // With Tailwind conflicts
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-blue-500');
  });
  
  test('formatDate formats dates correctly', () => {
    // Test with string date
    expect(formatDate('2025-01-15')).toBe('January 15, 2025');
    
    // Test with Date object
    expect(formatDate(new Date(2025, 0, 15))).toBe('January 15, 2025');
    
    // Test with time included
    expect(formatDate('2025-01-15T14:30:00', true)).toMatch(/January 15, 2025.*[0-9]{1,2}:[0-9]{2}/);
    
    // Test with invalid date
    expect(formatDate('invalid-date')).toBe('Invalid date');
  });
  
  test('truncateText truncates text to specified length', () => {
    const longText = 'This is a very long text that should be truncated at a specific length.';
    
    // Default truncation (100 chars)
    expect(truncateText(longText)).toBe(longText);
    
    // Custom truncation
    expect(truncateText(longText, 20)).toBe('This is a very long...');
    
    // Short text (no truncation needed)
    const shortText = 'Short text';
    expect(truncateText(shortText, 20)).toBe(shortText);
  });
  
  test('delay creates a promise that resolves after specified time', async () => {
    jest.useFakeTimers();
    
    const mockFn = jest.fn();
    const promise = delay(1000).then(mockFn);
    
    // Fast-forward time
    jest.advanceTimersByTime(500);
    await Promise.resolve(); // Let promises resolve
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(500);
    await Promise.resolve(); // Let promises resolve
    expect(mockFn).toHaveBeenCalled();
    
    jest.useRealTimers();
  });
  
  test('getInitials extracts initials from name', () => {
    // Two-part name
    expect(getInitials('John Doe')).toBe('JD');
    
    // Three-part name
    expect(getInitials('John Middle Doe')).toBe('JM');
    
    // One-part name
    expect(getInitials('John')).toBe('J');
    
    // Empty string
    expect(getInitials('')).toBe('');
    
    // Undefined
    expect(getInitials(undefined as unknown as string)).toBe('');
  });
});