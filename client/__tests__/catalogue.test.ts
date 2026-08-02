import {
  ALL_BRANDS_KEY,
  ALL_ITEMS_KEY,
  brandKey,
  buildBrandFilters,
  buildCategoryFilters,
  categoryKey,
} from "@/lib/catalogue";

// Spellings taken from the live catalogue's vendor field.
const CATALOGUE = [
  ...Array(31).fill("US Polo Assn"),
  ...Array(3).fill("U S Polo"),
  ...Array(23).fill("Polo R L"),
  ...Array(3).fill("Ralph Lauren"),
  ...Array(78).fill("Tommy hilfigher"),
  ...Array(14).fill("Tommy Hilfiger"),
  ...Array(13).fill("Top man"),
  ...Array(3).fill("Topman"),
  ...Array(3).fill("Calvin Klein"),
  "C K",
  ...Array(127).fill("Zara"),
].map((brand) => ({ brand }));

const countFor = (selected: string) =>
  CATALOGUE.filter((p) => brandKey(p.brand) === brandKey(selected)).length;

describe("brandKey", () => {
  it("folds the spacing and punctuation variants of one vendor together", () => {
    expect(brandKey("Top man")).toBe(brandKey("Topman"));
    expect(brandKey("U S Polo")).toBe(brandKey("US Polo"));
  });

  it("reconciles the curated name with how the stock is filed", () => {
    // The tile says "US POLO"; the products say "US Polo Assn".
    expect(brandKey("US POLO")).toBe(brandKey("US Polo Assn"));
    // The tile says "RALPH LAUREN"; most of that stock is filed as "Polo R L".
    expect(brandKey("RALPH LAUREN")).toBe(brandKey("Polo R L"));
  });

  it("folds a misspelling that most of a brand's stock carries", () => {
    expect(brandKey("Tommy hilfigher")).toBe(brandKey("Tommy Hilfiger"));
  });

  it("keeps different brands apart", () => {
    expect(brandKey("Zara")).not.toBe(brandKey("Asos"));
    expect(brandKey("New Look")).not.toBe(brandKey("New Era"));
  });
});

describe("brand filtering against the real catalogue spellings", () => {
  it("returns the US Polo stock for the curated tile that used to find none", () => {
    expect(countFor("US POLO")).toBe(34);
  });

  it("returns every Tommy Hilfiger piece regardless of spelling", () => {
    expect(countFor("Tommy Hilfiger")).toBe(92);
  });

  it("gathers Ralph Lauren stock filed under Polo R L", () => {
    expect(countFor("RALPH LAUREN")).toBe(26);
  });
});

describe("buildBrandFilters", () => {
  it("leads with All Brands", () => {
    expect(buildBrandFilters([])[0]).toMatchObject({ key: ALL_BRANDS_KEY });
  });

  it("shows one chip per brand, not one per spelling", () => {
    const labels = buildBrandFilters(CATALOGUE).map((f) => f.label);
    // All Brands + US Polo, Ralph Lauren, Tommy Hilfiger, Topman, Calvin Klein,
    // Zara -- eleven spellings collapsed into six brands.
    expect(labels).toHaveLength(7);
    expect(labels.filter((l) => /tommy/i.test(l))).toHaveLength(1);
    expect(labels.filter((l) => /polo/i.test(l))).toHaveLength(2);
  });

  it("prefers the curated spelling for the label", () => {
    const filters = buildBrandFilters(CATALOGUE, ["US POLO"]);
    expect(filters.find((f) => f.key === brandKey("US Polo Assn"))?.label).toBe(
      "US POLO",
    );
  });

  it("falls back to the most common spelling when nothing is curated", () => {
    const filters = buildBrandFilters(CATALOGUE);
    expect(filters.find((f) => f.key === brandKey("Tommy Hilfiger"))?.label).toBe(
      "Tommy hilfigher",
    );
  });

  it("leaves out a curated brand with no stock behind it", () => {
    const filters = buildBrandFilters(CATALOGUE, ["Gucci"]);
    expect(filters.some((f) => f.label === "Gucci")).toBe(false);
  });

  it("every chip matches at least one product", () => {
    for (const filter of buildBrandFilters(CATALOGUE, ["US POLO"])) {
      if (filter.key === ALL_BRANDS_KEY) continue;
      expect(
        CATALOGUE.some((p) => brandKey(p.brand) === filter.key),
      ).toBe(true);
    }
  });
});

describe("categoryKey", () => {
  it("treats hand-typed spellings of one product type as the same category", () => {
    const expected = categoryKey("T-Shirts");
    expect(categoryKey("T-shirt")).toBe(expected);
    expect(categoryKey(" tshirts ")).toBe(expected);
    expect(categoryKey("T Shirt")).toBe(expected);
  });

  it("keeps genuinely different types apart", () => {
    expect(categoryKey("Shirts")).not.toBe(categoryKey("T-Shirts"));
    expect(categoryKey("Hoodies")).not.toBe(categoryKey("Sweatshirts"));
  });

  it("returns an empty key for missing types", () => {
    expect(categoryKey(undefined)).toBe("");
    expect(categoryKey("   ")).toBe("");
  });
});

describe("buildCategoryFilters", () => {
  it("offers only categories the catalogue actually stocks", () => {
    const filters = buildCategoryFilters([
      { category: "Shirts" },
      { category: "Shirts" },
      { category: "Hoodies" },
    ]);

    expect(filters.map((f) => f.label)).toEqual(["All Items", "Shirts", "Hoodies"]);
  });

  it("leads with All Items", () => {
    expect(buildCategoryFilters([])[0]).toMatchObject({ key: ALL_ITEMS_KEY });
  });

  it("every chip matches at least one product", () => {
    const products = [
      { category: "T-shirt" },
      { category: "Trousers" },
      { category: "Caps" },
    ];

    for (const filter of buildCategoryFilters(products)) {
      if (filter.key === ALL_ITEMS_KEY) continue;
      expect(
        products.some((p) => categoryKey(p.category) === filter.key),
      ).toBe(true);
    }
  });

  it("uses the curated label and icon when it recognises the type", () => {
    const [, tshirts] = buildCategoryFilters([{ category: "t-shirt" }]);
    expect(tshirts).toEqual({
      key: categoryKey("T-Shirts"),
      label: "T-Shirts",
      icon: "tshirt-crew",
    });
  });

  it("still shows an unrecognised type under its own name", () => {
    const [, caps] = buildCategoryFilters([{ category: "Caps" }]);
    expect(caps.label).toBe("Caps");
    expect(caps.icon).toBe("tag-outline");
  });

  it("skips products with no type rather than showing a blank chip", () => {
    expect(buildCategoryFilters([{ category: "" }, { category: null }])).toHaveLength(1);
  });
});
