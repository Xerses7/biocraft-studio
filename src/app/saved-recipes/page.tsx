'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRecipe } from '@/context/RecipeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Trash, 
  Info, 
  Search, 
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SavedRecipesPage() {
  const router = useRouter();
  const { currentRecipe, setCurrentRecipe, savedRecipes, setSavedRecipes } = useRecipe();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState(savedRecipes);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/?login=true');
    }
  }, [authLoading, isAuthenticated, router]);

  // Filter recipes when search term or savedRecipes change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecipes(savedRecipes);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = savedRecipes.filter(recipe => {
      // Convert recipe to string if it's not already
      const recipeData = typeof recipe === 'string' ? JSON.parse(recipe) : recipe;
      
      // Check recipe name
      if (recipeData.recipeName && recipeData.recipeName.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Check description
      if (recipeData.description && recipeData.description.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Check materials
      if (recipeData.Materials && recipeData.Materials.length) {
        const hasMaterial = recipeData.Materials.some(
          (material: any) => material.name && material.name.toLowerCase().includes(searchLower)
        );
        if (hasMaterial) return true;
      }
      
      return false;
    });
    
    setFilteredRecipes(filtered);
  }, [searchTerm, savedRecipes]);

  // View a recipe
  const handleViewRecipe = (recipe: any) => {
    setCurrentRecipe(JSON.stringify(recipe));
    router.push('/recipe');
  };

  // Delete a recipe
  const handleDeleteRecipe = (recipe: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click from triggering

    const confirmDelete = window.confirm('Are you sure you want to delete this recipe?');
    if (!confirmDelete) return;

    const updatedRecipes = savedRecipes.filter(r => {
      // Convert both to strings for proper comparison
      return JSON.stringify(r) !== JSON.stringify(recipe);
    });
    
    setSavedRecipes(updatedRecipes);
    
    toast({
      title: "Recipe Deleted",
      description: "The recipe has been removed from your saved recipes.",
    });
  };

  // If still loading authentication status
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading saved recipes...</p>
      </div>
    );
  }

  // If not authenticated, useEffect will redirect
  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/')}
          className="mb-4 hover:bg-secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold mt-2">Saved Recipes</h1>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button 
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recipes List */}
      {filteredRecipes.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Recipe Name</TableHead>
                <TableHead className="w-[20%]">Author</TableHead>
                <TableHead className="w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe, index) => {
                // Ensure recipe is an object
                const recipeData = typeof recipe === 'string' ? JSON.parse(recipe) : recipe;
                return (
                  <TableRow 
                    key={index} 
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => handleViewRecipe(recipeData)}
                  >
                    <TableCell className="font-medium">
                      {recipeData.recipeName || 'Unnamed Recipe'}
                    </TableCell>
                    <TableCell>{recipeData.author || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteRecipe(recipeData, e)}
                        title="Delete Recipe"
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            {searchTerm ? (
              <>
                <CardTitle className="text-xl mb-2">No matching recipes</CardTitle>
                <CardDescription className="text-center max-w-md">
                  No recipes match your search term. Try using different keywords or clear the search.
                </CardDescription>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <CardTitle className="text-xl mb-2">No saved recipes</CardTitle>
                <CardDescription className="text-center max-w-md">
                  You haven't saved any recipes yet. Go to the home page to generate new recipes, then save them for future reference.
                </CardDescription>
                <Button 
                  onClick={() => router.push('/')} 
                  className="mt-4"
                >
                  Create a Recipe
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}