/**
 * Shared Email Validation Utility (Frontend)
 * Validates structural conformance with standard email specifications:
 * - Local-part: 1 to 64 chars, valid RFC characters, no leading/trailing/consecutive dots
 * - Exactly one '@' separating local-part and domain
 * - Domain: 1 to 253 chars, dot-separated labels (domain + TLD)
 * - Domain labels: cannot start/end with hyphen, valid alphanumeric/hyphen characters
 * - TLD: at least 2 alphabetic characters (e.g. .com, .in, .co.uk, .org, .net, .co)
 * - Supports any legitimate provider and TLD without artificial whitelists
 */

export const INVALID_EMAIL_CODE = 'INVALID_EMAIL';
export const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';

/**
 * Validates the structure of an email address.
 * @param {string} email
 * @returns {boolean} true if valid structure, false otherwise
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;

  // Must have exactly one '@'
  const atParts = trimmed.split('@');
  if (atParts.length !== 2) return false;
  const [local, domain] = atParts;

  // Local-part validations (1 to 64 characters)
  if (!local || local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (local.includes('..')) return false;

  // Permitted local-part characters
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localRegex.test(local)) return false;

  // Domain validations (1 to 253 characters)
  if (!domain || domain.length > 253) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) return false;
  if (domain.includes('..')) return false;

  // Domain must contain at least one dot separating domain label(s) and TLD
  const labels = domain.split('.');
  if (labels.length < 2) return false;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (!label || label.length > 63) return false;
    // Labels cannot start or end with a hyphen
    if (label.startsWith('-') || label.endsWith('-')) return false;

    if (i === labels.length - 1) {
      // Top-level domain (TLD) must be at least 2 alphabetic characters
      if (!/^[a-zA-Z]{2,}$/.test(label)) return false;
    } else {
      // Domain or subdomain label: alphanumeric and hyphen
      if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
    }
  }

  return true;
}

/**
 * Consistently normalizes email addresses: trims whitespace and lowercases.
 * @param {string} email
 * @returns {string} normalized email
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}
