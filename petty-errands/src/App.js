import { default as React, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Account from "./Account/Account";
import ChangePassword from "./Account/ChangePassword";
import MyOrder from "./Account/MyOrder";
import SaveLists from "./Account/SaveLists";
import AboutUs from "./Components/AboutUs";
import Login from "./Components/Auth/Login";
import SignUp from "./Components/Auth/SignUp";
import Cart from "./Components/Cart";
import Categories from "./Components/Categories";
import Checkout from "./Components/Checkout";
import ContactUs from "./Components/ContactUs";
import DashboardNav from "./Components/DashboardNav";
import FoodAdditives from "./Components/FoodAdditives";
import Footer from "./Components/Footer";
import ForgotPassword from "./Components/ForgotPassword";
import FreshFood from "./Components/FreshFood";
import Home from "./Components/Home";
import Liquor from "./Components/Liquor";
import LoginPage from "./Components/LoginPage";
import Navbar from "./Components/Navbar";
import OrderDetails from "./Components/OrderDetails";
import PasswordReset from "./Components/PasswordReset";
import ProductDetails from "./ShopMenu/ProductDetails";
import Promotions from "./Components/Promotions";
import Search from "./Components/Search";
import SearchResults from "./Components/SearchResults";
import Shop from "./Components/Shop";
import ShopMenu from "./Components/ShopMenu";
import { auth, getUserRole } from "./Config/firebaseConfig";
import "./style.css";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRole = await getUserRole(user.uid);
          if (typeof userRole === "string") {
            setIsAdmin(userRole === "admin");
            console.log("isAdmin state:", isAdmin); // Log the isAdmin value
          } else {
            console.error(
              "Unexpected data type for user role:",
              typeof userRole
            );
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error occurred while checking admin role:", error);
        setLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!isAdmin) {
    toast.error("Kindly sign up as an admin to access this page.", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe; // Cleanup function to unsubscribe from auth state changes
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer />

      <BrowserRouter>
        {isAuthenticated ? (
          <>
            <Navbar />
            <Search />
            <PayPalScriptProvider
              options={{
                "client-id":
                  "AXLeljx3y5u10rpaXoe_9Jf4aO8LQUV1ImVm8JPZabc7XqU_PFbj550Xg0XtHLAnoU86mxhKVzgioObS",
                currency: "USD",
                intent: "capture",
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/" element={<Home />} />
                <Route path="/shopMenu" element={<ShopMenu />} />

                <Route path="/foodAdditives" element={<FoodAdditives />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/searchResults" element={<SearchResults />} />
                <Route path="/freshFood" element={<FreshFood />} />
                <Route path="/liquor" element={<Liquor />} />
                <Route path="/aboutUs" element={<AboutUs />} />
                <Route path="/contactUs" element={<ContactUs />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/productDetails/:product_id"
                  element={<ProductDetails />}
                />
                <Route path="/shopp" element={<Shop />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orderDetails" element={<OrderDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgotPassword" element={<ForgotPassword />} />
                <Route path="/passwordReset" element={<PasswordReset />} />
                <Route path="/dashBoardNav" element={<DashboardNav />} />
                <Route path="/account" element={<Account />} />
                <Route path="/account-savelists" element={<SaveLists />} />
                <Route path="/account-order" element={<MyOrder />} />

                

                <Route path="/account-password" element={<ChangePassword />} />
                <Route path="/category/:category" element={<Categories />} />
              </Routes>
            </PayPalScriptProvider>

            <Footer />
          </>
        ) : (
          <>
            <LoginPage />
            <Navbar />
            <Search />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shopMenu" element={<ShopMenu />} />
              {/* <Route path="/addProduct" element={<AddProducts />} /> */}
              <Route path="/foodAdditives" element={<FoodAdditives />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/searchResults" element={<SearchResults />} />
              <Route path="/freshFood" element={<FreshFood />} />
              <Route path="/liquor" element={<Liquor />} />
              <Route path="/aboutUs" element={<AboutUs />} />
              <Route path="/contactUs" element={<ContactUs />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/productDetails/:product_id"
                element={<ProductDetails />}
              />
              <Route path="/shopp" element={<Shop />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orderDetails" element={<OrderDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgotPassword" element={<ForgotPassword />} />
              <Route path="/passwordReset" element={<PasswordReset />} />
              <Route path="/dashBoardNav" element={<DashboardNav />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account-savelists" element={<SaveLists />} />
              <Route path="/account-order" element={<MyOrder />} />
              <Route path="/account-password" element={<ChangePassword />} />
              <Route path="/category/:category" element={<Categories />} />
            </Routes>
            <Footer />
          </>
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
