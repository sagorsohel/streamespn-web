import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidScore(score: any): boolean {
  if (score === null || score === undefined) return false;
  const s = String(score).trim().toLowerCase();
  return s !== '' && s !== 'null' && s !== 'undefined';
}

export function sanitizeScore(score: any, fallback = '0'): string {
  if (!isValidScore(score)) return fallback;
  return String(score).trim();
}

