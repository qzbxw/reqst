import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UIProvider, useUI } from "./lib/ui";
import { getStoredToken } from "./lib/api";
import { buildAuthHref } from "./lib/routing";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AuthPortalPage } from "./pages/AuthPortalPage";
import { DeveloperPortalPage } from "./pages/DeveloperPortalPage";
import { LandingPage } from "./pages/LandingPage";
import { LegalPage } from "./pages/LegalPage";
import { PlanPage } from "./pages/PlanPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

const PAGE_TITLES = {
  ru: {
    home: "Reqst | Главная",
    auth: "Reqst | Вход",
    admin: "Reqst | Админ",
    console: "Reqst | Консоль",
    developers: "Reqst | Портал разработчика",
    dev: "Reqst | Dev-планы",
    enterprise: "Reqst | Enterprise",
    privacy: "Reqst | Политика конфиденциальности",
    terms: "Reqst | Условия использования",
    checkout: "Reqst | Оплата",
    fallback: "Reqst",
  },
  en: {
    home: "Reqst | Home",
    auth: "Reqst | Sign In",
    admin: "Reqst | Admin",
    console: "Reqst | Console",
    developers: "Reqst | Developer Portal",
    dev: "Reqst | Dev Plans",
    enterprise: "Reqst | Enterprise",
    privacy: "Reqst | Privacy Policy",
    terms: "Reqst | Terms of Service",
    checkout: "Reqst | Checkout",
    fallback: "Reqst",
  },
} as const;

function RouteTitleManager() {
  const location = useLocation();
  const { language } = useUI();

  useEffect(() => {
    const titles = PAGE_TITLES[language];
    const path = location.pathname;
    let title = titles.fallback;

    if (path === "/" || path === "/lend") {
      title = titles.home;
    } else if (path === "/auth") {
      title = titles.auth;
    } else if (path === "/admin") {
      title = titles.admin;
    } else if (path === "/console") {
      title = titles.console;
    } else if (path === "/developers") {
      title = titles.developers;
    } else if (path === "/dev") {
      title = titles.dev;
    } else if (path === "/enterprise") {
      title = titles.enterprise;
    } else if (path === "/privacy") {
      title = titles.privacy;
    } else if (path === "/terms") {
      title = titles.terms;
    } else if (path.startsWith("/checkout/")) {
      title = titles.checkout;
    }

    document.title = title;
  }, [language, location.pathname]);

  return null;
}

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
      <RouteTitleManager />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lend" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<AuthPortalPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
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
