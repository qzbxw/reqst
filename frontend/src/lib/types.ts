export type Network = "TON" | "TRON" | "SOLANA" | "EVM" | "BASE" | "ARBITRUM" | "BSC";

export type Seller = {
  id: number;
  telegram_id: number | null;
  username: string;
  email: string;
  default_network: Network;
  subscription_ends_at: string | null;
  free_invoices_used: number;
  is_blocked: boolean;
  email_verified_at: string | null;
  telegram_linked_at: string | null;
  has_password: boolean;
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
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  destination_address: string;
  payment_comment: string | null;
  status: string;
  expires_at: string;
  tx_hash?: string | null;
  checkout_url: string;
  payment_uri: string;
};

export type MeResponse = {
  seller: Seller;
  plan: {
    name: string;
    is_pro: boolean;
    trial_limit: number;
    trial_remaining: number;
    price_usd: string;
    billing_days: number;
  };
};

export type WalletListResponse = {
  items: Wallet[] | null;
};

export type InvoiceListResponse = {
  items: Invoice[] | null;
  page: number;
  page_size: number;
};
