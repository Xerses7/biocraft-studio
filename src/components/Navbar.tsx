'use client';

import { useState, useEffect, useRef, SetStateAction } from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import { AuthSession } from '@/data/AuthSession';
import {useAuth} from '@/context/AuthContext'; // Usa il nostro contesto di autenticazione

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [session, setSession] = useState<AuthSession | null>(null); // Store user session

  return (
    <nav className="bg-secondary p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        BioCraft Studio
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {session && (
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
          <Button onClick={() => window.location.href = '/login'} variant="outline">
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}