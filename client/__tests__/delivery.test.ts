import {
  getDeliveryPromise,
  getLagosDeliveryPromise,
  getWatHour,
  isLagosAddress,
} from "@/lib/delivery";

// 11:30 and 12:30 West Africa Time (UTC+1) on the same day.
const beforeCutoff = new Date("2026-08-03T10:30:00.000Z");
const afterCutoff = new Date("2026-08-03T11:30:00.000Z");

describe("getWatHour", () => {
  it("reads the hour in West Africa Time, not UTC", () => {
    expect(getWatHour(beforeCutoff)).toBe(11);
    expect(getWatHour(afterCutoff)).toBe(12);
  });

  it("rolls into the next WAT day just before midnight UTC", () => {
    expect(getWatHour(new Date("2026-08-03T23:30:00.000Z"))).toBe(0);
  });
});

describe("isLagosAddress", () => {
  it("matches the city or the state", () => {
    expect(isLagosAddress("Lekki", "Lagos")).toBe(true);
    expect(isLagosAddress("Lagos Island", "Lagos")).toBe(true);
    expect(isLagosAddress("Ibadan", "Oyo")).toBe(false);
    expect(isLagosAddress(undefined, null)).toBe(false);
  });
});

describe("getLagosDeliveryPromise", () => {
  it("promises same-day before the midday cut-off", () => {
    expect(getLagosDeliveryPromise(beforeCutoff)).toBe(
      "Same-day delivery for orders placed before 12:00 PM",
    );
  });

  it("promises next-day from the cut-off onwards", () => {
    expect(getLagosDeliveryPromise(afterCutoff)).toBe(
      "Next-day delivery for orders placed after 12:00 PM",
    );
  });
});

describe("getDeliveryPromise", () => {
  it("uses the house cut-off for Lagos addresses, ignoring the carrier quote", () => {
    expect(
      getDeliveryPromise({
        city: "Lagos",
        state: "Lagos",
        quotedDuration: "Delivery in 1-2 days",
        now: beforeCutoff,
      }),
    ).toBe("Same-day delivery for orders placed before 12:00 PM");
  });

  it("falls back to the Shopify quote outside Lagos", () => {
    expect(
      getDeliveryPromise({
        city: "Ibadan",
        state: "Oyo",
        quotedDuration: "Delivery in 3-5 business days",
        now: beforeCutoff,
      }),
    ).toBe("Delivery in 3-5 business days");
  });

  it("stays vague rather than inventing a window when nothing is quoted", () => {
    expect(getDeliveryPromise({ city: "Ibadan", state: "Oyo" })).toBe(
      "Delivery timeframe confirmed at checkout",
    );
  });
});
