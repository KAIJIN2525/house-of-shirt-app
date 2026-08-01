import { toShopifyVariantGid } from "@/services/shopify-storefront";

describe("Shopify Storefront identifiers", () => {
  it("converts numeric variant IDs to Shopify GIDs", () => {
    expect(toShopifyVariantGid("123456")).toBe("gid://shopify/ProductVariant/123456");
  });

  it("preserves valid variant GIDs", () => {
    const gid = "gid://shopify/ProductVariant/987";
    expect(toShopifyVariantGid(gid)).toBe(gid);
  });

  it.each([undefined, "", "variant-123", "gid://shopify/Product/123"])("rejects invalid variant identifier %p", (variantId) => {
    expect(toShopifyVariantGid(variantId)).toBe("");
  });
});
