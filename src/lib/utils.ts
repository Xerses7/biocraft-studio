import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine multiple class names with Tailwind CSS support
 * This function merges class names and resolves Tailwind CSS conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a more readable format
 * @param date - Date string to format
 * @param includeTime - Whether to include time in the output
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Truncate text with ellipsis if it exceeds the specified length
 * @param text - Text to truncate
 * @param length - Maximum length before truncation
 */
export function truncateText(text: string, length = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Delay execution for a specified time
 * @param ms - Time to delay in milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get initials from a name (e.g., "John Doe" => "JD")
 * @param name - Full name to get initials from
 */
export function getInitials(name: string): string {
  if (!name) return ''
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}