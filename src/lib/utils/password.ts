// src/lib/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password from database
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Check if a password needs rehashing (e.g., if SALT_ROUNDS changed)
 * @param hash Hashed password from database
 * @returns True if password should be rehashed
 */
export function needsRehash(hash: string): boolean {
    try {
        const rounds = bcrypt.getRounds(hash);
        return rounds < SALT_ROUNDS;
    } catch {
        return true;
    }
}
