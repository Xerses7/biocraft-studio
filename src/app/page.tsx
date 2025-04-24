'use client';

import { useState, useEffect, useRef } from 'react';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { RecipeImprovement } from '@/components/RecipeImprovement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useRecipe } from '@/context/RecipeContext';
import Link from 'next/link';
import { 
  Beaker as BeakerIcon, 
  Save as SaveIcon, 
  Sparkles as SparklesIcon, 
  Share2 as Share2Icon,
  ArrowLeft as ArrowLeftIcon,
  Loader2 as Loader2Icon
} from 'lucide-react';

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

// Componenti per l'autenticazione sociale

type IconProps = {
  className?: string;
}
const GoogleIcon = ({ className }: IconProps) => {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M12 22q-2.05 0-3.875-.788t-3.188-2.15-2.137-3.175T2 12q0-2.075.788-3.887t2.15-3.175 3.175-2.138T12 2q2.075 0 3.888.8t3.175 2.15 2.138 3.175T22 12q0 2.05-.788 3.875t-2.15 3.188-3.175 2.138T12 22Zm0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20Zm-1-3h2v-4h4v-2h-4V7h-2v4H7v2h4v4Z" />
    </svg>
  );
};

const GithubIcon = ({ className }: IconProps) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
  </svg>
);

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
  const [showPublicApp, setShowPublicApp] = useState(false); // Control visibility of the app for non-logged in users

  // controllo della sessione all'avvio
  useEffect(() => {
    // Verifica se esiste un token di autenticazione all'avvio
    const checkExistingAuth = async () => {
      const storedAuth = localStorage.getItem('biocraft_auth');
      
      if (!storedAuth) return;
      
      try {
        const parsedAuth = JSON.parse(storedAuth);
        
        // Verifica se il token è scaduto (se esiste un timestamp)
        if (parsedAuth.timestamp) {
          const now = Date.now();
          const tokenAge = now - parsedAuth.timestamp;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 giorni in millisecondi
          
          if (tokenAge > maxAge) {
            // Token troppo vecchio, eliminiamo
            localStorage.removeItem('biocraft_auth');
            return;
          }
        }
        
        // Se abbiamo un backend URL, verifichiamo il token
        if (BACKEND_URL) {
          try {
            // Se hai un endpoint per verificare il token, usalo qui
            // const response = await fetch(`${BACKEND_URL}/verify-token`, {
            //   headers: { Authorization: `Bearer ${parsedAuth.token}` }
            // });
            
            // Se non hai un endpoint specifico, simula una sessione valida
            // In produzione, dovresti sempre verificare con il backend
            setSession({
              access_token: 'mock-token',
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Date.now() + 3600000,
              refresh_token: 'mock-refresh-token',
              user: {
                id: 'user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: parsedAuth.email || 'user@example.com',
              },
            });
            
            // In un ambiente di produzione, carica le informazioni utente dal backend
          } catch (error) {
            console.error('Failed to verify token:', error);
            localStorage.removeItem('biocraft_auth');
          }
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('biocraft_auth');
      }
    };
    
    checkExistingAuth();
  }, []);

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

  // Funzione migliorata per validare la password
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (!password) {
      return { valid: false, message: "Password is required" };
    }
    
    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters long" };
    }
    
    // Opzionale: aggiungi ulteriori regole di sicurezza
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return { 
        valid: false, 
        message: "Password must include at least one uppercase letter, one lowercase letter, and one number" 
      };
    }
    
    return { valid: true, message: "" };
  };

  // --- Authentication Handlers ---
  const handleAuthAction = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    
    // Validazione input lato client
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      setIsLoading(false);
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordValidation.message,
      });
      setIsLoading(false);
      return;
    }

    const endpoint = isLoginView ? '/login' : '/signup';
    const url = `${BACKEND_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Importante per i cookie di sessione
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isLoginView ? 'login' : 'sign up'}`);
      }

      if (isLoginView) {
        setSession(data.session); // Store the session object from backend
        localStorage.setItem('biocraft_auth', JSON.stringify({
          timestamp: Date.now(),
          email: email,
        }));
        
        toast({ 
          title: "Welcome back!", 
          description: "You've successfully signed in",
        });
        
        setEmail('');
        setPassword('');
      } else {
        toast({ 
          title: "Signup Successful!", 
          description: "Please check your email to confirm your account and then log in." 
        });
        setIsLoginView(true); // Switch to login view after signup
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

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    
    try {
      const url = `${BACKEND_URL}/auth/${provider}`;
      
      // Simuliamo un login sociale per ora
      setTimeout(() => {
        setSession({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: `user@${provider}.com`,
          },
        });
        
        toast({ 
          title: "Social sign in successful", 
          description: `You've signed in with ${provider}`,
        });
        
        setIsLoading(false);
      }, 1500);
      
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast({
        variant: "destructive",
        title: `${provider} sign in failed`,
        description: error.message || "An unexpected error occurred",
      });
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Ideally, call a backend /logout endpoint if you implement one
    // await fetch(`${BACKEND_URL}/logout`, { method: 'POST', /* headers if needed */ });
    setSession(null); // Clear session state on frontend
    setCurrentRecipe(null); // Also clear current recipe context
    setShowPublicApp(false); // Hide the app view
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

  // Render the application interface (used for both logged in users and public view)
  const renderAppInterface = (showPastRecipes = false) => {
    return (
      <div className="container mx-auto p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">BioCraft Studio</h1>
          <div>
            {session ? (
              <>
                <span className="mr-4 text-sm text-muted-foreground">
                  {`Welcome, ${session.user.email}!`}
                </span>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <span className="mr-4 text-sm text-muted-foreground">You're using the demo version</span>
                <Button variant="outline" onClick={() => {
                  setShowPublicApp(false);
                  setShowLogin(true);
                }}>Login</Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="generate" id="recipe-tabs">
          <TabsList className="mb-4">
            <TabsTrigger value="generate">Recipe Generation</TabsTrigger>
            <TabsTrigger value="improve">Recipe Improvement</TabsTrigger>
            {showPastRecipes && <TabsTrigger value="past">Past Recipes</TabsTrigger>}
          </TabsList>
          <TabsContent value="generate">
            <RecipeGenerator />
          </TabsContent>
          <TabsContent value="improve">
            <RecipeImprovement />
          </TabsContent>
          {showPastRecipes && (
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  // --- Render Logic ---

  // Public application view (no login required)
  if (showPublicApp) {
    return renderAppInterface(false); // Don't show Past Recipes tab for public view
  }

  // Landing Page
  if (!session && !showLogin) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero section */}
        <div className="flex-grow flex flex-col md:flex-row items-center justify-center px-6 py-12">
          {/* Left content */}
          <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-primary">
              BioCraft Studio
            </h1>
            <p className="text-xl mb-6 text-gray-600 dark:text-gray-300 max-w-xl">
              Transform your biotech experiments with powerful AI-driven recipe generation and optimization.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setShowLogin(true)} 
                className="text-base px-6 py-5"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                className="text-base px-6 py-5"
                onClick={() => setShowPublicApp(true)}
              >
                Try Demo
              </Button>
            </div>
            <div className="mt-6 flex items-center">
              <div className="flex -space-x-2">
                {/* Sample user avatars - replace with actual images in production */}
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs">JD</div>
                <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center text-xs">SR</div>
                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs">MT</div>
              </div>
              <p className="ml-3 text-sm text-muted-foreground">
                Joined by 2,000+ researchers and biotech professionals
              </p>
            </div>
          </div>
          
          {/* Right content - feature highlights */}
          <div className="md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BeakerIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1">AI-Powered Recipes</h3>
              <p className="text-sm text-muted-foreground">
                Generate detailed biotech protocols tailored to your specific research needs
              </p>
            </div>
            
            <div className="p-5 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Recipe Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Enhance existing protocols with targeted improvements for better results
              </p>
            </div>
            
            <div className="p-5 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <SaveIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Recipe Management</h3>
              <p className="text-sm text-muted-foreground">
                Save, organize, and reuse your protocols in a secure personal library
              </p>
            </div>
            
            <div className="p-5 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Share2Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Share your protocols with team members and collaborators
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer with logos */}
        <div className="py-8 px-6 border-t">
          <div className="container mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Trusted by leading biotech institutions and research labs
            </p>
            <div className="flex justify-center items-center flex-wrap gap-8 opacity-70">
              {/* Replace with actual logos */}
              <div className="font-bold text-xl">BioGen</div>
              <div className="font-bold text-xl">GeneWorks</div>
              <div className="font-bold text-xl">SynthLab</div>
              <div className="font-bold text-xl">MolecuTech</div>
              <div className="font-bold text-xl">BioSynth</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup Form
  if (!session && showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Button 
          onClick={() => setShowLogin(false)}
          variant="ghost"
          className="absolute top-4 left-4 flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to home
        </Button>

        <div className="w-full max-w-md">
          <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-md rounded-lg border">
            <div className="flex justify-center mb-2">
              <BeakerIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">BioCraft Studio</h1>
            <h2 className="text-xl text-center text-muted-foreground">
              {isLoginView ? 'Sign in to your account' : 'Create a new account'}
            </h2>

            {/* Email/Password Form */}
            <form onSubmit={handleAuthAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLoginView && (
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Forgot password?
                    </Button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {isLoginView ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLoginView ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full" 
                type="button" 
                disabled={isLoading}
                onClick={() => handleSocialLogin('github')}
              >
                <GithubIcon className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button" 
                disabled={isLoading}
                onClick={() => handleSocialLogin('google')}
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            <Button
              variant="link"
              className="w-full"
              onClick={() => setIsLoginView(!isLoginView)}
              disabled={isLoading}
            >
              {isLoginView
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main App (logged in)
  return renderAppInterface(true); // Show Past Recipes tab for logged-in users
}