import { Route, Routes } from "react-router-dom";
import { UIProvider } from "./lib/ui";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LandingPage } from "./pages/LandingPage";
import { LegalPage } from "./pages/LegalPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

export default function App() {
  return (
    <UIProvider>
      <Routes>
        <Route path="/" element={<SellerConsolePage />} />
        <Route path="/lend" element={<LandingPage />} />
        <Route path="/privacy" element={<LegalPage variant="privacy" />} />
        <Route path="/terms" element={<LegalPage variant="terms" />} />
        <Route path="/checkout/:publicId" element={<CheckoutPage />} />
      </Routes>
    </UIProvider>
  );
}
