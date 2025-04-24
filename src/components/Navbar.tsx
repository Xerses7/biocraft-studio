'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/context/AuthContext'; // Usa il nostro contesto di autenticazione

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-secondary p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        BioCraft Studio
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {isAuthenticated && (
          <>
            <Link href="/account" className="hover:underline">
              Account
            </Link>
            <Button onClick={logout} variant="outline">
              Log Out
            </Button>
          </>
        )}
        {!isAuthenticated && (
          <Button onClick={() => window.location.href = '/?login=true'} variant="outline">
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}