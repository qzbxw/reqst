import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UIProvider, useUI } from "./lib/ui";
import { getStoredToken } from "./lib/api";
import { buildAuthHref } from "./lib/routing";

const AdminBlogPage = lazy(() => import("./pages/AdminBlogPage").then((module) => ({ default: module.AdminBlogPage })));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const AuthPortalPage = lazy(() => import("./pages/AuthPortalPage").then((module) => ({ default: module.AuthPortalPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));
const DeveloperDocsPage = lazy(() => import("./pages/DeveloperDocsPage").then((module) => ({ default: module.DeveloperDocsPage })));
const DeveloperPortalPage = lazy(() => import("./pages/DeveloperPortalPage").then((module) => ({ default: module.DeveloperPortalPage })));
const SellerConsolePage = lazy(() => import("./pages/SellerConsolePage").then((module) => ({ default: module.SellerConsolePage })));

// Public pages are now served by Next.js at frontend-public.
// Vite SPA is mapped to /app/ namespace via Nginx.

const PAGE_TITLES = {
  ru: {
    auth: "Reqst | Вход",
    admin: "Reqst | Админ",
    console: "Reqst | Консоль",
    developers: "Reqst | Портал разработчика",
    docs: "Reqst | Документация API",
    checkout: "Reqst | Оплата",
    fallback: "Reqst",
  },
  en: {
    auth: "Reqst | Sign In",
    admin: "Reqst | Admin",
    console: "Reqst | Console",
    developers: "Reqst | Developer Portal",
    docs: "Reqst | API Documentation",
    checkout: "Reqst | Checkout",
    fallback: "Reqst",
  },
} as const;

function RouteTitleManager() {
  const location = useLocation();
  const { language } = useUI();

  useEffect(() => {
    const titles = PAGE_TITLES[language as "ru" | "en"];
    const path = location.pathname;
    let title: string = titles.fallback;

    if (path === "/auth") {
      title = titles.auth;
    } else if (path === "/admin") {
      title = titles.admin;
    } else if (path === "/console") {
      title = titles.console;
    } else if (path === "/developers") {
      title = titles.docs;
    } else if (path === "/developer-portal") {
      title = titles.developers;
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
      <Suspense fallback={<main className="shell"><p className="muted">Loading...</p></main>}>
        <Routes>
          {/* Main Redirect from root of SPA if somehow accessed */}
          <Route path="/" element={<Navigate to="/console" replace />} />
          
          <Route path="/auth" element={<AuthPortalPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />
          <Route path="/console" element={<ProtectedConsoleRoute />} />
          <Route path="/developers" element={<DeveloperDocsPage />} />
          <Route path="/developer-portal" element={<DeveloperPortalPage />} />
          
          <Route path="/checkout/:publicId" element={<CheckoutPage />} />
          
          {/* All other routes redirect to the main public landing (handled by Next.js) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </UIProvider>
  );
}
