import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {Navbar} from '@/components/Navbar';
import {RecipeProvider} from '@/context/RecipeContext';
import {AuthProvider} from '@/context/AuthContext'; // Aggiungi questa importazione

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BioCraft Studio',
  description: 'AI-powered biotechnology recipe generator and improvement tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider> {/* Aggiungi questo provider */}
          <RecipeProvider>
            <Navbar />
            {children}
          </RecipeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}