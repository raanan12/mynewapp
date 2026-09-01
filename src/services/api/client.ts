import { env } from '@/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Abort the request after this many milliseconds. */
  timeoutMs?: number;
};

/**
 * Thin fetch wrapper: base URL, JSON encoding/decoding, timeouts and a typed error.
 * Feature-specific calls belong in sibling modules that use this.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = 15_000, headers, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? null : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : undefined;

    if (!response.ok) {
      throw new ApiError(`Request to ${path} failed`, response.status, payload);
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
};
