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