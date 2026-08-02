import {
  getPersonalizedProducts,
  getTrendingProducts,
} from "@/lib/recommendations";

const product = (
  id: string,
  overrides: Partial<{
    name: string;
    brand: string;
    category: string;
    salesCount: number;
    rating: number;
  }> = {},
) => ({
  id,
  name: overrides.name ?? `Product ${id}`,
  brand: overrides.brand ?? "House of Shirts",
  category: overrides.category ?? "Shirts",
  salesCount: overrides.salesCount ?? 0,
  rating: overrides.rating ?? 0,
});

describe("getTrendingProducts", () => {
  it("ranks by units sold, not catalogue order", () => {
    const catalogue = [
      product("a", { salesCount: 1 }),
      product("b", { salesCount: 10 }),
      product("c", { salesCount: 6 }),
    ];

    expect(getTrendingProducts(catalogue, 3).map((p) => p.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("breaks ties on rating so an unsold catalogue still ranks sensibly", () => {
    const catalogue = [
      product("a", { salesCount: 0, rating: 3 }),
      product("b", { salesCount: 0, rating: 5 }),
    ];

    expect(getTrendingProducts(catalogue, 2).map((p) => p.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("does not mutate the catalogue it was given", () => {
    const catalogue = [product("a", { salesCount: 1 }), product("b", { salesCount: 9 })];
    getTrendingProducts(catalogue);
    expect(catalogue.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("honours the limit", () => {
    expect(getTrendingProducts([product("a"), product("b")], 1)).toHaveLength(1);
  });
});

describe("getPersonalizedProducts", () => {
  const catalogue = [
    product("zara-1", { brand: "Zara", category: "Shirts", salesCount: 2 }),
    product("zara-2", { brand: "Zara", category: "Trousers", salesCount: 1 }),
    product("nike-1", { brand: "Nike", category: "Shirts", salesCount: 9 }),
    product("asos-1", { brand: "Asos", category: "Hoodies", salesCount: 8 }),
    product("owned", { brand: "Zara", category: "Shirts", salesCount: 50 }),
  ];

  it("falls back to best sellers for a customer with no orders", () => {
    expect(getPersonalizedProducts(catalogue, [], 2).map((p) => p.id)).toEqual([
      "owned",
      "nike-1",
    ]);
  });

  it("favours brands the customer has bought before", () => {
    const picks = getPersonalizedProducts(
      catalogue,
      [{ productId: "owned" }],
      2,
    );

    // Same brand outranks the higher-selling Nike shirt.
    expect(picks.map((p) => p.id)).toEqual(["zara-1", "zara-2"]);
  });

  it("never recommends something the customer already owns", () => {
    const picks = getPersonalizedProducts(catalogue, [{ productId: "owned" }], 5);
    expect(picks.some((p) => p.id === "owned")).toBe(false);
  });

  it("matches an order line by title when it carries no product id", () => {
    const picks = getPersonalizedProducts(
      catalogue,
      [{ title: "Product owned" }],
      2,
    );

    expect(picks.map((p) => p.id)).toEqual(["zara-1", "zara-2"]);
  });

  it("tops up with best sellers when affinity alone cannot fill the rail", () => {
    const picks = getPersonalizedProducts(catalogue, [{ productId: "owned" }], 4);

    expect(picks).toHaveLength(4);
    expect(picks.slice(0, 2).map((p) => p.id)).toEqual(["zara-1", "zara-2"]);
    // Remaining slots come from what sells, without repeating a pick.
    expect(new Set(picks.map((p) => p.id)).size).toBe(4);
  });

  it("falls back to best sellers when past orders are all discontinued stock", () => {
    const picks = getPersonalizedProducts(
      catalogue,
      [{ productId: "no-longer-stocked" }],
      2,
    );

    expect(picks.map((p) => p.id)).toEqual(["owned", "nike-1"]);
  });

  it("weighs a repeat brand above a shared category", () => {
    const picks = getPersonalizedProducts(
      catalogue,
      // One Zara purchase, one Hoodies purchase.
      [{ productId: "owned" }, { productId: "asos-1" }],
      1,
    );

    // Zara scores 2 for the brand; a Hoodies match would score 1.
    expect(picks[0].brand).toBe("Zara");
  });
});
