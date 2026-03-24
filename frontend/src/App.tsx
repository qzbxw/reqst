import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UIProvider } from "./lib/ui";
import { getStoredToken } from "./lib/api";
import { buildAuthHref } from "./lib/routing";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthPortalPage } from "./pages/AuthPortalPage";
import { DeveloperPortalPage } from "./pages/DeveloperPortalPage";
import { LandingPage } from "./pages/LandingPage";
import { LegalPage } from "./pages/LegalPage";
import { PlanPage } from "./pages/PlanPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

function ProtectedConsoleRoute() {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={buildAuthHref(nextPath)} />;
  }

  return <SellerConsolePage />;
}

export default function App() {
  return (
    <UIProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lend" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<AuthPortalPage />} />
        <Route path="/console" element={<ProtectedConsoleRoute />} />
        <Route path="/developers" element={<DeveloperPortalPage />} />
        <Route path="/dev" element={<PlanPage variant="dev" />} />
        <Route path="/enterprise" element={<PlanPage variant="enterprise" />} />
        <Route path="/privacy" element={<LegalPage variant="privacy" />} />
        <Route path="/terms" element={<LegalPage variant="terms" />} />
        <Route path="/checkout/:publicId" element={<CheckoutPage />} />
      </Routes>
    </UIProvider>
  );
}
