/**
 * Case-insensitive search helper for Prisma.
 *
 * SQLite  → LIKE is already case-insensitive, so `mode` is NOT supported.
 * PostgreSQL → LIKE is case-sensitive, we need `mode: 'insensitive'` (uses ILIKE).
 *
 * Usage:
 *   import { iContains } from '@/lib/db-search';
 *   { nama: iContains(search) }
 */

const isPostgres = process.env.DATABASE_URL?.startsWith('postgres');

export function iContains(search: string) {
  if (!search) return undefined;
  if (isPostgres) {
    return { contains: search, mode: 'insensitive' as const };
  }
  return { contains: search };
}
