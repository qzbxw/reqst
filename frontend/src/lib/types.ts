export type Network = "TON" | "TON_USDT" | "TRON" | "SOLANA" | "EVM" | "BASE" | "ARBITRUM" | "BSC";

export type Seller = {
  id: number;
  telegram_id: number | null;
  username: string;
  email: string;
  default_network: Network;
  plan_code: "trial" | "pro" | "dev" | "enterprise";
  subscription_ends_at: string | null;
  free_invoices_used: number;
  is_blocked: boolean;
  telegram_linked_at: string | null;
  created_at: string;
};

export type Wallet = {
  id: number;
  seller_id: number;
  network: Network;
  address: string;
  is_active: boolean;
  created_at: string;
};

export type Invoice = {
  id: number;
  public_id: string;
  kind?: "merchant" | "subscription";
  subscription_days?: number;
  plan_code?: "trial" | "pro" | "dev" | "enterprise" | "";
  checkout_badge?: string;
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  destination_address: string;
  payment_comment: string | null;
  status: string;
  mode?: "live" | "test";
  expires_at: string;
  created_at: string;
  tx_hash?: string | null;
  checkout_url: string;
  payment_uri: string;
};

export type MeResponse = {
  seller: Seller;
  plan: {
    code: "trial" | "pro" | "dev" | "enterprise";
    name: string;
    is_pro: boolean;
    has_api: boolean;
    has_webhooks: boolean;
    trial_limit: number;
    trial_remaining: number;
    price_usd: string;
    billing_days: number;
    api_key_limit: number;
    monthly_cap: number;
    rpm_limit: number;
    webhook_retries: number;
  };
  plans: Plan[];
};

export type Plan = {
  code: "trial" | "pro" | "dev" | "enterprise";
  name: string;
  checkout_title: string;
  checkout_badge: string;
  marketing_label: string;
  price_usd: string;
  billing_days: number;
  has_unlimited_sales: boolean;
  has_api: boolean;
  has_webhooks: boolean;
  api_key_limit: number;
  monthly_request_cap: number;
  requests_per_minute: number;
  webhook_retries: number;
  priority_support: boolean;
};

export type DeveloperUsageResponse = {
  plan: Plan;
  usage: {
    monthly_requests: number;
    monthly_limit: number;
    requests_this_min: number;
    minute_limit: number;
    active_api_keys: number;
    api_key_limit: number;
    webhook_endpoints: number;
    webhook_retry_limit: number;
  };
};

export type APIKey = {
  id: number;
  seller_id: number;
  label: string;
  prefix: string;
  mode: "live" | "test";
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

export type WebhookDelivery = {
  id: number;
  event_id: string;
  endpoint_id: number;
  seller_id: number;
  event_type: string;
  payload: unknown;
  status: string;
  attempts: number;
  max_attempts: number;
  last_http_status: number | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export type WebhookDeliveryListResponse = {
  items: WebhookDelivery[] | null;
};

export type WebhookEndpoint = {
  id: number;
  seller_id: number;
  label: string;
  url: string;
  secret: string;
  is_active: boolean;
  last_delivery_at: string | null;
  last_success_at: string | null;
  created_at: string;
};

export type WalletListResponse = {
  items: Wallet[] | null;
};

export type InvoiceListResponse = {
  items: Invoice[] | null;
  page: number;
  page_size: number;
};

export type APIKeyListResponse = {
  items: APIKey[] | null;
};

export type WebhookListResponse = {
  items: WebhookEndpoint[] | null;
};

export type AdminInvoice = {
  id: number;
  public_id: string;
  seller_id: number;
  seller_username: string;
  seller_email: string;
  kind: "merchant" | "subscription";
  plan_code: string;
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  destination_address: string;
  payment_comment: string;
  status: string;
  classification: string;
  tx_hash: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  checkout_url: string;
};

export type AdminOverviewResponse = {
  generated_at: string;
  totals: {
    invoices_total: number;
    paid_total: number;
    awaiting_total: number;
    underpaid_total: number;
    manual_review_total: number;
    expired_total: number;
    merchant_paid_total: number;
    subscription_paid_total: number;
    gross_paid_usd: string;
    merchant_paid_usd: string;
    subscription_paid_usd: string;
    open_invoice_usd: string;
    sellers_total: number;
    active_subscribers: number;
    blocked_sellers: number;
    wallets_total: number;
    api_keys_active: number;
    webhook_endpoints: number;
  };
  daily_sales: Array<{
    date: string;
    paid_usd: string;
    merchant_paid_usd: string;
    subscription_paid_usd: string;
    paid_count: number;
    created_count: number;
    underpaid_count: number;
    manual_review_count: number;
  }>;
  network_breakdown: Array<{
    network: Network;
    paid_usd: string;
    paid_count: number;
    total_count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
    usd: string;
  }>;
  plan_breakdown: Array<{
    plan_code: string;
    paid_usd: string;
    paid_count: number;
  }>;
  recent_sales: AdminInvoice[];
};

export type AdminInvoiceListResponse = {
  items: AdminInvoice[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminBillingCheckoutResponse = {
  seller: {
    id: number;
    username: string;
    email: string;
  };
  plan: {
    code: "pro" | "dev" | "enterprise";
    name: string;
    price_usd: string;
    billing_days: number;
    generated_at: string;
  };
  invoice: Invoice;
};

export type AdminBlogPost = {
  id: number;
  slug: string;
  title: string;
  content_md: string;
  excerpt: string;
  cover_image_url: string;
  author: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminBlogPostListResponse = {
  items: AdminBlogPost[];
};
