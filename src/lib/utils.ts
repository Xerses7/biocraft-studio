import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function decodeHTMLEntities(text: string) {
  return text.replace(/&#(\d+);/g, function (match, dec) {
    return String.fromCharCode(dec);
  });
}
