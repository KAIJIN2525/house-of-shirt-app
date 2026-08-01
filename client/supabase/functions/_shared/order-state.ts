/**
 * Canonical mapping from a Shopify order payload to the app's order state.
 *
 * The webhook, the admin refresh, and the scheduled sync all write the same
 * `orders` rows. They previously each carried their own copy of this logic and
 * had drifted: the webhook and admin refresh understood cancellations while the
 * scheduled sync reduced everything to Delivered/Processing, so an hourly sync
 * could reset a cancelled order back to Processing. None of them reflected
 * refunds at all.
 *
 * Keeping the mapping here means the three writers cannot disagree about what a
 * given Shopify payload means.
 */

export interface ShopifyOrderState {
  cancelled_at?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
}

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

/**
 * Customer-facing order status.
 *
 * Cancellation wins over everything. A refund is reported ahead of fulfilment
 * because it is the more consequential fact for the customer: a delivered order
 * that was later refunded should not keep reading as merely "Delivered".
 */
export const getOrderStatus = (order: ShopifyOrderState): string => {
  if (order.cancelled_at) return "Cancelled";

  const financial = normalize(order.financial_status);
  if (financial === "refunded") return "Refunded";
  if (financial === "partially_refunded") return "Partially Refunded";

  const fulfillment = normalize(order.fulfillment_status);
  if (fulfillment === "fulfilled") return "Delivered";
  if (fulfillment === "partial") return "Shipped";

  return "Processing";
};

/**
 * Physical progress of the shipment.
 *
 * Deliberately ignores refunds: money moving back does not change where the
 * parcel got to, and the app renders this on a delivery timeline.
 */
export const getLogisticsMilestone = (order: ShopifyOrderState): string => {
  if (order.cancelled_at) return "Cancelled";

  const fulfillment = normalize(order.fulfillment_status);
  if (fulfillment === "fulfilled") return "Delivered";
  if (fulfillment === "partial") return "Shipped";

  return "Processing";
};
