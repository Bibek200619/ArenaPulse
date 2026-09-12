import { notFound } from 'next/navigation';
import { AppError } from '@/lib/errors';
export function entityNotFound(error: unknown): never {
  if (error instanceof AppError && error.code === 'NOT_FOUND') notFound();
  throw error;
}
