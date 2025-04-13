'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {useState} from 'react';

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
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
        {isLoggedIn && (
          <Link href="/account" className="hover:underline">
            Account
          </Link>
        )}
        {!isLoggedIn && (
          <Button onClick={handleLogin} variant="outline">
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}

