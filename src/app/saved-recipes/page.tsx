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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Filter,
  ExternalLink,
  Download,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate } from '@/lib/utils';

export default function SavedRecipesPage() {
  const router = useRouter();
  const { currentRecipe, setCurrentRecipe, savedRecipes, loadRecipesFromDb, deleteRecipeFromDb } = useRecipe();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState(savedRecipes);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [sortField, setSortField] = useState<string>('dateCreated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<any>(null);
  const [isRecipeDetailsOpen, setIsRecipeDetailsOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/?login=true');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load recipes on initial render
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      loadRecipesFromDb()
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, loadRecipesFromDb]);

  // Filter and sort recipes when search term, sort options, or savedRecipes change
  useEffect(() => {
    // First filter the recipes
    let filtered = [...savedRecipes];
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = savedRecipes.filter(recipe => {
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
    }
    
    // Then sort the filtered recipes
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      // For dates, we need special handling
      if (sortField === 'dateCreated') {
        const aDate = aValue ? new Date(aValue).getTime() : 0;
        const bDate = bValue ? new Date(bValue).getTime() : 0;
        
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // For strings, we do a localeCompare
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Default case
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (bValue > aValue ? 1 : -1);
    });
    
    setFilteredRecipes(filtered);
  }, [searchTerm, savedRecipes, sortField, sortDirection]);

  // View a recipe
  const handleViewRecipe = (recipe: any) => {
    setCurrentRecipe(JSON.stringify(recipe));
    router.push('/recipe');
  };

  // Delete a recipe
  const handleDeleteRecipe = async (recipe: any) => {
    setIsDeleting(true);
    
    try {
      // Call the context function to delete from database
      const success = await deleteRecipeFromDb(recipe.id);
      
      if (success) {
        toast({
          title: "Recipe Deleted",
          description: "The recipe has been removed from your saved recipes.",
        });
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "There was a problem deleting the recipe. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Confirm delete recipe
  const confirmDeleteRecipe = (recipe: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click from triggering
    setRecipeToDelete(recipe);
    setShowDeleteDialog(true);
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Show recipe details
  const showRecipeDetails = (recipe: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click from triggering
    setSelectedRecipe(recipe);
    setIsRecipeDetailsOpen(true);
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
            placeholder="Search recipes by name, description, or materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button 
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recipes List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your recipes...</p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('recipeName')}
                >
                  <div className="flex items-center">
                    Recipe Name
                    {getSortIcon('recipeName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hidden md:table-cell"
                  onClick={() => handleSort('author')}
                >
                  <div className="flex items-center">
                    Author
                    {getSortIcon('author')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hidden md:table-cell"
                  onClick={() => handleSort('dateCreated')}
                >
                  <div className="flex items-center">
                    Created
                    {getSortIcon('dateCreated')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe, index) => {
                return (
                  <TableRow 
                    key={index} 
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => handleViewRecipe(recipe)}
                  >
                    <TableCell className="font-medium">
                      {recipe.recipeName || 'Unnamed Recipe'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {recipe.author || 'Unknown'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {recipe.dateCreated ? formatDate(recipe.dateCreated) : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewRecipe(recipe);
                          }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Recipe
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => showRecipeDetails(recipe, e)}>
                            <Info className="h-4 w-4 mr-2" />
                            Recipe Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => confirmDeleteRecipe(recipe, e)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Recipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the recipe "{recipeToDelete?.recipeName || 'Unnamed Recipe'}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteRecipe(recipeToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Recipe'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Details Dialog */}
      <Dialog open={isRecipeDetailsOpen} onOpenChange={setIsRecipeDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecipe?.recipeName || 'Recipe Details'}</DialogTitle>
            <DialogDescription>
              {selectedRecipe?.description || 'No description available.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p>{selectedRecipe.dateCreated ? formatDate(selectedRecipe.dateCreated) : 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Author</h3>
                <p>{selectedRecipe.author || 'Unknown'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Materials</h3>
                {selectedRecipe.Materials && selectedRecipe.Materials.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedRecipe.Materials.map((material: any, index: number) => (
                      <li key={index}>
                        <span className="font-medium">{material.name}</span> - {material.quantity}
                        {material.supplier && <span className="text-sm"> (Supplier: {material.supplier})</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No materials listed.</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Version</h3>
                <p>{selectedRecipe.version || '1.0'}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsRecipeDetailsOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsRecipeDetailsOpen(false);
                handleViewRecipe(selectedRecipe);
              }}
            >
              View Full Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}