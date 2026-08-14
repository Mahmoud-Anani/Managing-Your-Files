import type { ClassValue } from "./class-value";

export function cn(...values: Array<ClassValue | undefined | null | false>): string {
  const parts: string[] = [];
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      parts.push(value);
    } else if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) {
        parts.push(nested);
      }
    }
  }
  return parts.join(" ");
}
