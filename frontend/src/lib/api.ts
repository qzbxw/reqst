import type { Invoice, InvoiceListResponse, MeResponse, Wallet, WalletListResponse } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "reqst_token";

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

export async function loginWithEmail(payload: { email: string; password: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/email/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestEmailRegistrationCode(payload: { email: string }) {
  return request<{ ok: boolean }>("/api/auth/email/request-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerWithEmail(payload: { email: string; code: string; password: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/email/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordResetCode(payload: { email: string }) {
  return request<{ ok: boolean }>("/api/auth/email/request-password-reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: { email: string; code: string; new_password: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/email/reset-password", {
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

export async function requestEmailLinkCode(token: string, payload: { email: string }) {
  return request<{ ok: boolean }>("/api/me/email-auth/request-code", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function confirmEmailLink(token: string, payload: { email: string; code: string; password: string }) {
  return request<{ seller: MeResponse["seller"] }>("/api/me/email-auth/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function linkTelegram(token: string, payload: { init_data?: string; widget_data?: string; telegram_id?: number; username?: string }) {
  return request<{ seller: MeResponse["seller"] }>("/api/me/telegram/link", {
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
}) {
  return request<Invoice>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
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
