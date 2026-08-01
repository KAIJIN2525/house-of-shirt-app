import AsyncStorage from "@react-native-async-storage/async-storage";
import { classifyNetworkError, NetworkErrorKind } from "@/services/network";
import {
  Product,
  ProductSizeOption,
  ProductVariant,
} from "@/constants/products";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  hasLoaded: boolean;
  errorKind: NetworkErrorKind | null;
  errorMessage: string | null;
  isStale: boolean;
  fetchProducts: () => Promise<void>;
  getProductById: (productId?: string) => Product | undefined;
  getBestSellingProducts: (limit?: number) => Product[];
  importShopifyProducts: (incomingProducts: Product[]) => Promise<number>;
}

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400";

const normalizeProduct = (product: Product): Product => ({
  ...product,
  images:
    product.images && product.images.length > 0
      ? product.images
      : [product.image].filter(Boolean),
  sizes: product.sizes ?? [],

  colors: product.colors ?? ["Default"],
});

const stripHtml = (value?: string | null) =>
  (value ?? "").replace(/<[^>]*>?/gm, "").trim();

const getOptionValues = (
  options: any[] | null | undefined,
  optionName: string,
) => {
  const match = options?.find(
    (option) =>
      typeof option?.name === "string" &&
      option.name.toLowerCase() === optionName.toLowerCase(),
  );

  return Array.isArray(match?.values) && match.values.length > 0
    ? match.values.filter(Boolean)
    : undefined;
};

const findOption = (
  options: any[] | null | undefined,
  optionNames: string[],
) => {
  const normalizedNames = optionNames.map((name) => name.toLowerCase());

  return options?.find(
    (option) =>
      typeof option?.name === "string" &&
      normalizedNames.includes(option.name.toLowerCase()),
  );
};

const getVariantOptionValue = (variant: any, position?: number) => {
  if (!position) {
    return undefined;
  }

  return variant?.[`option${position}`];
};

const getVariantInventory = (variant: any) => {
  const parsed = Number(
    variant?.inventory_quantity ?? variant?.inventoryQuantity ?? 0,
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildVariants = (
  options: any[] | null | undefined,
  variants: any[] | null | undefined,
): ProductVariant[] => {
  const productOptions = Array.isArray(options) ? options : [];
  return (Array.isArray(variants) ? variants : [])
    .filter((variant) => variant?.id)
    .map((variant) => {
      const inventoryQuantity = getVariantInventory(variant);
      const selectedOptions = productOptions
        .map((option, index) => ({
          name: String(option?.name ?? `Option ${index + 1}`),
          value: String(
            variant?.[`option${Number(option?.position ?? index + 1)}`] ?? "",
          ),
        }))
        .filter((option) => option.value);
      return {
        id: String(variant.id),
        title: String(
          variant.title ??
            selectedOptions.map((option) => option.value).join(" / ") ??
            "Default",
        ),
        price: Number(variant.price ?? 0),
        available:
          variant.available === true ||
          variant.availableForSale === true ||
          variant.inventory_policy === "continue" ||
          variant.inventory_management == null ||
          inventoryQuantity > 0,
        inventoryQuantity,
        selectedOptions,
        image:
          variant.image?.src ??
          variant.image?.url ??
          variant.featuredImage?.url ??
          undefined,
      };
    });
};

const buildSizeOptions = (
  options: any[] | null | undefined,
  variants: any[] | null | undefined,
): ProductSizeOption[] => {
  const sizeOption = findOption(options, [
    "size",
    "shoe size",
    "eu size",
    "us size",
    "uk size",
  ]);
  const values: string[] = Array.isArray(sizeOption?.values)
    ? sizeOption.values.filter(Boolean).map(String)
    : [];

  if (values.length === 0) {
    return [];
  }

  const position = Number(sizeOption?.position ?? 1);
  const variantRows = Array.isArray(variants) ? variants : [];

  return values.map((value) => {
    const matchingVariants = variantRows.filter(
      (variant) =>
        String(getVariantOptionValue(variant, position) ?? "").toLowerCase() ===
        value.toLowerCase(),
    );
    const inventoryQuantity = matchingVariants.reduce(
      (sum, variant) => sum + getVariantInventory(variant),
      0,
    );
    const hasExplicitAvailability = matchingVariants.some(
      (variant) =>
        variant?.available === true ||
        variant?.availableForSale === true ||
        variant?.inventory_policy === "continue" ||
        variant?.inventory_management == null,
    );

    return {
      value,
      available:
        inventoryQuantity > 0 ||
        (inventoryQuantity === 0 && hasExplicitAvailability),
      inventoryQuantity,
      variantId: matchingVariants[0]?.id
        ? String(matchingVariants[0].id)
        : undefined,
    };
  });
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,
      hasLoaded: false,
      errorKind: null,
      errorMessage: null,
      isStale: false,

      fetchProducts: async () => {
        if (get().isLoading) {
          await new Promise<void>((resolve) => {
            const unsubscribe = useProductsStore.subscribe((state) => {
              if (!state.isLoading) {
                unsubscribe();
                resolve();
              }
            });

            if (!useProductsStore.getState().isLoading) {
              unsubscribe();
              resolve();
            }
          });
          return;
        }

        set({ isLoading: true, errorKind: null, errorMessage: null });
        try {
          const { supabase } = await import("@/lib/supabase");

          let allData: any[] = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data, error } = await supabase
              .from("products")
              .select("*")
              .or("status.eq.active,status.is.null")
              .order("updated_at", { ascending: false })
              .range(from, from + pageSize - 1);

            if (error) throw error;
            if (data && data.length > 0) {
              allData = [...allData, ...data];
              if (data.length < pageSize) {
                hasMore = false;
              } else {
                from += pageSize;
              }
            } else {
              hasMore = false;
            }
          }

          const data = allData;

          const mappedProducts: Product[] = (data ?? []).map((product: any) => {
            const firstVariant = Array.isArray(product.variants)
              ? product.variants[0]
              : undefined;
            const sizeOptions = buildSizeOptions(
              product.options,
              product.variants,
            );
            const variants = buildVariants(product.options, product.variants);
            const rawImages = Array.isArray(product.images)
              ? product.images
              : [];
            const images = [
              product.image_url,
              ...rawImages.map((img: any) =>
                typeof img === "string" ? img : img?.src,
              ),
            ].filter(Boolean);
            const uniqueImages = Array.from(new Set(images));

            const derivedDescription =
              stripHtml(product.description) ||
              stripHtml(product.body_html) ||
              stripHtml(product.metadata?.body_html) ||
              "Premium quality essential from House of Shirts.";

            return normalizeProduct({
              id: String(product.shopify_id ?? product.id),
              name: product.title ?? "Untitled Product",
              image:
                product.image_url || uniqueImages[0] || DEFAULT_PRODUCT_IMAGE,
              images:
                uniqueImages.length > 0
                  ? uniqueImages
                  : [DEFAULT_PRODUCT_IMAGE],
              variantId: firstVariant?.id ? String(firstVariant.id) : undefined,
              variants,

              price: Number(
                product.price ??
                  firstVariant?.price ??
                  product.metadata?.price ??
                  0,
              ),
              category: product.product_type || "Shirts",
              brand: product.vendor || "House of Shirts",
              rating: Number(product.metadata?.rating ?? 5),
              description: derivedDescription,
              sizes:
                sizeOptions.length > 0
                  ? sizeOptions.map((option) => option.value)
                  : (getOptionValues(product.options, "size") ??
                    getOptionValues(product.options, "shoe size") ??
                    getOptionValues(product.options, "eu size") ??
                    getOptionValues(product.options, "us size") ??
                    getOptionValues(product.options, "uk size") ??
                    []),
              sizeOptions,
              colors:
                getOptionValues(product.options, "color") ??
                getOptionValues(product.options, "colour") ??
                [],
              salesCount: Number(product.sales_count ?? 0),
            });
          });

          set({
            products: mappedProducts,
            hasLoaded: true,
            errorKind: null,
            errorMessage: null,
            isStale: false,
          });
        } catch (error) {
          console.error("Error fetching products:", error);
          const errorKind = classifyNetworkError(error);
          const errorMessage =
            errorKind === "offline"
              ? "You are offline. Showing your last saved catalogue."
              : errorKind === "rate_limited"
                ? "The catalogue is receiving too many requests. Please wait a moment before retrying."
                : "We could not refresh the catalogue. Showing saved products when available.";
          set((state) => ({
            hasLoaded: true,
            errorKind,
            errorMessage,
            isStale: state.products.length > 0,
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      getProductById: (productId) =>
        get().products.find((product) => product.id === productId),

      getBestSellingProducts: (limit = 10) => {
        const sorted = [...get().products].sort((a, b) => {
          // Primary sort: salesCount
          if ((b.salesCount || 0) !== (a.salesCount || 0)) {
            return (b.salesCount || 0) - (a.salesCount || 0);
          }
          // Secondary sort fallback: rating
          return (b.rating || 0) - (a.rating || 0);
        });
        return sorted.slice(0, limit);
      },

      importShopifyProducts: async (incomingProducts) => {
        let createdCount = 0;
        const next = [...get().products];

        incomingProducts.forEach((incomingProduct) => {
          const normalizedIncoming = normalizeProduct(incomingProduct);
          const existingIndex = next.findIndex(
            (product) => product.id === normalizedIncoming.id,
          );

          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...next[existingIndex],
              ...normalizedIncoming,
            };
            return;
          }

          createdCount += 1;
          next.unshift(normalizedIncoming);
        });

        set({
          products: next,
          hasLoaded: true,
          errorKind: null,
          errorMessage: null,
          isStale: false,
        });
        return createdCount;
      },
    }),
    {
      name: "@products",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        hasLoaded: state.hasLoaded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.errorKind = null;
          state.errorMessage = null;
          state.isStale = false;
          state.products = state.products.map(normalizeProduct);
        }
      },
    },
  ),
);
