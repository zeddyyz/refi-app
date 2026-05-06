import moment from "moment";

// Format that matches the Firestore Console display, e.g.:
//   "May 13, 2026 at 7:00:00 AM UTC-04:00"
// The "UTC[Z]" piece (numeric offset) makes the string self-describing
// so we can parse it back to the exact same instant regardless of where
// the parsing happens.
const DISPLAY_FORMAT = "MMMM D, YYYY [at] h:mm:ss A [UTC]Z";

// Recognises the same shape we just emitted. We are intentionally strict so
// that arbitrary user strings cannot be misinterpreted as timestamps.
//   - month name: 3+ alphabetic characters
//   - day: 1 or 2 digits
//   - year: 4 digits
//   - "at"
//   - h:mm:ss (12h, no leading zero on hour)
//   - AM/PM
//   - UTC[+-]HH:MM
const DISPLAY_REGEX = /^[A-Za-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}:\d{2} (AM|PM) UTC[+-]\d{2}:\d{2}$/;

const SERIALIZED_PREFIX = "__Timestamp__";

// Matches the JSON-string encoding of the serialized form, e.g.:
//   "__Timestamp__2026-05-13T11:00:00.000Z"
// The ISO portion is whatever Date.prototype.toISOString() emits.
const SERIALIZED_JSON_REGEX = /"__Timestamp__([^"\\]+)"/g;

/**
 * Convert any "__Timestamp__<ISO>" JSON-encoded strings inside a JSON document
 * into Firestore-Console-style display strings, in the user's local timezone.
 *
 * Operates on the JSON text (not the parsed object) so it can be applied to
 * the exact string the Monaco editor renders.
 */
export function displayifyTimestamps(jsonStr: string): string {
  return jsonStr.replace(SERIALIZED_JSON_REGEX, (match, iso: string) => {
    const m = moment(iso);
    if (!m.isValid()) {
      return match;
    }
    return JSON.stringify(m.format(DISPLAY_FORMAT));
  });
}

/**
 * Inverse of {@link displayifyTimestamps}. Walks the parsed JSON structure
 * and rewrites display strings back into the canonical "__Timestamp__<ISO>"
 * form expected by the firestore-serializers deserializer.
 *
 * Returns an `error` describing the first unparseable timestamp-shaped string
 * encountered, so callers can surface it as a validation message instead of
 * silently corrupting data.
 */
export function restoreTimestamps(
  jsonStr: string
): { result: string; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Let the caller surface JSON-parse errors via the existing path.
    return { result: jsonStr };
  }

  let firstError: string | undefined;

  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      if (node.startsWith(SERIALIZED_PREFIX)) {
        return node;
      }
      if (DISPLAY_REGEX.test(node)) {
        const m = moment(node, DISPLAY_FORMAT, true);
        if (!m.isValid()) {
          if (!firstError) {
            firstError = `Invalid timestamp: "${node}"`;
          }
          return node;
        }
        return SERIALIZED_PREFIX + m.toDate().toISOString();
      }
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(node as Record<string, unknown>)) {
        out[key] = walk((node as Record<string, unknown>)[key]);
      }
      return out;
    }
    return node;
  };

  const rewritten = walk(parsed);
  return {
    result: JSON.stringify(rewritten),
    error: firstError,
  };
}

export const __timestampDisplay = {
  DISPLAY_FORMAT,
  DISPLAY_REGEX,
  SERIALIZED_PREFIX,
};
