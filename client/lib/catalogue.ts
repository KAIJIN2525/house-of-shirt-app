/**
 * Category filters for the shop rail.
 *
 * Categories are Shopify product types, typed by hand per product, so the app
 * cannot assume they match any fixed list of labels it ships with. Both halves
 * of this module exist to stop a chip from returning "Collection Empty": the
 * key squashes spelling differences, and the rail is built from the catalogue
 * rather than declared up front.
 */

export const ALL_BRANDS_KEY = "all";
export const ALL_BRANDS_LABEL = "All Brands";

/**
 * Vendors are typed per product in Shopify, so one brand arrives under several
 * spellings: "Top man" and "Topman", "Super dry" and "Superdry". Squashing case,
 * spacing and punctuation folds those together.
 */
const squash = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Spellings that squashing alone cannot reconcile, mapped onto one canonical
 * key. Left side is the squashed variant, right side the brand it belongs to.
 * Add a line here whenever the catalogue turns up another way of writing a name
 * we already stock.
 */
const BRAND_ALIASES: Record<string, string> = {
  // Curated tile says "US POLO"; the catalogue says "US Polo Assn"/"U S Polo".
  uspolo: "uspoloassn",
  uspoloassociation: "uspoloassn",
  // Curated tile says "RALPH LAUREN"; most of the stock is filed as "Polo R L".
  polorl: "ralphlauren",
  poloralphlauren: "ralphlauren",
  // Misspelt on the majority of the Tommy Hilfiger stock.
  tommyhilfigher: "tommyhilfiger",
  ck: "calvinklein",
  levis: "levi",
};

/** The key two brand names must share to be treated as the same brand. */
export const brandKey = (value?: string | null) => {
  const base = squash(value);
  return BRAND_ALIASES[base] ?? base;
};

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
export interface BrandFilter {
  key: string;
  label: string;
}

/**
 * The brand chips, led by All Brands. Curated names win the label when they
 * match stock, so the rail reads the way the collective was written rather than
 * however the vendor field happens to be spelt; otherwise the most common
 * spelling in the catalogue is used. Curated brands with no stock behind them
 * are left out -- a chip that returns nothing is worse than no chip.
 */
export const buildBrandFilters = (
  products: { brand?: string | null }[],
  curatedNames: string[] = [],
): BrandFilter[] => {
  const spellings = new Map<string, Map<string, number>>();

  for (const product of products) {
    const name = product.brand?.trim();
    if (!name) continue;

    const key = brandKey(name);
    if (!key) continue;

    const counts = spellings.get(key) ?? new Map<string, number>();
    counts.set(name, (counts.get(name) ?? 0) + 1);
    spellings.set(key, counts);
  }

  const curatedByKey = new Map(
    curatedNames
      .map((name) => [brandKey(name), name.trim()] as const)
      .filter(([key]) => key),
  );

  const filters = Array.from(spellings.entries()).map(([key, counts]) => {
    const mostCommon = Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0][0];

    return { key, label: curatedByKey.get(key) ?? mostCommon };
  });

  filters.sort((a, b) => a.label.localeCompare(b.label));

  return [{ key: ALL_BRANDS_KEY, label: ALL_BRANDS_LABEL }, ...filters];
};

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
