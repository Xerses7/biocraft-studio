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
    setIsLoading(true);
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully."
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to log out. Please try again."
      });
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