package store

import (
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

func TestNetworkHelpers(t *testing.T) {
	if got := NetworkBASE.WalletBucket(); got != NetworkEVM {
		t.Fatalf("expected base wallet bucket to map to EVM, got %s", got)
	}
	if !NetworkTON.IsSupportedWalletNetwork() {
		t.Fatal("expected TON to be a supported wallet network")
	}
	if NetworkBASE.IsSupportedWalletNetwork() {
		t.Fatal("expected BASE not to be a direct wallet network")
	}
	if !NetworkBASE.IsSupportedPayableNetwork() {
		t.Fatal("expected BASE to be a supported payable network")
	}
	if NetworkTON_USDT.IsSupportedPayableNetwork() {
		t.Fatal("expected TON_USDT to stay disabled until end-to-end support is ready")
	}
}

func TestValidateWalletAddress(t *testing.T) {
	validCases := map[Network]string{
		NetworkTON:    "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
		NetworkTRON:   "TYNY19wFMM24dJN4ciyuGZDNzzQHVcaMPd",
		NetworkEVM:    "0x1111111111111111111111111111111111111111",
		NetworkSOLANA: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	}
	for network, address := range validCases {
		if err := ValidateWalletAddress(network, address); err != nil {
			t.Fatalf("expected %s address to be valid, got %v", network, err)
		}
	}

	if err := ValidateWalletAddress(NetworkTRON, "invalid"); err == nil {
		t.Fatal("expected invalid TRON address error")
	}
	if err := ValidateWalletAddress(Network("DOGE"), "abc"); err == nil {
		t.Fatal("expected unsupported network error")
	}
}

func TestInvoiceIsExpired(t *testing.T) {
	now := time.Now()
	if !(Invoice{
		Status:    InvoiceStatusAwaitingPayment,
		ExpiresAt: now.Add(-time.Minute),
	}.IsExpired(now)) {
		t.Fatal("expected awaiting invoice past due date to be expired")
	}
	if (Invoice{
		Status:    InvoiceStatusPaid,
		ExpiresAt: now.Add(-time.Minute),
	}.IsExpired(now)) {
		t.Fatal("expected paid invoice not to be treated as expired")
	}
}

func TestPlanHelpers(t *testing.T) {
	if got := NormalizePlanCode(" DEV "); got != PlanCodeDev {
		t.Fatalf("expected dev plan code, got %s", got)
	}
	if got := NormalizePlanCode("unknown"); got != PlanCodeTrial {
		t.Fatalf("expected fallback trial plan, got %s", got)
	}
	if got := ResolvePlan(PlanCodeEnterprise).PriceUSDString; got != "Custom" {
		t.Fatalf("unexpected enterprise price string: %s", got)
	}
	if plans := ListPaidPlans(); len(plans) != 3 {
		t.Fatalf("expected three paid plans, got %d", len(plans))
	}
}

func TestSellerEffectivePlan(t *testing.T) {
	now := time.Now()
	activeUntil := now.Add(24 * time.Hour)

	seller := Seller{
		PlanCode:           PlanCodeDev,
		SubscriptionEndsAt: &activeUntil,
	}
	if got := seller.EffectivePlanCode(now); got != PlanCodeDev {
		t.Fatalf("expected dev plan, got %s", got)
	}
	if !seller.IsPRO(now) {
		t.Fatal("expected active subscription to be treated as PRO")
	}

	trialSeller := Seller{
		PlanCode:           PlanCodeTrial,
		SubscriptionEndsAt: &activeUntil,
	}
	if got := trialSeller.EffectivePlanCode(now); got != PlanCodePro {
		t.Fatalf("expected paid trial subscription to upgrade to PRO, got %s", got)
	}

	expiredSeller := Seller{
		PlanCode:           PlanCodeEnterprise,
		SubscriptionEndsAt: ptrTime(now.Add(-time.Hour)),
	}
	if got := expiredSeller.EffectivePlanCode(now); got != PlanCodeTrial {
		t.Fatalf("expected expired subscription to fall back to trial, got %s", got)
	}
	if got := seller.EffectivePlan(now).Code; got != PlanCodeDev {
		t.Fatalf("expected effective plan dev, got %s", got)
	}
}

func TestMustJSON(t *testing.T) {
	raw := MustJSON(map[string]any{
		"ok":     true,
		"amount": decimal.RequireFromString("1.50"),
	})
	if len(raw) == 0 {
		t.Fatal("expected JSON payload to be marshaled")
	}
	if got := valueOrEmpty(nil); got != "" {
		t.Fatalf("expected empty string for nil value, got %q", got)
	}
	value := "hello"
	if got := valueOrEmpty(&value); got != "hello" {
		t.Fatalf("expected hello, got %q", got)
	}
	if got := payableScale(NetworkTON); got != 6 {
		t.Fatalf("expected TON payable scale 6, got %d", got)
	}
}

func ptrTime(value time.Time) *time.Time {
	return &value
}
