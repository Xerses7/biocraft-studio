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