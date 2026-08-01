import type { Json } from "./database.types";

/**
 * Widens a JSON-serializable value to the `Json` type the generated database
 * types expect for jsonb columns.
 *
 * TypeScript will not assign an `interface` to `Json` even when its shape is
 * perfectly serializable, because interfaces have no implicit index signature.
 * Centralising the cast keeps that one unavoidable assertion in a single
 * reviewable place instead of spreading `as unknown as Json` across stores.
 *
 * Only pass values that really are serializable: no `undefined` members that
 * must survive the round trip, no `Date`, `Map`, `Set`, or class instances.
 */
export const toJson = <T>(value: T): Json => value as unknown as Json;
