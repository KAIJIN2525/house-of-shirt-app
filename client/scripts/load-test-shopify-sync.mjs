import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  fetchAllShopifyRestResources,
  SHOPIFY_REST_PAGE_SIZE,
} from "../supabase/functions/_shared/shopify-rest.mjs";

const scenarios = [
  { resource: "products", count: 12_500 },
  { resource: "customers", count: 15_000 },
  { resource: "orders", count: 25_000 },
];
const source = new Map(
  scenarios.map(({ resource, count }) => [
    resource,
    Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      title: `${resource}-${index + 1}`,
      line_items:
        resource === "orders"
          ? Array.from({ length: 4 }, (__, itemIndex) => ({
              id: (index + 1) * 10 + itemIndex,
              quantity: 1,
            }))
          : undefined,
    })),
  ]),
);

let requestCount = 0;
let retryCount = 0;
const throttledRequests = new Set();
const fakeFetch = async (url) => {
  requestCount += 1;
  const parsed = new URL(url);
  const resource = parsed.pathname.split("/").at(-1).replace(".json", "");
  const sinceId = Number(parsed.searchParams.get("since_id") ?? 0);
  const requestKey = `${resource}:${sinceId}`;

  if (requestCount % 31 === 0 && !throttledRequests.has(requestKey)) {
    throttledRequests.add(requestKey);
    retryCount += 1;
    return new Response("rate limited", {
      status: 429,
      headers: { "Retry-After": "0" },
    });
  }

  const rows = source.get(resource) ?? [];
  const batch = rows.slice(sinceId, sinceId + SHOPIFY_REST_PAGE_SIZE);
  return Response.json(
    { [resource]: batch },
    { headers: { "X-Shopify-Shop-Api-Call-Limit": "35/40" } },
  );
};

const startHeap = process.memoryUsage().heapUsed;
const startedAt = performance.now();
let processed = 0;

for (const scenario of scenarios) {
  const rows = await fetchAllShopifyRestResources({
    storeDomain: "load-test.myshopify.com",
    apiVersion: "2026-07",
    accessToken: "not-a-real-token",
    resource: scenario.resource,
    collectionKey: scenario.resource,
    fetchFn: fakeFetch,
    sleepFn: async () => {},
  });
  assert.equal(rows.length, scenario.count, `${scenario.resource} count`);
  assert.equal(new Set(rows.map((row) => row.id)).size, scenario.count);
  processed += rows.length;
}

const elapsedMs = performance.now() - startedAt;
const heapGrowthMb =
  (process.memoryUsage().heapUsed - startHeap) / 1024 / 1024;
assert.ok(retryCount > 0, "Expected simulated 429 responses");
assert.ok(elapsedMs < 5_000, `Benchmark exceeded 5 seconds: ${elapsedMs}ms`);
assert.ok(heapGrowthMb < 128, `Heap growth exceeded 128MB: ${heapGrowthMb}MB`);

console.log(
  JSON.stringify(
    {
      passed: true,
      processed,
      orderLineItems: 100_000,
      requests: requestCount,
      simulated429Retries: retryCount,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      heapGrowthMb: Number(heapGrowthMb.toFixed(2)),
    },
    null,
    2,
  ),
);
