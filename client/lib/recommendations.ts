import { brandKey, categoryKey } from "@/lib/catalogue";

/**
 * What the home rails are built from.
 *
 * Both rails read the catalogue the app already holds -- `sales_count` is
 * written by the Shopify sync and comes down with every product fetch, so
 * Trending follows real sales without a separate feed to keep in step.
 */

export interface RankableProduct {
  id: string;
  brand?: string | null;
  category?: string | null;
  salesCount?: number;
  rating?: number;
}

/** A line item off one of the customer's past orders. */
export interface PurchasedItem {
  productId?: string;
  title?: string;
}

const bySalesThenRating = (a: RankableProduct, b: RankableProduct) =>
  (b.salesCount ?? 0) - (a.salesCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0);

/**
 * Genuinely best-selling stock, most sold first, with rating breaking ties so a
 * catalogue that has not sold anything yet still returns something sensible
 * rather than whatever happened to be first.
 */
export const getTrendingProducts = <T extends RankableProduct>(
  products: T[],
  limit = 10,
): T[] => [...products].sort(bySalesThenRating).slice(0, limit);

/**
 * A repeat purchase of the same brand is a stronger signal than another piece
 * from the same category, so brand affinity is weighted above it.
 */
const BRAND_WEIGHT = 2;
const CATEGORY_WEIGHT = 1;

const resolvePurchases = <T extends RankableProduct & { name?: string }>(
  products: T[],
  purchases: PurchasedItem[],
) => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const byName = new Map(
    products.map((p) => [(p.name ?? "").trim().toLowerCase(), p]),
  );

  const resolved: T[] = [];
  const purchasedIds = new Set<string>();

  for (const item of purchases) {
    // Orders synced from Shopify do not always carry our product id, so the
    // title is the fallback link back to the catalogue.
    const match =
      (item.productId ? byId.get(item.productId) : undefined) ??
      byName.get((item.title ?? "").trim().toLowerCase());

    if (match) {
      resolved.push(match);
      purchasedIds.add(match.id);
    }
  }

  return { resolved, purchasedIds };
};

/**
 * Picks from the brands and categories this customer has actually bought,
 * leaving out pieces they already own. Someone with no order history -- or
 * whose orders are all for stock we no longer carry -- gets the best sellers,
 * so the rail is never empty.
 */
export const getPersonalizedProducts = <
  T extends RankableProduct & { name?: string },
>(
  products: T[],
  purchases: PurchasedItem[],
  limit = 4,
): T[] => {
  const { resolved, purchasedIds } = resolvePurchases(products, purchases);

  if (resolved.length === 0) {
    return getTrendingProducts(products, limit);
  }

  const brandAffinity = new Map<string, number>();
  const categoryAffinity = new Map<string, number>();

  for (const product of resolved) {
    const brand = brandKey(product.brand);
    if (brand) brandAffinity.set(brand, (brandAffinity.get(brand) ?? 0) + 1);

    const category = categoryKey(product.category);
    if (category) {
      categoryAffinity.set(category, (categoryAffinity.get(category) ?? 0) + 1);
    }
  }

  const scoreOf = (product: T) =>
    (brandAffinity.get(brandKey(product.brand)) ?? 0) * BRAND_WEIGHT +
    (categoryAffinity.get(categoryKey(product.category)) ?? 0) * CATEGORY_WEIGHT;

  const candidates = products
    .filter((product) => !purchasedIds.has(product.id))
    .map((product) => ({ product, score: scoreOf(product) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || bySalesThenRating(a.product, b.product),
    )
    .map((entry) => entry.product);

  if (candidates.length >= limit) {
    return candidates.slice(0, limit);
  }

  // Top up with best sellers they have neither bought nor already been shown.
  const chosen = new Set(candidates.map((p) => p.id));
  const filler = getTrendingProducts(
    products.filter((p) => !purchasedIds.has(p.id) && !chosen.has(p.id)),
    limit - candidates.length,
  );

  return [...candidates, ...filler];
};
