import {
  getLogisticsMilestone,
  getOrderStatus,
} from "../supabase/functions/_shared/order-state";

describe("getOrderStatus", () => {
  it("reports cancellation ahead of fulfilment", () => {
    // A cancelled order can still carry a fulfilment status from before it was
    // cancelled; cancellation is the fact that matters.
    expect(
      getOrderStatus({
        cancelled_at: "2026-07-30T10:00:00Z",
        fulfillment_status: "fulfilled",
        financial_status: "paid",
      }),
    ).toBe("Cancelled");
  });

  it("reports refunds ahead of fulfilment", () => {
    expect(
      getOrderStatus({
        financial_status: "refunded",
        fulfillment_status: "fulfilled",
      }),
    ).toBe("Refunded");
  });

  it("distinguishes a partial refund from a full one", () => {
    expect(getOrderStatus({ financial_status: "partially_refunded" })).toBe(
      "Partially Refunded",
    );
  });

  it("maps fulfilment states", () => {
    expect(getOrderStatus({ fulfillment_status: "fulfilled" })).toBe("Delivered");
    expect(getOrderStatus({ fulfillment_status: "partial" })).toBe("Shipped");
  });

  it("falls back to Processing for a paid, unfulfilled order", () => {
    expect(
      getOrderStatus({ financial_status: "paid", fulfillment_status: null }),
    ).toBe("Processing");
  });

  it("treats missing fields as Processing rather than throwing", () => {
    expect(getOrderStatus({})).toBe("Processing");
  });

  it("is insensitive to casing and padding from the Shopify payload", () => {
    expect(getOrderStatus({ financial_status: "  REFUNDED " })).toBe("Refunded");
    expect(getOrderStatus({ fulfillment_status: "Fulfilled" })).toBe("Delivered");
  });
});

describe("getLogisticsMilestone", () => {
  it("ignores refunds, because a refund does not move the parcel", () => {
    // This is the key difference from getOrderStatus: a delivered order that was
    // later refunded is still, physically, delivered.
    expect(
      getLogisticsMilestone({
        financial_status: "refunded",
        fulfillment_status: "fulfilled",
      }),
    ).toBe("Delivered");
  });

  it("still reports cancellation", () => {
    expect(getLogisticsMilestone({ cancelled_at: "2026-07-30T10:00:00Z" })).toBe(
      "Cancelled",
    );
  });

  it("maps partial fulfilment to Shipped", () => {
    expect(getLogisticsMilestone({ fulfillment_status: "partial" })).toBe(
      "Shipped",
    );
  });

  it("defaults to Processing", () => {
    expect(getLogisticsMilestone({})).toBe("Processing");
  });
});

describe("regression: writers agree on the same payload", () => {
  // shopify-sync previously reduced every order to Delivered/Processing, so an
  // hourly bulk sync could reset a cancelled order that the webhook had already
  // applied. All three writers now share this mapping.
  it("does not flatten a cancelled order to Processing", () => {
    const cancelled = {
      cancelled_at: "2026-07-30T10:00:00Z",
      fulfillment_status: null,
      financial_status: "voided",
    };

    expect(getOrderStatus(cancelled)).toBe("Cancelled");
    expect(getLogisticsMilestone(cancelled)).toBe("Cancelled");
  });
});
