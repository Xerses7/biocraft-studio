'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Beaker as BeakerIcon, 
  Save as SaveIcon, 
  Sparkles as SparklesIcon, 
  Share2 as Share2Icon,
  ArrowLeft as ArrowLeftIcon,
  Loader2 as Loader2Icon
} from 'lucide-react';

// Backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Component for social authentication icons
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
  const searchParams = useSearchParams();
  const { setCurrentRecipe, savedRecipes, setSavedRecipes } = useRecipe();
  const { toast } = useToast();

  // Use AuthContext
  const { session, isAuthenticated, isLoading: authLoading, login, signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPublicApp, setShowPublicApp] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Show login form if login=true is in the URL
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowLogin(true);
    }
  }, [searchParams]);

  // Load saved recipes when authenticated
  useEffect(() => {
    if (isAuthenticated && session) {
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
  }, [isAuthenticated, session, setSavedRecipes]);

  // Save recipes to localStorage when they change (if authenticated)
  useEffect(() => {
    if (isAuthenticated && savedRecipes.length > 0) {
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    } else if (isAuthenticated && savedRecipes.length === 0) {
      if(localStorage.getItem('savedRecipes')) {
        localStorage.removeItem('savedRecipes');
      }
    }
  }, [savedRecipes, isAuthenticated]);

  // Improved password validation function
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordValid(false);
      setPasswordMessage("Password is required");
      return false;
    }
    
    if (password.length < 6) {
      setPasswordValid(false);
      setPasswordMessage("Password must be at least 6 characters long");
      return false;
    }
    
    // Check additional security rules
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setPasswordValid(false);
      setPasswordMessage("Password must include at least one uppercase letter, one lowercase letter, and one number");
      return false;
    }
    
    setPasswordValid(true);
    setPasswordMessage("");
    return true;
  };

  // Handle password confirmation
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Check if passwords match and update the state
    setPasswordMatch(password === value);
  };

  // Authentication Handler
  const handleAuthAction = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // For signup, verify passwords match
    if (!isLoginView && !passwordMatch) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
      });
      return;
    }
    
    // Validate password for signup
    if (!isLoginView && !validatePassword(password)) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordMessage,
      });
      return;
    }
    
    setIsLoading(true);
    
    // Client-side input validation
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      setIsLoading(false);
      return;
    }
    
    if (!passwordValid) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordMessage,
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isLoginView) {
        await login(email, password);
        
        toast({ 
          title: "Welcome back!", 
          description: "You've successfully signed in",
        });
        
        setEmail('');
        setPassword('');
        setShowLogin(false); // Hide login form after successful login
      } else {
        await signup(email, password);
        
        toast({ 
          title: "Signup Successful!", 
          description: "Please check your email to confirm your account and then log in." 
        });
        
        setIsLoginView(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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
      await fetch(`${BACKEND_URL}/auth/${provider.toLowerCase()}`);
      // Redirect happens on the server side
      
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

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !resetEmail.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for instructions to reset your password",
      });
      
      setResetEmail('');
      setIsResettingPassword(false);
      setIsLoginView(true);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recipe Handling
  const handleRowClick = (recipeData: any) => {
    if (!isAuthenticated) return; // Prevent action if not logged in
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

  // Render the application interface
  const renderAppInterface = (showPastRecipes = false) => {
    return (
      <div className="container mx-auto p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">BioCraft Studio</h1>
          <div>
            {!isAuthenticated && (
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

  // If logged in or in demo mode, show the app interface
  if (isAuthenticated || showPublicApp) {
    return renderAppInterface(isAuthenticated); // Only show Past Recipes tab if authenticated
  }

  // Login/Signup Form or Password Reset
  if (showLogin) {
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
            
            {isResettingPassword ? (
              <>
                <h2 className="text-xl text-center text-muted-foreground">
                  Reset your password
                </h2>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset_email">Email</Label>
                    <Input
                      id="reset_email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      'Send Password Reset Link'
                    )}
                  </Button>
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setIsLoginView(true);
                    }}
                    disabled={isLoading}
                  >
                    Back to login
                  </Button>
                </form>
              </>
            ) : (
              <>
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
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs"
                          onClick={() => setIsResettingPassword(true)}
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (!isLoginView) {
                          validatePassword(e.target.value);
                          setPasswordMatch(e.target.value === confirmPassword);
                        }
                      }}
                      required
                      disabled={isLoading}
                      className={!passwordValid && !isLoginView ? "border-red-500" : ""}
                    />
                    {!passwordValid && !isLoginView && (
                      <p className="text-sm text-red-500">{passwordMessage}</p>
                    )}
                  </div>
                  {!isLoginView && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password_confirm">Confirm Password</Label>
                      </div>
                      <Input
                        id="password_confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        required
                        disabled={isLoading}
                        className={!passwordMatch ? "border-red-500" : ""}
                      />
                      {!passwordMatch && (
                        <p className="text-sm text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={
                      isLoading || 
                      (!isLoginView && (!passwordValid || !passwordMatch || !confirmPassword))
                    }
                  >
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
                  onClick={() => {
                    setIsLoginView(!isLoginView);
                    // Reset validation states when switching views
                    setPasswordValid(true);
                    setPasswordMatch(true);
                    setPasswordMessage('');
                    setConfirmPassword('');
                  }}
                  disabled={isLoading}
                >
                  {isLoginView
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Landing Page
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