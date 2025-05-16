import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useRecipe } from '@/context/RecipeContext';
import { generateBiotechRecipe } from '@/ai/flows/generate-biotech-recipe';

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

jest.mock('@/ai/flows/generate-biotech-recipe', () => ({
  generateBiotechRecipe: jest.fn(),
}));

describe('RecipeGenerator Component', () => {
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
    render(<RecipeGenerator />);
    
    // Check for labels and textareas
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desired outcome/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /generate recipe/i })).toBeInTheDocument();
    
    // Both textareas should be empty initially
    const ingredientsTextarea = screen.getByLabelText(/ingredients/i) as HTMLTextAreaElement;
    const outcomeTextarea = screen.getByLabelText(/desired outcome/i) as HTMLTextAreaElement;
    
    expect(ingredientsTextarea.value).toBe('');
    expect(outcomeTextarea.value).toBe('');
  });
  
  test('handles input changes', () => {
    render(<RecipeGenerator />);
    
    // Get textareas
    const ingredientsTextarea = screen.getByLabelText(/ingredients/i) as HTMLTextAreaElement;
    const outcomeTextarea = screen.getByLabelText(/desired outcome/i) as HTMLTextAreaElement;
    
    // Simulate user input
    fireEvent.change(ingredientsTextarea, { target: { value: 'Enzyme A, Protein B, Buffer C' } });
    fireEvent.change(outcomeTextarea, { target: { value: 'Enhanced protein stability' } });
    
    // Check if inputs were updated
    expect(ingredientsTextarea.value).toBe('Enzyme A, Protein B, Buffer C');
    expect(outcomeTextarea.value).toBe('Enhanced protein stability');
  });
  
  test('shows validation error when fields are empty', () => {
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeGenerator />);
    
    // Try to submit with empty inputs
    const generateButton = screen.getByRole('button', { name: /generate recipe/i });
    fireEvent.click(generateButton);
    
    // Should show validation toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Missing Information'
      })
    );
    
    // The generateBiotechRecipe function should not be called
    expect(generateBiotechRecipe).not.toHaveBeenCalled();
  });
  
  test('handles successful recipe generation', async () => {
    // Setup mocks for successful generation
    const mockRecipeString = JSON.stringify({
      recipeName: 'Test Recipe',
      description: 'A test recipe'
    });
    
    const mockRecipeResponse = {
      recipe: mockRecipeString
    };
    
    (generateBiotechRecipe as jest.Mock).mockResolvedValue(mockRecipeResponse);
    
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeGenerator />);
    
    // Fill inputs
    const ingredientsTextarea = screen.getByLabelText(/ingredients/i);
    const outcomeTextarea = screen.getByLabelText(/desired outcome/i);
    
    fireEvent.change(ingredientsTextarea, { target: { value: 'Enzyme A, Protein B' } });
    fireEvent.change(outcomeTextarea, { target: { value: 'Enhanced protein stability' } });
    
    // Submit form
    const generateButton = screen.getByRole('button', { name: /generate recipe/i });
    fireEvent.click(generateButton);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check if API was called with correct args
    expect(generateBiotechRecipe).toHaveBeenCalledWith({
      ingredients: 'Enzyme A, Protein B',
      desiredOutcome: 'Enhanced protein stability'
    });
    
    // Should set current recipe
    expect(mockSetCurrentRecipe).toHaveBeenCalledWith(mockRecipeString);
    
    // Should navigate to recipe page
    expect(mockRouter.push).toHaveBeenCalledWith('/recipe');
    
    // Should show success toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recipe Generated',
        description: 'Your recipe has been successfully generated.'
      })
    );
  });
  
  test('handles API errors during generation', async () => {
    // Setup mock for API error
    const errorMessage = 'API error occurred';
    (generateBiotechRecipe as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Mock toast function
    const mockToastFn = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToastFn });
    
    render(<RecipeGenerator />);
    
    // Fill inputs
    const ingredientsTextarea = screen.getByLabelText(/ingredients/i);
    const outcomeTextarea = screen.getByLabelText(/desired outcome/i);
    
    fireEvent.change(ingredientsTextarea, { target: { value: 'Invalid input' } });
    fireEvent.change(outcomeTextarea, { target: { value: 'Test outcome' } });
    
    // Submit form
    const generateButton = screen.getByRole('button', { name: /generate recipe/i });
    fireEvent.click(generateButton);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Should show error toast
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Error Generating Recipe',
        description: errorMessage
      })
    );
    
    // Should not navigate or set recipe
    expect(mockSetCurrentRecipe).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  test('displays loading state during API call', () => {
    // Setup mock that doesn't resolve immediately
    (generateBiotechRecipe as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        // This promise won't resolve during the test
        setTimeout(() => {
          resolve({ recipe: '{}' });
        }, 1000);
      });
    });
    
    render(<RecipeGenerator />);
    
    // Fill inputs
    const ingredientsTextarea = screen.getByLabelText(/ingredients/i);
    const outcomeTextarea = screen.getByLabelText(/desired outcome/i);
    
    fireEvent.change(ingredientsTextarea, { target: { value: 'Test ingredients' } });
    fireEvent.change(outcomeTextarea, { target: { value: 'Test outcome' } });
    
    // Submit form
    const generateButton = screen.getByRole('button', { name: /generate recipe/i });
    fireEvent.click(generateButton);
    
    // Button should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });
});