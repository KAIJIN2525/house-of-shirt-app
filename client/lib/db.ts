import type { Database } from "./database.types";

/**
 * Shorthand for a table's row shape, so mappers can say `Tables<"orders">`
 * instead of reaching through the generated `Database` type each time.
 *
 * `database.types.ts` is generated — regenerate it with
 * `npx supabase gen types typescript --linked > lib/database.types.ts`
 * whenever a migration changes the schema. These aliases are hand-written and
 * survive that regeneration.
 */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
