import { COUNTRY_CODES } from "../constants/country-codes";

/**
 * Splits a full phone string (e.g. "919876543210") into
 * { country, number } by matching against known dial codes.
 */
export function splitPhone(phone = "") {
  const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
  if (match) {
    return { country: match.code, number: phone.slice(match.code.length) };
  }
  return { country: "91", number: phone };
}

/**
 * Formats a raw phone string for display, e.g. "919876543210" → "+91 9876543210".
 */
export function formatPhone(phone = "") {
  if (!phone) return "Not configured";
  const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
  if (match) {
    return `+${match.code} ${phone.slice(match.code.length)}`;
  }
  return `+${phone}`;
}

/**
 * Converts seconds to a human-friendly delay string.
 */
export function formatDelay(seconds) {
  if (!seconds) return "30 minutes";
  const secs = parseInt(seconds, 10);
  if (secs >= 3600) {
    const hours = secs / 3600;
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${secs / 60} minutes`;
}
