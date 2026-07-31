import type { BagItem } from "@/stores/bagStore";

const SHOPIFY_API_VERSION = "2026-07";
const storeDomain = (process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "")
  .trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const storefrontAccessToken =
  process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim() ?? "";

export interface ShopifyDeliveryOption {
  groupId: string;
  handle: string;
  title: string;
  description?: string;
  amount: number;
  currencyCode: string;
}

export interface ShopifyCheckoutSession {
  cartId: string;
  checkoutUrl: string;
  deliveryOptions: ShopifyDeliveryOption[];
}

interface CheckoutAddress {
  firstName?: string;
  lastName?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip?: string;
  countryCode: string;
  phone?: string;
}

const NIGERIA_PROVINCE_CODES: Record<string, string> = {
  abia: "AB",
  adamawa: "AD",
  "akwa ibom": "AK",
  anambra: "AN",
  bauchi: "BA",
  bayelsa: "BY",
  benue: "BE",
  borno: "BO",
  "cross river": "CR",
  delta: "DE",
  ebonyi: "EB",
  edo: "ED",
  ekiti: "EK",
  enugu: "EN",
  "federal capital territory": "FC",
  fct: "FC",
  abuja: "FC",
  gombe: "GO",
  imo: "IM",
  jigawa: "JI",
  kaduna: "KD",
  kano: "KN",
  katsina: "KT",
  kebbi: "KE",
  kogi: "KO",
  kwara: "KW",
  lagos: "LA",
  nasarawa: "NA",
  niger: "NI",
  ogun: "OG",
  ondo: "ON",
  osun: "OS",
  oyo: "OY",
  plateau: "PL",
  rivers: "RI",
  sokoto: "SO",
  taraba: "TA",
  yobe: "YO",
  zamfara: "ZA",
};

const toProvinceCode = (countryCode: string, province?: string) => {
  const value = province?.trim();
  if (!value) return undefined;
  if (countryCode !== "NG") return value;
  const normalized = value.toLowerCase().replace(/\s+state$/, "").trim();
  return NIGERIA_PROVINCE_CODES[normalized] ?? value.toUpperCase();
};

export const CREATE_CART = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
      warnings { message }
    }
  }
`;

export const ADD_DELIVERY_ADDRESS = `
  mutation AddDeliveryAddress($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
      cart {
        id checkoutUrl
        deliveryGroups(first: 10) {
          nodes {
            id
            deliveryOptions {
              handle title description
              estimatedCost { amount currencyCode }
            }
          }
        }
      }
      userErrors { field message }
      warnings { message }
    }
  }
`;

export const SELECT_DELIVERY_OPTION = `
  mutation SelectDeliveryOption($cartId: ID!, $selectedDeliveryOptions: [CartSelectedDeliveryOptionInput!]!) {
    cartSelectedDeliveryOptionsUpdate(cartId: $cartId, selectedDeliveryOptions: $selectedDeliveryOptions) {
      cart { id checkoutUrl }
      userErrors { field message }
      warnings { message }
    }
  }
`;

const requestStorefront = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
  if (!storeDomain) {
    throw new Error("Shopify store domain is not configured.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (storefrontAccessToken) {
    headers["X-Shopify-Storefront-Access-Token"] = storefrontAccessToken;
  }
  const response = await fetch(`https://${storeDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.map((error: { message?: string }) => error.message).join("; ") || `Shopify request failed (${response.status})`);
  }
  return payload.data as T;
};

const throwUserErrors = (errors?: Array<{ message: string }>) => {
  if (errors?.length) throw new Error(errors.map((error) => error.message).join("; "));
};

export const toShopifyVariantGid = (variantId?: string) => {
  const value = String(variantId ?? "").trim();
  if (value.startsWith("gid://shopify/ProductVariant/")) return value;
  return /^\d+$/.test(value) ? `gid://shopify/ProductVariant/${value}` : "";
};

export const createShopifyCheckout = async ({ items, email, phone, address, customerAccessToken }: {
  items: BagItem[];
  email?: string;
  phone?: string;
  address: CheckoutAddress;
  customerAccessToken?: string;
}): Promise<ShopifyCheckoutSession> => {
  const lines = items.map((item) => ({
    merchandiseId: toShopifyVariantGid(item.variantId),
    quantity: item.quantity,
  }));
  if (lines.length === 0 || lines.some((line) => !line.merchandiseId)) {
    throw new Error("One or more bag items are not linked to a Shopify product variant. Refresh the catalogue and add the items again.");
  }

  const created = await requestStorefront<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(CREATE_CART, {
    input: {
      lines,
      buyerIdentity: {
        countryCode: address.countryCode,
        email: email || undefined,
        phone: phone || undefined,
        customerAccessToken: customerAccessToken || undefined,
      },
      attributes: [{ key: "source", value: "house-of-shirts-mobile" }],
    },
  });
  throwUserErrors(created.cartCreate.userErrors);
  if (!created.cartCreate.cart) throw new Error("Shopify did not create a cart.");

  const withAddress = await requestStorefront<{
    cartDeliveryAddressesAdd: {
      cart: {
        id: string;
        checkoutUrl: string;
        deliveryGroups: {
          nodes: Array<{
            id: string;
            deliveryOptions: Array<{
              handle: string;
              title?: string;
              description?: string;
              estimatedCost: { amount: string; currencyCode: string };
            }>;
          }>;
        };
      } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(ADD_DELIVERY_ADDRESS, {
    cartId: created.cartCreate.cart.id,
    addresses: [{
      selected: true,
      address: {
        deliveryAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          provinceCode: toProvinceCode(address.countryCode, address.province),
          zip: address.zip,
          countryCode: address.countryCode,
          phone: address.phone,
        },
      },
      oneTimeUse: true,
    }],
  });
  throwUserErrors(withAddress.cartDeliveryAddressesAdd.userErrors);
  const cart = withAddress.cartDeliveryAddressesAdd.cart;
  if (!cart) throw new Error("Shopify could not calculate delivery for this address.");

  return {
    cartId: cart.id,
    checkoutUrl: cart.checkoutUrl,
    deliveryOptions: cart.deliveryGroups.nodes.flatMap((group) =>
      group.deliveryOptions.map((option) => ({
        groupId: group.id,
        handle: option.handle,
        title: option.title || "Shipping",
        description: option.description,
        amount: Number(option.estimatedCost.amount),
        currencyCode: option.estimatedCost.currencyCode,
      })),
    ),
  };
};

export const selectShopifyDeliveryOption = async (
  cartId: string,
  option: ShopifyDeliveryOption,
) => {
  const result = await requestStorefront<{
    cartSelectedDeliveryOptionsUpdate: {
      cart: { checkoutUrl: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(SELECT_DELIVERY_OPTION, {
    cartId,
    selectedDeliveryOptions: [{
      deliveryGroupId: option.groupId,
      deliveryOptionHandle: option.handle,
    }],
  });
  throwUserErrors(result.cartSelectedDeliveryOptionsUpdate.userErrors);
  if (!result.cartSelectedDeliveryOptionsUpdate.cart) {
    throw new Error("Shopify could not select that delivery option.");
  }
  return result.cartSelectedDeliveryOptionsUpdate.cart.checkoutUrl;
};

export const hasShopifyStorefrontConfig = () =>
  Boolean(storeDomain);
