import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GlobalDrawerProvider } from '@/context/GlobalDrawerContext';
import { GlobalDrawer } from '@/components/GlobalDrawer';
import AuthProvider from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/context/LanguageContext';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const isDark = theme === 'dark' || 
                    (theme === 'system' && 
                     window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    // Critical: Set background immediately
                    document.documentElement.style.backgroundColor = 'hsl(0 0% 10%)';
                  } else {
                    document.documentElement.style.backgroundColor = 'hsl(0 0% 100%)';
                  }
                } catch (e) {
                  // Silently fail - no console logs in inline scripts
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cn('min-h-screen overflow-hidden bg-background font-sans antialiased', inter.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              <GlobalDrawerProvider>
                {children}
                <GlobalDrawer />
                <Toaster />
              </GlobalDrawerProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
