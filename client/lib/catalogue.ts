/**
 * Category filters for the shop rail.
 *
 * Categories are Shopify product types, typed by hand per product, so the app
 * cannot assume they match any fixed list of labels it ships with. Both halves
 * of this module exist to stop a chip from returning "Collection Empty": the
 * key squashes spelling differences, and the rail is built from the catalogue
 * rather than declared up front.
 */

export const ALL_ITEMS_KEY = "all";
export const ALL_ITEMS_LABEL = "All Items";
export const ALL_ITEMS_ICON = "view-grid";
export const DEFAULT_CATEGORY_ICON = "tag-outline";

export interface CategoryFilter {
  key: string;
  label: string;
  icon: string;
}

/**
 * Curated presentation for the categories we know about: a nicer label than
 * whatever the product type happens to say, plus an icon. Anything else the
 * catalogue turns up still gets a chip -- it just keeps its own name and the
 * default icon.
 */
export const CURATED_CATEGORIES: { label: string; icon: string }[] = [
  { label: "T-Shirts", icon: "tshirt-crew" },
  { label: "Shirts", icon: "tshirt-crew" },
  { label: "Hoodies", icon: "hanger" },
  { label: "Long Sleeve", icon: "tshirt-v" },
  { label: "Sweatshirts", icon: "hanger" },
  { label: "Trousers", icon: "hanger" },
  { label: "Accessories", icon: "glasses" },
];

/**
 * "T-Shirts", "T-shirt" and "tshirts" all mean the same rail, so comparisons
 * run on a squashed, de-pluralised key rather than the raw label.
 */
export const categoryKey = (value?: string | null) => {
  const base = (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return base.endsWith("s") ? base.slice(0, -1) : base;
};

const CURATED_BY_KEY = new Map(
  CURATED_CATEGORIES.map((category) => [categoryKey(category.label), category]),
);

/**
 * The chips to show, always led by All Items. Every other chip is backed by at
 * least one product in the catalogue, in curated order first and then whatever
 * else turned up, alphabetically.
 */
export const buildCategoryFilters = (
  products: { category?: string | null }[],
): CategoryFilter[] => {
  const found = new Map<string, CategoryFilter>();

  for (const product of products) {
    const name = product.category?.trim();
    if (!name) continue;

    const key = categoryKey(name);
    if (!key || found.has(key)) continue;

    const curated = CURATED_BY_KEY.get(key);
    found.set(key, {
      key,
      label: curated?.label ?? name,
      icon: curated?.icon ?? DEFAULT_CATEGORY_ICON,
    });
  }

  const curatedOrder = CURATED_CATEGORIES.map((c) => categoryKey(c.label));
  const rank = (key: string) => {
    const index = curatedOrder.indexOf(key);
    return index === -1 ? curatedOrder.length : index;
  };

  return [
    { key: ALL_ITEMS_KEY, label: ALL_ITEMS_LABEL, icon: ALL_ITEMS_ICON },
    ...Array.from(found.values()).sort(
      (a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label),
    ),
  ];
};
