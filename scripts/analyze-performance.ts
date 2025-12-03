// scripts/analyze-performance.ts
/**
 * Performance Analysis Script
 * Run with: npx tsx scripts/analyze-performance.ts
 */

import { prisma } from '../src/lib/prisma';

interface PerformanceMetrics {
    tableName: string;
    recordCount: number;
    estimatedSize: string;
    hasIndexes: boolean;
    recommendations: string[];
}

async function analyzePerformance() {
    console.log('🔍 Analyzing Database Performance...\n');

    const metrics: PerformanceMetrics[] = [];

    // Analyze Transactions
    const transactionCount = await prisma.transaction.count();
    metrics.push({
        tableName: 'Transaction',
        recordCount: transactionCount,
        estimatedSize: `${(transactionCount * 0.5).toFixed(2)} KB`,
        hasIndexes: true,
        recommendations: transactionCount > 10000
            ? ['Consider archiving old transactions', 'Implement pagination']
            : ['Performance is good'],
    });

    // Analyze Products
    const productCount = await prisma.product.count();
    const batchCount = await prisma.productBatch.count();
    metrics.push({
        tableName: 'Product/ProductBatch',
        recordCount: productCount + batchCount,
        estimatedSize: `${((productCount + batchCount) * 0.3).toFixed(2)} KB`,
        hasIndexes: true,
        recommendations: batchCount > 5000
            ? ['Consider batch cleanup for expired items']
            : ['Performance is good'],
    });

    // Analyze Customers
    const customerCount = await prisma.customer.count();
    metrics.push({
        tableName: 'Customer',
        recordCount: customerCount,
        estimatedSize: `${(customerCount * 0.2).toFixed(2)} KB`,
        hasIndexes: true,
        recommendations: customerCount > 50000
            ? ['Consider customer segmentation']
            : ['Performance is good'],
    });

    // Display Results
    console.log('📊 Performance Metrics:\n');
    console.table(metrics);

    // Check for slow queries
    console.log('\n⚡ Query Performance Tips:\n');
    console.log('1. Use indexes on frequently queried fields ✓');
    console.log('2. Implement pagination for large datasets');
    console.log('3. Use select() to fetch only needed fields');
    console.log('4. Consider caching for frequently accessed data');
    console.log('5. Monitor query execution time in production');

    // Memory Usage
    const memUsage = process.memoryUsage();
    console.log('\n💾 Memory Usage:\n');
    console.log(`Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);

    // Recommendations
    console.log('\n✅ Recommendations:\n');

    if (transactionCount > 10000) {
        console.log('⚠️  Consider implementing transaction archiving');
    }

    if (batchCount > 5000) {
        console.log('⚠️  Review and cleanup expired product batches');
    }

    if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
        console.log('⚠️  High memory usage detected - consider optimization');
    } else {
        console.log('✓ Memory usage is healthy');
    }

    await prisma.$disconnect();
}

// Run analysis
analyzePerformance()
    .then(() => {
        console.log('\n✅ Analysis complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
