/**
 * Customer-facing delivery promises.
 *
 * Lagos is served by our own riders on a midday cut-off, so its promise is a
 * fixed house rule rather than a carrier estimate. Everywhere else goes through
 * GIGL/DHL, where the only trustworthy figure is the live rate description
 * Shopify returns for the address.
 */

/** Orders placed before this hour (West Africa Time) still go out today. */
export const LAGOS_SAME_DAY_CUTOFF_HOUR = 12;

/**
 * Nigeria is UTC+1 all year, with no daylight saving. The cut-off is evaluated
 * against that offset instead of the device clock so a phone left on another
 * timezone -- or a traveller ordering for a Lagos address -- cannot shift the
 * customer's cut-off.
 */
const WAT_OFFSET_MINUTES = 60;

export const getWatHour = (date: Date) =>
  new Date(date.getTime() + WAT_OFFSET_MINUTES * 60_000).getUTCHours();

export const isLagosAddress = (...values: (string | null | undefined)[]) =>
  values.some(
    (value) => typeof value === "string" && value.toLowerCase().includes("lagos"),
  );

export const getLagosDeliveryPromise = (now: Date = new Date()) =>
  getWatHour(now) < LAGOS_SAME_DAY_CUTOFF_HOUR
    ? "Same-day delivery for orders placed before 12:00 PM"
    : "Next-day delivery for orders placed after 12:00 PM";

export interface DeliveryPromiseInput {
  city?: string | null;
  state?: string | null;
  /** Rate description quoted by Shopify for this address, when one is known. */
  quotedDuration?: string | null;
  now?: Date;
}

/**
 * The one line shown against the shipping address. Falls back to the Shopify
 * quote outside Lagos, and says nothing specific when there is no quote yet --
 * an invented window is worse than none.
 */
export const getDeliveryPromise = ({
  city,
  state,
  quotedDuration,
  now,
}: DeliveryPromiseInput) => {
  if (isLagosAddress(city, state)) {
    return getLagosDeliveryPromise(now);
  }

  return quotedDuration?.trim() || "Delivery timeframe confirmed at checkout";
};
