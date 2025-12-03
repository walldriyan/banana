// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthStatus {
    status: 'ok' | 'error';
    timestamp: string;
    database: 'connected' | 'disconnected';
    uptime: number;
    version: string;
    environment: string;
}

export async function GET() {
    const startTime = Date.now();

    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        const healthStatus: HealthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            ...healthStatus,
            responseTime: `${responseTime}ms`,
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('Health check failed:', error);

        const healthStatus: HealthStatus = {
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };

        return NextResponse.json({
            ...healthStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, {
            status: 503,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    }
}
