'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function Navbar() {
  const { session, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    
    try {
      // The logout function in AuthContext now handles errors internally
      // and always completes the logout process locally
      await logout();
      
      // We don't need to show a success toast here since AuthContext already does that
    } catch (error) {
      // This catch block should rarely run since AuthContext handles most errors
      console.log('Unexpected error during logout:', error);
      
      // Ensure the user can still navigate away even if something goes wrong
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/?login=true');
  };

  return (
    <nav className="bg-secondary p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        BioCraft Studio
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {isAuthenticated && session ? (
          <>
            <span className="text-sm text-muted-foreground">
              {`${session.user.email}`}
            </span>
            <Link href="/recipe" className="hover:underline">
              Saved recipes
            </Link>
            <Link href="/account" className="hover:underline">
              Account
            </Link>
            <Button onClick={handleLogout} variant="outline" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Log Out'
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin} variant="outline">
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}