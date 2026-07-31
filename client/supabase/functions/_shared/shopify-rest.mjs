export const SHOPIFY_REST_PAGE_SIZE = 250;

const defaultSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const parseRetryAfterMilliseconds = (value) => {
  const seconds = Number(value ?? "");
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
};

const getBucketUsage = (value) => {
  const [used, capacity] = String(value ?? "")
    .split("/")
    .map(Number);
  return Number.isFinite(used) && Number.isFinite(capacity) && capacity > 0
    ? used / capacity
    : 0;
};

export async function fetchShopifyJson({
  url,
  accessToken,
  resource,
  fetchFn = fetch,
  sleepFn = defaultSleep,
  maxAttempts = 6,
}) {
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchFn(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
    lastStatus = response.status;

    if (response.ok) {
      const bucketUsage = getBucketUsage(
        response.headers.get("X-Shopify-Shop-Api-Call-Limit"),
      );
      if (bucketUsage >= 0.85) {
        await sleepFn(500);
      }
      return await response.json();
    }

    lastBody = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === maxAttempts - 1) break;

    const retryAfter = parseRetryAfterMilliseconds(
      response.headers.get("Retry-After"),
    );
    const exponentialBackoff = Math.min(500 * 2 ** attempt, 8000);
    await sleepFn(retryAfter ?? exponentialBackoff);
  }

  throw new Error(
    `Shopify API error (${resource}) (${lastStatus}): ${lastBody || "Request failed after retries"}`,
  );
}

export async function fetchAllShopifyRestResources({
  storeDomain,
  apiVersion,
  accessToken,
  resource,
  collectionKey,
  configureUrl,
  fetchFn = fetch,
  sleepFn = defaultSleep,
}) {
  const resources = [];
  let sinceId;

  while (true) {
    const url = new URL(
      `https://${storeDomain}/admin/api/${apiVersion}/${resource}.json`,
    );
    url.searchParams.set("limit", String(SHOPIFY_REST_PAGE_SIZE));
    if (sinceId !== undefined) url.searchParams.set("since_id", String(sinceId));
    configureUrl?.(url);

    const data = await fetchShopifyJson({
      url,
      accessToken,
      resource,
      fetchFn,
      sleepFn,
    });
    const batch = Array.isArray(data?.[collectionKey])
      ? data[collectionKey]
      : [];
    resources.push(...batch);

    if (batch.length < SHOPIFY_REST_PAGE_SIZE) break;
    const nextSinceId = batch.at(-1)?.id;
    if (nextSinceId === undefined || nextSinceId === sinceId) {
      throw new Error(`Shopify ${resource} pagination did not advance`);
    }
    sinceId = nextSinceId;
  }

  return resources;
}
