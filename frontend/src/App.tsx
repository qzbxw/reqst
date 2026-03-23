import { Routes, Route } from "react-router-dom";
import { CheckoutPage } from "./pages/CheckoutPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SellerConsolePage />} />
      <Route path="/checkout/:publicId" element={<CheckoutPage />} />
    </Routes>
  );
}
