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
