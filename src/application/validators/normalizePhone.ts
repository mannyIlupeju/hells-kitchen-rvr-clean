/**
 * Normalizes a user-typed phone number into E.164 format, e.g.
 * "(212) 555-1234" -> "+12125551234", "212-555-1234" -> "+12125551234".
 * Bare 10-digit numbers are assumed US/Canada. Already-prefixed numbers
 * (starting with "+") are left as-is aside from stripping formatting chars.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}
