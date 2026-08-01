export type NetworkErrorKind = "offline" | "rate_limited" | "server" | "unknown";

export class NetworkRequestError extends Error {
  constructor(
    message: string,
    public readonly kind: NetworkErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "NetworkRequestError";
  }
}

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const parseRetryAfterMilliseconds = (value: string | null) => {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
};

export const classifyNetworkError = (error: unknown): NetworkErrorKind => {
  if (error instanceof NetworkRequestError) return error.kind;
  const candidate = error as { status?: number; code?: string; message?: string };
  if (candidate?.status === 429 || candidate?.code === "429") return "rate_limited";
  if (candidate?.status && candidate.status >= 500) return "server";
  const message = String(candidate?.message ?? error ?? "").toLowerCase();
  if (/network request failed|failed to fetch|networkerror|offline|internet connection/.test(message)) return "offline";
  if (/rate.?limit|too many requests|throttl/.test(message)) return "rate_limited";
  return "unknown";
};

const messageForStatus = (status: number) => {
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The service is temporarily unavailable. Please try again.";
  return `Request failed (${status}).`;
};

interface RetryOptions<T> {
  fetchFn?: typeof fetch;
  sleepFn?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  shouldRetryPayload?: (payload: T) => boolean;
}

export async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  options: RetryOptions<T> = {},
): Promise<T> {
  const fetchFn = options.fetchFn ?? fetch;
  const sleepFn = options.sleepFn ?? defaultSleep;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 4);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetchFn(url, init);
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleepFn(Math.min(500 * 2 ** attempt, 4000));
        continue;
      }
      throw new NetworkRequestError(
        "You appear to be offline. Check your connection and try again.",
        "offline",
      );
    }

    let payload: T;
    try {
      payload = (await response.json()) as T;
    } catch {
      payload = {} as T;
    }

    const retryable =
      response.status === 429 ||
      response.status >= 500 ||
      options.shouldRetryPayload?.(payload) === true;
    if (retryable && attempt < maxAttempts - 1) {
      const retryAfter = parseRetryAfterMilliseconds(response.headers.get("Retry-After"));
      await sleepFn(retryAfter ?? Math.min(500 * 2 ** attempt, 4000));
      continue;
    }

    if (!response.ok || retryable) {
      throw new NetworkRequestError(
        messageForStatus(response.status || 503),
        response.status === 429 || options.shouldRetryPayload?.(payload)
          ? "rate_limited"
          : response.status >= 500
            ? "server"
            : "unknown",
        response.status,
      );
    }
    return payload;
  }

  throw new NetworkRequestError("Request failed after retries.", "unknown");
}
