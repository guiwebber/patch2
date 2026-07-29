import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { StoreProvider } from "./context/StoreContext";

import AdminRoute from "./components/adminRoute/AdminRoute";
import SeoManager from "./components/seo/SeoManager";
import Footer from "./components/footer/footer";
import MenuBar from "./components/menu/menu";

import Account from "../pages/account/account";
import Admin from "../pages/admin/admin";
import AdminProducts from "../pages/adminProducts/adminProducts";
import About from "../pages/about/about";
import Checkout from "../pages/checkout/checkout";
import Home from "../pages/home/home";
import Login from "../pages/login/login";
import Orders from "../pages/orders/orders";
import Signup from "../pages/signup/signup";

import "./styles/theme.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error("VITE_GOOGLE_CLIENT_ID não configurado.");
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <SeoManager />

      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <MenuBar />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/minha-conta" element={<Account />} />
              <Route path="/meus-pedidos" element={<Orders />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/produtos" element={<AdminProducts />} />
              </Route>
            </Routes>

            <Footer />
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>,
);
