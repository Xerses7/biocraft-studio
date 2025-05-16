import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeImprovement } from '@/components/RecipeImprovement';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRecipe } from '@/context/RecipeContext';
import { improveExistingRecipe } from '@/ai/flows/improve-existing-recipe';

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

jest.mock('@/ai/flows/improve-existing-recipe', () => ({
  improveExistingRecipe: jest.fn(),
}));

describe('RecipeImprovement Component', () => {
  // Setup default mocks
  const mockRouter = { push: jest.fn() };
  const mockToast = { toast: jest.fn() };
  const mockSetCurrentRecipe = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useRecipe as jest.Mock).mockReturnValue({
      setCurrentRecipe: mockSetCurrentRecipe,
    });
  });
  
  test('renders with empty inputs initially', () => {
    render(<RecipeImprovement />);
    
    // Check for labels and textareas
    expect(screen.getByLabelText(/existing recipe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desired outcomes/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /improve recipe/i })).toBeInTheDocument();
    
    // Both textareas should be empty initially
    const existingRecipeTextarea = screen.getByLabelText(/existing recipe/i) as HTMLTextAreaElement;
    const desiredOutcomesTextarea = screen.getByLabelText(/desired outcomes/i) as HTMLTextAreaElement;
    
    expect(existingRecipeTextarea.value).toBe('');
    expect(desiredOutcomesTextarea.value).toBe('');
  });
  
  test('handles input changes', () => {
    render(<RecipeImprovement />);
    
    // Get textareas
    const existingRecipeTextarea = screen.getByLabelText(/existing recipe/i) as HTMLTextAreaElement;
    const desiredOutcomesTextarea = screen.getByLabelText(/desired outcomes/i) as HTMLTextAreaElement;
    
    // Simulate user input
    const sampleRecipe = '{"recipeName":"Test Recipe","Materials":[{"name":"Test Material"}]}';
    fireEvent.change(existingRecipeTextarea, { target: { value: sampleRecipe } });
    fireEvent.change(desiredOutcomesTextarea, { target: { value: 'Increase efficiency' } });
    
    // Check if inputs were updated
    expect(existingRecipeTextarea.value).toBe(sampleRecipe);
    expect(desiredOutcomesTextarea.value).toBe('Increase efficiency');
  });
  
  test('shows validation error when fields are empty', () => {
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeImprovement />);
    
    // Try to submit with empty inputs
    const improveButton = screen.getByRole('button', { name: /improve recipe/i });
    fireEvent.click(improveButton);
    
    // Should show validation toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Missing Information'
      })
    );
    
    // The improveExistingRecipe function should not be called
    expect(improveExistingRecipe).not.toHaveBeenCalled();
  });
  
  test('handles successful recipe improvement', async () => {
    // Setup mocks for successful improvement
    const sampleRecipe = {
      recipeName: 'Improved Recipe',
      description: 'An improved recipe'
    };
    
    const mockRecipeResponse = {
      improvedRecipe: JSON.stringify(sampleRecipe),
      explanation: 'Improvements were made to increase efficiency'
    };
    
    (improveExistingRecipe as jest.Mock).mockResolvedValue(mockRecipeResponse);
    
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeImprovement />);
    
    // Fill inputs
    const existingRecipeTextarea = screen.getByLabelText(/existing recipe/i);
    const desiredOutcomesTextarea = screen.getByLabelText(/desired outcomes/i);
    
    const originalRecipe = '{"recipeName":"Original Recipe","Materials":[{"name":"Material A"}]}';
    
    fireEvent.change(existingRecipeTextarea, { target: { value: originalRecipe } });
    fireEvent.change(desiredOutcomesTextarea, { target: { value: 'Increase efficiency' } });
    
    // Submit form
    const improveButton = screen.getByRole('button', { name: /improve recipe/i });
    fireEvent.click(improveButton);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check if API was called with correct args
    expect(improveExistingRecipe).toHaveBeenCalledWith({
      existingRecipe: originalRecipe,
      desiredOutcomes: 'Increase efficiency'
    });
    
    // Should set current recipe
    expect(mockSetCurrentRecipe).toHaveBeenCalledWith(JSON.stringify(sampleRecipe));
    
    // Should navigate to recipe page
    expect(mockRouter.push).toHaveBeenCalledWith('/recipe');
    
    // Should show success toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recipe Improved',
        description: 'Your recipe has been successfully improved.'
      })
    );
  });
  
  test('handles API errors during improvement', async () => {
    // Setup mock for API error
    const errorMessage = 'API error occurred';
    (improveExistingRecipe as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeImprovement />);
    
    // Fill inputs
    const existingRecipeTextarea = screen.getByLabelText(/existing recipe/i);
    const desiredOutcomesTextarea = screen.getByLabelText(/desired outcomes/i);
    
    fireEvent.change(existingRecipeTextarea, { target: { value: 'Invalid JSON' } });
    fireEvent.change(desiredOutcomesTextarea, { target: { value: 'Test outcome' } });
    
    // Submit form
    const improveButton = screen.getByRole('button', { name: /improve recipe/i });
    fireEvent.click(improveButton);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should show error toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Error Improving Recipe',
        description: errorMessage
      })
    );
    
    // Should not navigate or set recipe
    expect(mockSetCurrentRecipe).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  test('displays loading state during API call', () => {
    // Setup mock that doesn't resolve immediately
    (improveExistingRecipe as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        // This promise won't resolve during the test
        setTimeout(() => {
          resolve({ improvedRecipe: '{}', explanation: '' });
        }, 1000);
      });
    });
    
    render(<RecipeImprovement />);
    
    // Fill inputs
    const existingRecipeTextarea = screen.getByLabelText(/existing recipe/i);
    const desiredOutcomesTextarea = screen.getByLabelText(/desired outcomes/i);
    
    fireEvent.change(existingRecipeTextarea, { target: { value: '{}' } });
    fireEvent.change(desiredOutcomesTextarea, { target: { value: 'Test' } });
    
    // Submit form
    const improveButton = screen.getByRole('button', { name: /improve recipe/i });
    fireEvent.click(improveButton);
    
    // Button should show loading state
    expect(screen.getByText(/improving/i)).toBeInTheDocument();
    expect(improveButton).toBeDisabled();
  });
});