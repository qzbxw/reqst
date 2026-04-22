import type {
  APIKey,
  APIKeyListResponse,
  AdminInvoiceListResponse,
  AdminBillingCheckoutResponse,
  AdminOverviewResponse,
  DeveloperUsageResponse,
  Invoice,
  InvoiceListResponse,
  MeResponse,
  Wallet,
  WalletListResponse,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookDeliveryListResponse,
  WebhookListResponse,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "reqst_token";
const ADMIN_TOKEN_KEY = "reqst_admin_token";

export function getApiBase() {
  return API_BASE;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function authenticateTelegram(payload: { init_data?: string; widget_data?: string; telegram_id?: number; username?: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestTelegramLoginCode(payload: { username: string }) {
  return request<{ ok: boolean }>("/api/auth/telegram/request-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginWithTelegramCode(payload: { username: string; code: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/telegram/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string) {
  return request<MeResponse>("/api/me", {}, token);
}

export async function updateContactEmail(token: string, payload: { email: string }) {
  return request<{ seller: MeResponse["seller"] }>("/api/me/contact-email", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchWallets(token: string) {
  return request<WalletListResponse>("/api/wallets", {}, token);
}

export async function createWallet(token: string, payload: { network: string; address: string }) {
  return request<Wallet>("/api/wallets", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteWallet(token: string, walletId: number) {
  return request<void>(`/api/wallets/${walletId}`, { method: "DELETE" }, token);
}

export async function fetchInvoices(token: string) {
  return request<InvoiceListResponse>("/api/invoices?page=1&page_size=50", {}, token);
}

export async function createInvoice(token: string, payload: {
  title: string;
  base_amount_usd: string;
  payable_network: string;
  expires_in_minutes: number;
}) {
  return request<Invoice>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function createBillingCheckout(token: string, payload: {
  payable_network: string;
  plan_code?: string;
}) {
  return request<Invoice>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchDeveloperUsage(token: string) {
  return request<DeveloperUsageResponse>("/api/developer/usage", {}, token);
}

export async function fetchAPIKeys(token: string) {
  return request<APIKeyListResponse>("/api/developer/api-keys", {}, token);
}

export async function createAPIKey(token: string, payload: { label: string; scopes?: string[] }) {
  return request<{ api_key: APIKey; secret: string }>("/api/developer/api-keys", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function createTestAPIKey(token: string, payload: { label: string; scopes?: string[] }) {
  return request<{ api_key: APIKey; secret: string }>("/api/developer/api-keys", {
    method: "POST",
    body: JSON.stringify({ ...payload, mode: "test" }),
  }, token);
}

export async function deleteAPIKey(token: string, keyId: number) {
  return request<void>(`/api/developer/api-keys/${keyId}`, { method: "DELETE" }, token);
}

export async function fetchWebhookEndpoints(token: string) {
  return request<WebhookListResponse>("/api/developer/webhooks", {}, token);
}

export async function createWebhookEndpoint(token: string, payload: { label: string; url: string }) {
  return request<{ webhook: WebhookEndpoint }>("/api/developer/webhooks", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteWebhookEndpoint(token: string, endpointId: number) {
  return request<void>(`/api/developer/webhooks/${endpointId}`, { method: "DELETE" }, token);
}

export async function fetchWebhookDeliveries(token: string) {
  return request<WebhookDeliveryListResponse>("/api/developer/webhook-deliveries?limit=50", {}, token);
}

export async function resendWebhookDelivery(token: string, deliveryId: number) {
  return request<{ delivery: WebhookDelivery }>(`/api/developer/webhook-deliveries/${deliveryId}/resend`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function simulateTestPayment(apiKey: string, invoiceId: number) {
  return request<Invoice>(`/v1/test/invoices/${invoiceId}/simulate-payment`, {
    method: "POST",
    body: JSON.stringify({}),
  }, apiKey);
}

export async function cancelInvoice(token: string, invoiceId: number) {
  return request<Invoice>(`/api/invoices/${invoiceId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function markInvoicePaid(token: string, invoiceId: number) {
  return request<Invoice>(`/api/invoices/${invoiceId}/mark-paid`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function fetchPublicInvoice(publicId: string) {
  return request<Invoice>(`/api/public/invoices/${publicId}`);
}

export async function loginAdmin(payload: { username: string; password: string }) {
  return request<{ token: string; username: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminOverview(token: string) {
  return request<AdminOverviewResponse>("/api/admin/overview", {}, token);
}

export async function fetchAdminInvoices(token: string, params: {
  page?: number;
  page_size?: number;
  status?: string;
  kind?: string;
  query?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) {
    search.set("page", String(params.page));
  }
  if (params.page_size) {
    search.set("page_size", String(params.page_size));
  }
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.kind && params.kind !== "all") {
    search.set("kind", params.kind);
  }
  if (params.query?.trim()) {
    search.set("query", params.query.trim());
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return request<AdminInvoiceListResponse>(`/api/admin/invoices${suffix}`, {}, token);
}

export async function createAdminBillingCheckout(token: string, sellerId: number, payload: {
  plan_code: "pro" | "dev" | "enterprise";
  payable_network: string;
  base_amount_usd?: string;
}) {
  return request<AdminBillingCheckoutResponse>(`/api/admin/sellers/${sellerId}/billing-checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

import type { AdminBlogPost, AdminBlogPostListResponse } from "./types";

export async function fetchAdminBlogPosts(token: string) {
  return request<AdminBlogPost[] | AdminBlogPostListResponse>("/api/admin/blog", {}, token);
}

export async function createAdminBlogPost(token: string, payload: Partial<AdminBlogPost>) {
  return request<AdminBlogPost>("/api/admin/blog", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminBlogPost(token: string, id: number, payload: Partial<AdminBlogPost>) {
  return request<AdminBlogPost>(`/api/admin/blog/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}
