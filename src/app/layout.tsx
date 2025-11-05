import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GlobalDrawerProvider } from '@/context/GlobalDrawerContext';
import { GlobalDrawer } from '@/components/GlobalDrawer';
import AuthProvider from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

// This forces the entire app to be dynamically rendered, which can help
// with strange caching and fetch errors in certain environments.
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Tailwind Starter',
  description: 'A simple Next.js app with Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
            <GlobalDrawerProvider>
                {children}
                <GlobalDrawer />
                <Toaster />
            </GlobalDrawerProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
