import type { Invoice, MeResponse, Wallet } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const TOKEN_KEY = "reqst_token";

export function getApiBase() {
  return API_BASE.replace(/\/+$/, "");
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

export async function authenticate(payload: { init_data?: string; telegram_id?: number; username?: string }) {
  return request<{ token: string; seller: MeResponse["seller"] }>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string) {
  return request<MeResponse>("/api/me", {}, token);
}

export async function fetchWallets(token: string) {
  return request<{ items: Wallet[] }>("/api/wallets", {}, token);
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
  return request<{ items: Invoice[]; page: number; page_size: number }>("/api/invoices?page=1&page_size=50", {}, token);
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
