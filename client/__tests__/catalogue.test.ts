import { ALL_ITEMS_KEY, buildCategoryFilters, categoryKey } from "@/lib/catalogue";

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
