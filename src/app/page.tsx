'use client';

import { useState, useEffect, useRef } from 'react';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { RecipeForm } from '@/components/RecipeForm';
import { RecipeImprovement } from '@/components/RecipeImprovement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
import { Label } from '@/components/ui/label'; // Import Label
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast"
import { useRecipe } from '@/context/RecipeContext';
import Link from 'next/link';

// Define a type for the session data structure based on your backend response
interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    // Add other user properties if needed
  };
}


// --- !!! IMPORTANT: Replace with your actual backend URL !!! ---
// Use an environment variable in a real app: process.env.NEXT_PUBLIC_BACKEND_URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // e.g., "https://your-forwarded-url.firebase.studio" or "http://localhost:3001"
// ---

export default function Home() {
  const router = useRouter();
  const { setCurrentRecipe, savedRecipes, setSavedRecipes } = useRecipe();
  const { toast } = useToast();

  // --- Authentication State ---
  const [session, setSession] = useState<AuthSession | null>(null); // Store user session
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For loading indicators
  const [isLoginView, setIsLoginView] = useState(true); // Toggle between Login/Signup
  const [showLogin, setShowLogin] = useState(false); // Toggle for showing login form

  // --- Check for existing session on mount (optional but good UX) ---
  // This requires your backend to potentially store session info (e.g., in a cookie)
  // or for the frontend to store the token and validate it.
  // For simplicity, we'll assume the user needs to log in each time for now.
  // A more robust solution would involve checking localStorage/cookies
  // and potentially calling the backend's /user endpoint if a token exists.

  // --- Recipe Loading/Saving Logic (Conditional on Login) ---
  useEffect(() => {
    // Only load recipes if the user is logged in
    if (session) {
      const storedRecipes = localStorage.getItem('savedRecipes');
      if (storedRecipes) {
        try {
          const parsedRecipes = JSON.parse(storedRecipes);
          setSavedRecipes(Array.isArray(parsedRecipes) ? parsedRecipes : []);
        } catch (error) {
          console.error("Failed to parse saved recipes:", error);
          localStorage.removeItem('savedRecipes');
          setSavedRecipes([]);
        }
      } else {
        setSavedRecipes([]);
      }
    } else {
      // Clear recipes if user logs out
      setSavedRecipes([]);
      localStorage.removeItem('savedRecipes');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // Rerun when session changes

  useEffect(() => {
    // Only save recipes if the user is logged in and there are recipes
    if (session && savedRecipes.length > 0) {
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    } else if (session && savedRecipes.length === 0) {
       // If logged in and array becomes empty, clear storage
       if(localStorage.getItem('savedRecipes')) {
           localStorage.removeItem('savedRecipes');
       }
    }
    // Don't save if not logged in
  }, [savedRecipes, session]); // Watch context recipes AND session

  // --- Authentication Handlers ---
  const handleAuthAction = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    const endpoint = isLoginView ? '/login' : '/signup';
    const url = `${BACKEND_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use error message from backend if available
        throw new Error(data.message || `Failed to ${isLoginView ? 'login' : 'sign up'}`);
      }

      if (isLoginView) {
        setSession(data.session); // Store the session object from backend
        toast({ title: "Login Successful!", description: "Welcome back!" });
        // Clear fields after successful login/signup
        setEmail('');
        setPassword('');
      } else {
         toast({ title: "Signup Successful!", description: "Please check your email to confirm your account and then log in." });
         setIsLoginView(true); // Switch to login view after signup
         // Clear fields after successful login/signup
         setEmail('');
         setPassword('');
      }

    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: `Authentication Failed`,
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
      // Ideally, call a backend /logout endpoint if you implement one
      // await fetch(`${BACKEND_URL}/logout`, { method: 'POST', /* headers if needed */ });
      setSession(null); // Clear session state on frontend
      setCurrentRecipe(null); // Also clear current recipe context
      toast({ title: "Logged Out", description: "You have been logged out successfully." });
      // Optionally clear email/password fields if needed
      // setEmail('');
      // setPassword('');
  };

  // --- Recipe Handling ---
  const handleRowClick = (recipeData: any) => {
    if (!session) return; // Prevent action if not logged in
    setCurrentRecipe(JSON.stringify(recipeData));
    router.push(`/recipe`);
  };

  const renderRecipe = (recipe: any, index: number) => {
    let recipeName = recipe?.recipeName || 'Unnamed Recipe';
    return (
      <TableRow key={index} onClick={() => handleRowClick(recipe)} className="cursor-pointer hover:bg-secondary">
        <TableCell>
          {recipeName}
        </TableCell>
      </TableRow>
    );
  };

  // --- Render Logic ---

  // 1. Render Landing Page if not logged in
  if (!session && !showLogin) {
     return (
         <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-6xl font-bold text-center mb-8">BioCraft Studio</h1>
            <p className="text-lg text-center mb-8">
              Unlock the power of biotechnology with our AI-driven recipe generator and improvement tool.
            </p>
            <div className="flex space-x-4">
                <Button onClick={() => setShowLogin(true)} variant="outline">Login</Button>
                <Link href="/recipe" passHref legacyBehavior>
                    <Button variant="outline" >
                      Generate/Improve a Recipe
                    </Button>
                </Link>

            </div>
         </div>
     )
  }


  // 2. Render Auth Forms if not logged in and showLogin is true
  if (!session && showLogin) {
      return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen relative">
        <Button onClick={() => setShowLogin(false)} className="absolute top-4 left-4" variant="outline">Back</Button>
        <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-md rounded-lg border">
           <div className='flex justify-center'>
                <h1 className="text-2xl font-bold text-center">BioCraft Studio</h1>
           </div>
           <h2 className="text-xl font-semibold text-center mb-6">
            {isLoginView ? 'Login' : 'Sign Up'}
           </h2>
           <form onSubmit={handleAuthAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                 className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
            </Button>
          </form>
          <div className="text-center mt-4">
            <Button
              variant="link"
              onClick={() => setIsLoginView(!isLoginView)}
              disabled={isLoading}
            >
              {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </Button>
          </div>
        </div>
      </div>
    );
   }

  // 3. Render Main App if logged in
  return (
    <div className="container mx-auto p-4 relative">
       <div className="flex justify-between items-center mb-4">
         <h1 className="text-2xl font-bold">BioCraft Studio</h1>
         <div>
            <span className="mr-4 text-sm text-muted-foreground">Welcome, {session.user.email}!</span>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
         </div>
       </div>

      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Recipe Generation</TabsTrigger>
          <TabsTrigger value="improve">Recipe Improvement</TabsTrigger>
          {session && <TabsTrigger value="past">Past Recipes</TabsTrigger>}
        </TabsList>
        <TabsContent value="generate">
          <RecipeForm />
        </TabsContent>
        <TabsContent value="improve">
          <RecipeImprovement />
        </TabsContent>
         {session && (
            <TabsContent value="past">
              <div>
                <h2 className="text-xl font-semibold mb-2">Past Recipes</h2>
                {savedRecipes && savedRecipes.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Recipe Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{savedRecipes.map(renderRecipe)}</TableBody>
                    </Table>
                  </div>
                ) : (<p>No recipes saved yet.</p>)}
              </div>
            </TabsContent>)}
      </Tabs>
    </div>
  );
}