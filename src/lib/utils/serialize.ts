// src/lib/utils/serialize.ts
import { Prisma } from '@prisma/client';

/**
 * Converts Prisma Decimal objects to plain numbers for client component serialization.
 * This is necessary because Decimal objects cannot be passed from Server Components to Client Components.
 */
export function serializeDecimal(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

/**
 * Recursively serializes all Decimal fields in an object to plain numbers.
 * This handles nested objects and arrays.
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimals(item)) as T;
  }
  
  // Handle Decimal objects
  if (obj instanceof Prisma.Decimal) {
    return obj.toNumber() as T;
  }
  
  // Handle Date objects (keep them as-is for Next.js serialization)
  if (obj instanceof Date) {
    return obj as T;
  }
  
  // Handle plain objects
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeDecimals(obj[key]);
      }
    }
    return serialized as T;
  }
  
  // Return primitives as-is
  return obj;
}
