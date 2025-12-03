// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);

        // TODO: Send to error monitoring service (e.g., Sentry)
        // if (process.env.NODE_ENV === 'production') {
        //   Sentry.captureException(error);
        // }
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-6">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        යමක් වැරදී ඇත
                    </h1>
                    <p className="text-muted-foreground">
                        Something went wrong
                    </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-mono text-left break-all">
                        {error.message || 'An unexpected error occurred'}
                    </p>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        variant="default"
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        නැවත උත්සාහ කරන්න / Try Again
                    </Button>

                    <Button
                        onClick={() => window.location.href = '/'}
                        variant="outline"
                        className="gap-2"
                    >
                        <Home className="h-4 w-4" />
                        මුල් පිටුවට / Go Home
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                    <p>
                        If this problem persists, please contact support.
                    </p>
                    <p className="mt-1">
                        ගැටලුව දිගටම පවතී නම්, කරුණාකර සහාය අමතන්න.
                    </p>
                </div>
            </div>
        </div>
    );
}
