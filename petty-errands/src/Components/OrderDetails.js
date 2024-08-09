import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig";
import { resetCart, updateCartCount } from "../Redux/Product/Actions/productActions";
import axios from 'axios';

function OrderDetails() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.product.cart);
  const paymentMethod = useSelector((state) => state.product.paymentMethod);
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [userId, setUserId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState(""); // State for email

  const handleMpesaCodeChange = (e) => {
    setMpesaCode(e.target.value);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setEmail(user.email); // Get the email from the authenticated user
      } else {
        setUserId("");
        setEmail(""); // Clear email if no user is authenticated
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderNumber = params.get("orderNumber");
    setOrderNumber(orderNumber);

    if (location.state && location.state.deliveryFee) {
      setDeliveryFee(location.state.deliveryFee);
    }
  }, [location.search, location.state]);

  const handleSaveCart = async () => {
    if (!userId) {
      toast.error("User not authenticated.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    const orderData = {
      userId,
      date: new Date(),
      items: cart,
      total: calculateTotal(),
      paymentMethod,
      mpesaCode,
      orderNumber,
      email,  // Include email in the order data
    };

    try {
      const orderRef = await db.collection("orders").add(orderData);

      // Sending email through backend
      await axios.post('http://localhost:3000/api/send-order-email', orderData);

      dispatch(resetCart());
      dispatch(updateCartCount());
      localStorage.removeItem("cart");
      setMpesaCode("");
      toast.success("Order placed successfully!");
      navigate(`/shopp`);
    } catch (error) {
      toast.error("Failed to save order: " + error.message);
    }
  };

  const getItemPrice = (item) => {
    if (item.selectedVariation && item.Variations) {
      const selectedVariationData = item.Variations[item.selectedVariation];
      if (selectedVariationData && selectedVariationData.length > 0) {
        const variation = selectedVariationData[0];
        return variation.salePrice !== null && variation.salePrice !== undefined
          ? variation.salePrice
          : variation.regularPrice;
      }
    }
    return item.GeneralSalePrice !== null && item.GeneralSalePrice !== undefined
      ? item.GeneralSalePrice
      : item.GeneralRegularPrice || 0;
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (total, item) => total + getItemPrice(item) * item.quantity,
      0
    );
    const total = subtotal + (deliveryFee ? parseFloat(deliveryFee) : 0);
    return total;
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto text-lg">
      <div>
        <p>Thank you. Your order has been received.</p>
      </div>
      <div className="bg-white p-8 rounded flex items-center">
        <h2 className="text-2xl font-bold mr-4">ORDER NUMBER: {orderNumber}</h2>
        <div className="border-l border-dotted border-gray-700 h-8"></div>
        <p className="text-sm mx-4">
          DATE: <span className="font-bold">{currentDate}</span>
        </p>
        <div className="border-l border-dotted border-gray-700 h-8"></div>
        <p className="text-sm mx-4">
          TOTAL: <span className="font-bold">ksh{calculateTotal()}</span>
        </p>
        <div className="border-l border-dotted border-gray-700 h-8"></div>
        <p className="text-sm mx-4">
          PAYMENT METHOD: <span className="font-bold">{paymentMethod}</span>
        </p>
      </div>
      <div>
        <p>Pay by {paymentMethod}</p>
      </div>
      <div>
        <p className="font-bold text-xl mt-6 mb-6">ORDER DETAILS</p>
        <div className="bg-blue-50">
          <div>
            <table className="table-auto border-collapse w-2/3">
              <tbody>
                <tr>
                  <td className="border px-4 py-2">
                    <strong>Products</strong>
                  </td>
                  <td className="border px-4 py-2">
                    <strong>Variation</strong>
                  </td>
                  <td className="border px-4 py-2">
                    <strong>Quantity</strong>
                  </td>
                  <td className="border px-4 py-2">
                    <strong>Price</strong>
                  </td>
                </tr>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td className="border px-4 py-2">{item.ProductName}</td>
                    <td className="border p-2">
                      {item.selectedVariation && (
                        <div>
                          {item.selectedVariation
                            .replace(/_/g, " ") // Replace underscores with spaces
                            .split(" ") // Split by spaces into an array
                            .map((line, index) => (
                              <div key={index}>
                                {line.charAt(0).toUpperCase() + line.slice(1)}
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="border px-4 py-2">{item.quantity}</td>
                    <td className="border px-4 py-2">
                      ksh{getItemPrice(item)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border px-4 py-2 font-bold">Subtotal</td>
                  <td className="border px-4 py-2 font-bold">
                    ksh
                    {cart.reduce(
                      (total, item) =>
                        total + getItemPrice(item) * item.quantity,
                      0
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-bold">Payment Method</td>
                  <td className="border px-4 py-2 font-bold">
                    {paymentMethod}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-bold">Total</td>
                  <td className="border px-4 py-2 font-bold">
                    ksh{calculateTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
            <tr>
              <td className="border px-4 py-2 font-bold">Mpesa Code</td>
              <td className="border px-4 py-2">
                <input
                  type="text"
                  value={mpesaCode}
                  onChange={handleMpesaCodeChange}
                  className="border border-gray-400 p-2"
                  placeholder="Enter Mpesa Code"
                />
              </td>
            </tr>
            <div className="flex justify-start">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleSaveCart}
              >
                Submit Code
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default OrderDetails;