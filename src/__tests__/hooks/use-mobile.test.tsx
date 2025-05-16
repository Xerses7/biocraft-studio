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