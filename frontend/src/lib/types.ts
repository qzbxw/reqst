export type Network = "TON" | "TRON" | "EVM";

export type Seller = {
  id: number;
  telegram_id: number;
  username: string;
  default_network: Network;
  subscription_ends_at: string | null;
  free_invoices_used: number;
  is_blocked: boolean;
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
  title: string;
  base_amount_usd: string;
  payable_amount: string;
  payable_network: Network;
  destination_address: string;
  payment_comment: string;
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
  };
};
