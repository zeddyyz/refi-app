# Human-readable Timestamps in the Monaco JSON Editor

## Summary

The Monaco JSON editor in `MonacoProperty.tsx` previously rendered Firestore
`Timestamp` fields using the wire-format sentinel produced by
`firestore-serializers`:

```json
"begin": "__Timestamp__2026-05-13T11:00:00.000Z"
```

This change replaces that representation with a Firestore-Console-style
display string, in the user's local timezone, and round-trips edits back into
a real `firebase.firestore.Timestamp` on save:

```json
"begin": "May 13, 2026 at 7:00:00 AM UTC-04:00"
```

The change is scoped strictly to the Monaco editor view. The basic table
editor, copy/paste, import/export, and the server side continue to use the
canonical `__Timestamp__<ISO>` form on the wire — no other consumer of
`firestore-serializers` is affected.

## Behavior

### Display

Every `"__Timestamp__<ISO>"` string the serializer emits is rewritten to:

```
MMMM D, YYYY [at] h:mm:ss A [UTC]Z
```

…in the user's local timezone (e.g. `May 13, 2026 at 7:00:00 AM UTC-04:00`).
The numeric `UTC±HH:MM` suffix makes the string self-describing, so the
displayed instant is unambiguous regardless of where the JSON is later
parsed.

### Editing

When the user edits the timestamp text and the editor commits, the document
is walked and each display-formatted string is parsed back to UTC ISO via
`moment` strict parsing, then re-encoded as `__Timestamp__<ISO>` and handed
to the existing `deserializeDocumentSnapshot` pipeline. The reconstructed
field is a real `firebase.firestore.Timestamp`.

A round-trip with no edit produces zero diff (no spurious update), because
the format/parse pair preserves the exact instant.

### Validation

If the user types a string that *looks* like a timestamp but fails strict
parsing (defensive case), a `TimestampParseError` is raised and surfaced in
the existing red validation bar at the bottom of the editor — consistent
with how JSON-parse errors are shown today. Plain strings that don't match
the timestamp shape are left untouched.

### What is **not** changed

- The on-the-wire format produced by `firestore-serializers` is unchanged
  (`__Timestamp__<ISO>`), so:
  - The basic table editor still works exactly as before.
  - Copy/paste between Monaco and other tools is unaffected.
  - Import/export and the server side are unaffected.
- The `DateTimePicker` used by the table view and the basic property view is
  untouched.

## Files changed

### New: `vite/src/utils/timestampDisplay.ts`

Two pure helpers plus a few constants:

- `displayifyTimestamps(jsonStr: string): string`
  - Regex-replaces every JSON-encoded `"__Timestamp__<ISO>"` string with a
    `JSON.stringify`'d display string. Operates on the JSON text so the
    output remains valid JSON without re-walking the parsed object.
- `restoreTimestamps(jsonStr: string): { result: string; error?: string }`
  - Parses the JSON, walks the structure, and rewrites display-formatted
    strings back to the canonical `__Timestamp__<ISO>` form. Returns an
    `error` describing the first unparseable timestamp-shaped string.

Key constants:

```ts
const DISPLAY_FORMAT = "MMMM D, YYYY [at] h:mm:ss A [UTC]Z";
const DISPLAY_REGEX  = /^[A-Za-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}:\d{2} (AM|PM) UTC[+-]\d{2}:\d{2}$/;
const SERIALIZED_PREFIX = "__Timestamp__";
const SERIALIZED_JSON_REGEX = /"__Timestamp__([^"\\]+)"/g;
```

### Edited: `vite/src/components/Property/MonacoProperty.tsx`

- Added imports for `displayifyTimestamps` and `restoreTimestamps`.
- `serializeData` now pipes the serialized JSON through
  `displayifyTimestamps`.
- `deserializeData` runs `restoreTimestamps` first; on error it throws a
  typed `TimestampParseError`.
- `commitChange` catches `TimestampParseError` and surfaces the message via
  the existing `setError` path (red validation bar).

Diffs of the relevant sections:

```ts
const serializeData = (doc: ClientDocumentSnapshot) => {
  return displayifyTimestamps(
    removeFirebaseSerializeMetaData(
      JSON.stringify(JSON.parse(serializeDocumentSnapshot(doc)))
    )
  );
};

class TimestampParseError extends Error {}

const deserializeData = (
  originalDoc: ClientDocumentSnapshot,
  data: string
): ClientDocumentSnapshot => {
  const restored = restoreTimestamps(data);
  if (restored.error) {
    throw new TimestampParseError(restored.error);
  }
  return originalDoc.clone(
    deserializeDocumentSnapshot(
      addFirebaseDocSerializeMetaData(
        restored.result,
        originalDoc.id,
        originalDoc.ref.path
      ),
      firebase.firestore.GeoPoint,
      firebase.firestore.Timestamp,
      (path) => new DocRef(path)
    ).data()
  );
};
```

```ts
} catch (error) {
  if (error instanceof TimestampParseError) {
    setError(error.message);
    return;
  }
  console.log(error);
}
```

## Design decisions

- **Why operate on the JSON text rather than the parsed object on the way
  out?** The serializer already produces a fully escaped JSON string with
  `__Timestamp__` sentinels. A regex pass over the string is the smallest
  possible change and avoids re-walking the object. On the way back in we
  must walk the parsed object anyway (to find user-edited strings), so we
  parse-then-walk there.
- **Why include the numeric UTC offset (`UTC-04:00`) instead of the
  Firestore Console's shorter `UTC-4`?** The numeric offset is a strict ISO
  8601 form that `moment` parses unambiguously and round-trips exactly. The
  visual difference is two characters; correctness wins.
- **Why a strict regex?** To prevent arbitrary user strings from being
  misinterpreted as timestamps. Only strings that look exactly like our
  emitted format are rewritten back.
- **Why pre-existing `__Timestamp__` strings are left alone in
  `restoreTimestamps`.** Users may paste JSON containing the canonical
  sentinel from elsewhere; we treat that as a valid pre-encoded timestamp.

## Edge cases verified (mental dry-run)

- Documents with no timestamps → no-op in both directions.
- Nested timestamps inside arrays/objects (e.g. `activities[].begin`) →
  handled by the recursive `walk` in `restoreTimestamps`.
- Round-trip with no edit → zero diff (no spurious `actionUpdateDoc`).
- Editing a timestamp's local time → reconstructed UTC instant matches.
- Typo'd month name (e.g. `"Mayo …"`) → fails the regex, left as a plain
  string (the existing fallback behavior of the deserializer).
- Pre-existing `"__Timestamp__<ISO>"` pasted by user → passes through
  unchanged.

## Linter

`ReadLints` reports no errors on either changed/created file.
