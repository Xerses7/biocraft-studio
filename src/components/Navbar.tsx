'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function Navbar() {
  const { session, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    
    try {
      await logout();
      setIsMenuOpen(false); // Close menu after logout
    } catch (error) {
      console.log('Unexpected error during logout:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/?login=true');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-secondary p-4 flex justify-between items-center relative">
      <Link href="/" className="text-xl font-bold z-10">
        BioCraft Studio
      </Link>
      
      {isMobile ? (
        // Mobile view with hamburger menu
        <>
          <button 
            onClick={toggleMenu} 
            className="z-20 text-foreground" 
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Mobile menu overlay */}
          {isMenuOpen && (
            <div className="fixed inset-0 bg-background opacity-50 z-10" onClick={toggleMenu}></div>
          )}
          
          {/* Mobile menu content */}
          <div className={`fixed right-0 top-0 h-full w-64 bg-secondary p-6 shadow-lg transform transition-transform duration-200 ease-in-out z-20 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex justify-end mb-6">
              <button onClick={toggleMenu} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
              <Link href="/" className="hover:underline" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              
              {isAuthenticated && session ? (
                <>
                  <span className="text-sm text-muted-foreground break-words">
                    {`${session.user.email}`}
                  </span>
                  <Link 
                    href="/recipe" 
                    className="hover:underline" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Saved recipes
                  </Link>
                  <Link 
                    href="/account" 
                    className="hover:underline" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Button onClick={handleLogout} variant="outline" disabled={isLoading} className="w-full">
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
                <Button onClick={handleLogin} variant="outline" className="w-full">
                  Login
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        // Desktop view - regular horizontal menu
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
      )}
    </nav>
  );
}