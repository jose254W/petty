import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { default as React, useEffect, useState } from "react";
import { FaPaypal } from "react-icons/fa"; // Import PayPal icon from react-icons
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, firebase,db } from "../Config/firebaseConfig";
import mpesalogo from "../Images/mpesalogo.png";
import {
  placeOrder as placeOrderAction,
  setCart,
  setPaymentMethod,
  updateCartCount,
} from "../Redux/Product/Actions/productActions";
import PaypalButton from "./PaypalButton";

const Checkout = () => {
  const [billing, setBilling] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    streetAddress: "",
    town: "",
  });

  const [showCouponInput, setShowCouponInput] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const accessToken = localStorage.getItem("accessToken");
  const userId = parseInt(localStorage.getItem("userId"), 10);
  const [fetchedCart, setFetchedCart] = useState([]);
  const [user, setUser] = useState(null);
  const [finalCart, setFinalCart] = useState([]);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [cities, setCities] = useState([]);
  const [towns, setTowns] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [loading, setLoading] = useState(true); // For handling loading state


  const handleCouponClick = () => {
    setShowCouponInput(!showCouponInput);
  };

  const cart = useSelector((state) => state.product.cart);

  const subtotal = parseFloat(
    cart.reduce((total, item) => total + item.price * item.quantity, 0)
  );

  const paymentMethod = useSelector((state) => state.product.paymentMethod);

  const dispatch = useDispatch();

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart && cart.length === 0) {
      dispatch(setCart(JSON.parse(storedCart)));
    }
  }, [dispatch, cart]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    dispatch(updateCartCount(cart.length));
  }, [dispatch, cart]);

  const [mpesaPaymentDetails, setMpesaPaymentDetails] = useState({
    mpesaName: "",
    mobileNumber: "",
    transactionCode: "",
  });

  const handleMpesaNameChange = (event) => {
    setMpesaPaymentDetails({
      ...mpesaPaymentDetails,
      mpesaName: event.target.value,
    });
  };

  const handleMobileNumberChange = (event) => {
    setMpesaPaymentDetails({
      ...mpesaPaymentDetails,
      mobileNumber: event.target.value,
    });
  };

  const handleTransactionCodeChange = (event) => {
    setMpesaPaymentDetails({
      ...mpesaPaymentDetails,
      transactionCode: event.target.value,
    });
  };

  const handlePaymentMethodChange = (event) => {
    const selectedMethod = event.target.value;
    console.log(selectedMethod);
    dispatch(setPaymentMethod(selectedMethod));
  };

  const handlePayOnDelivery = (event) => {
    const selectedMethod = event.target.value;
    console.log(selectedMethod);
    dispatch(setPaymentMethod(selectedMethod));
  };

  useEffect(() => {
    try {
      console.log("Fetching user cart from local storage...");

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("User not authenticated");
        return;
      }

      const userId = currentUser.uid;
      setUser(currentUser);

      const cartString = localStorage.getItem("cart");
      const cartData = cartString ? JSON.parse(cartString) : [];

      console.log("Fetched Cart items:", cartData);

      const newFinalCart = cartData.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product_price: item.product_price,
      }));

      setFetchedCart(cartData);
      setFinalCart(newFinalCart);

      console.log("Final Cart:", newFinalCart);
    } catch (error) {
      console.error(
        "Error fetching user cart from local storage:",
        error.message
      );
    }
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesSnapshot = await firebase
          .firestore()
          .collection("deliveryFees")
          .get();
        const citiesData = [];
        citiesSnapshot.forEach((doc) => {
          citiesData.push({ id: doc.id, ...doc.data() });
        });
        setCities(citiesData);
      } catch (error) {
        console.error("Error fetching cities: ", error);
      }
    };

    fetchCities();
  }, []);

  useEffect(() => {
    const fetchTowns = async () => {
      if (selectedCity) {
        try {
          const townsSnapshot = await firebase
            .firestore()
            .collection("deliveryFees")
            .doc(selectedCity)
            .collection("towns")
            .get();
          const townsData = [];
          townsSnapshot.forEach((doc) => {
            townsData.push({ id: doc.id, ...doc.data() });
          });
          setTowns(townsData);
        } catch (error) {
          console.error("Error fetching towns: ", error);
        }
      }
    };

    fetchTowns();
  }, [selectedCity]);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (selectedCity && selectedTown) {
        try {
          const townDoc = await firebase
            .firestore()
            .collection("deliveryFees")
            .doc(selectedCity)
            .collection("towns")
            .doc(selectedTown)
            .get();
          if (townDoc.exists) {
            setDeliveryFee(townDoc.data().fee);
          } else {
            setDeliveryFee(null);
          }
        } catch (error) {
          console.error("Error fetching delivery fee: ", error);
        }
      }
    };

    fetchDeliveryFee();
  }, [selectedCity, selectedTown]);

  console.log("Delivery Fee State:", deliveryFee);

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    setSelectedTown(""); // Reset town selection when city changes
    setDeliveryFee(null); // Reset delivery fee when city changes
  };

  const handleTownChange = (event) => {
    setSelectedTown(event.target.value);
  };

  const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setBilling((prevBilling) => ({
      ...prevBilling,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (total, item) => total + getItemPrice(item) * item.quantity,
      0
    );
    const total = subtotal + (deliveryFee ? parseFloat(deliveryFee) : 0);
    return total;
  };

  const placeOrder = async (orderPayload) => {
    const ordersRef = firebase.firestore().collection("orderPayments");

    try {
      // Add the order payload to the orderPayments collection
      const orderDoc = await ordersRef.add({
        ...orderPayload,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Order placed successfully with ID:", orderDoc.id);

      // Dispatch action to update order state if needed
      dispatch(placeOrderAction(orderDoc.id, cart));

      return orderDoc.id;
    } catch (error) {
      console.error("Error placing order:", error);
      // Optionally, you can show an error message to the user
      // toast.error("Error placing order: " + error.message);
      throw error;
    }
  };

  const placeOrderWithoutStkPush = async () => {
    try {
      const coupon = "test";
      const channel = 1;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("User not authenticated");
        return;
      }

      const userId = currentUser.uid;
      const generateOrderNumber = () => {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const length = 8;
        let orderNumber = "Ord-";
        for (let i = 0; i < length; i++) {
          orderNumber += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return orderNumber;
      };

      const orderNumber = generateOrderNumber();

      const orderPayload = {
        userId,
        billing,
        cart,
        total: calculateTotal(),
        coupon,
        channel,
        paymentMethod,
        orderNumber,
      };

      console.log("Order payload:", orderPayload);

      await placeOrder(orderPayload);

      return orderNumber;
    } catch (error) {
      console.error("Error placing order without STK Push:", error.message);
      throw error;
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length === 0) {
      try {
        console.log("Order placement initiated...");
        let orderNumber;

        if (paymentMethod === "cashOnDelivery") {
          orderNumber = await placeOrderWithoutStkPush();
          navigate(
            `/orderDetails?orderNumber=${orderNumber}&deliveryFee=${deliveryFee}`
          );
        } else if (paymentMethod === "stkPush") {
          const Amount = calculateTotal().toString();
          const PhoneNo = billing.phone.toString();
          const formattedPhoneNo = PhoneNo.startsWith("254")
            ? PhoneNo
            : "254" + PhoneNo.substring(PhoneNo.length - 9);

          const generateOrderNumber = () => {
            const characters =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            const length = 8;
            let orderNumber = "Ord-";
            for (let i = 0; i < length; i++) {
              orderNumber += characters.charAt(
                Math.floor(Math.random() * characters.length)
              );
            }
            return orderNumber;
          };

          const orderNumber = generateOrderNumber();
          const Reference = orderNumber;

          console.log("Generated Order Number:", orderNumber);

          try {
            const response = await axios.post(
              "http://64.23.132.20:4006/api/mpesa/initiatestkpush/",
              {
                Amount,
                PhoneNo: formattedPhoneNo,
                Reference: orderNumber,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("API Response:", response);

            if (response.status === 200) {
              console.log("STK Push payment initiated successfully:");

              // Proceed to order details if API response status is 200
              const orderPayload = {
                userId: user.uid,
                billing,
                cart,
                total: calculateTotal(),
                coupon: "test",
                channel: 1,
                paymentMethod,
                orderNumber,
              };

              await placeOrder(orderPayload);

              navigate(`/orderDetails?orderNumber=${orderNumber}`);
            } else {
              console.error(
                "STK Push initiation failed:",
                response.data.message
              );
              toast.error(
                "STK Push initiation failed: " + response.data.message
              );
            }
          } catch (error) {
            console.error("Error initiating STK Push payment:", error);
            if (error.response) {
              console.error("Response data:", error.response.data);
              console.error("Status:", error.response.status);
              console.error("Headers:", error.response.headers);
            } else if (error.request) {
              console.error("Request data:", error.request);
            } else {
              console.error("Error message:", error.message);
            }
            toast.error("Error initiating STK Push payment: " + error.message);
          }
        } else if (paymentMethod === "paypal") {
          console.log("Handling PayPal payment method");
          const handlePaypalApprove = async (details) => {
            try {
              console.log("PayPal payment approved:", details);
              const generateOrderNumber = () => {
                const characters =
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                const length = 8;
                let orderNumber = "Ord-";
                for (let i = 0; i < length; i++) {
                  orderNumber += characters.charAt(
                    Math.floor(Math.random() * characters.length)
                  );
                }
                return orderNumber;
              };
              const orderNumber = generateOrderNumber();
              console.log("Generated order number:", orderNumber);
              const orderPayload = {
                userId: user.uid,
                billing,
                cart,
                total: calculateTotal(),
                coupon: "test",
                channel: 1,
                paymentMethod,
                orderNumber,
              };
              await placeOrder(orderPayload);
              console.log(
                "Order placed successfully, navigating to details page"
              );
              navigate(`/orderDetails?orderNumber=${orderNumber}`);
            } catch (error) {
              console.error("Error in PayPal payment approval process:", error);
              // You might want to handle this error visually as well
            }
          };
          return (
            <PaypalButton
              total={calculateTotal()}
              // Pass the total amount to be paid
              onApprove={handlePaypalApprove}
              // Handle payment approval
            />
          );
        }
      } catch (error) {
        console.error("Error placing order:", error.message);
        toast.error("Error placing order: " + error.message);
      }
    } else {
      setFormErrors(errors);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setBilling({
              firstName: userData.billingFirstName || '',
              lastName: userData.billingLastName || '',
              phone: userData.billingPhone || '',
              city: userData.billingCity || '',
              town: userData.billingTown || '',
              streetAddress: userData.billingStreetAddress || '',
            });
            setSelectedCity(userData.billingCity || '');
            setSelectedTown(userData.billingTown || '');
          }
        } else {
          console.error('No user is signed in.');
        }
      } catch (error) {
        console.error('Error fetching billing info:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    };

    fetchBillingInfo();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!billing.firstName) {
      errors.billingFirstName = "First name is a required field.";
    }
    if (!billing.lastName) {
      errors.billingLastName = "Last name is a required field.";
    }
    if (!billing.phone) {
      errors.billingPhone = "Phone is a required field.";
    }
    if (!billing.city) {
      errors.billingCity = "Region is a required field.";
    }
    if (!billing.town) {
      errors.billingTown = "City is a required field.";
    }
    if (!billing.streetAddress) {
      errors.streetAddress = "Street address is required";
    }
    if (paymentMethod === "sendToMpesa") {
      if (!mpesaPaymentDetails.mpesaName) {
        errors.mpesaName =
          "Empty Mpesa name! Please add your Mpesa payment name.";
      }
      if (!mpesaPaymentDetails.mobileNumber) {
        errors.mpesaNumber =
          "Empty Mpesa number! Please add your Mpesa payment number.";
      }
      if (!mpesaPaymentDetails.transactionCode) {
        errors.mpesaTransactionCode =
          "Empty Mpesa transaction code! Please add your Mpesa payment transaction code.";
      }
    }

    return errors;
  };
  const handlePaypalApprove = async (details) => {
    try {
      console.log("PayPal payment approved:", details);
      const generateOrderNumber = () => {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const length = 8;
        let orderNumber = "Ord-";
        for (let i = 0; i < length; i++) {
          orderNumber += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return orderNumber;
      };

      const orderNumber = generateOrderNumber();
      console.log("Generated order number:", orderNumber);

      const orderPayload = {
        userId: user.uid,
        billing,
        cart,
        total: calculateTotal(),
        coupon: "test",
        channel: 1,
        paymentMethod: "paypal",
        orderNumber,
      };

      await handlePlaceOrder(orderPayload);
      console.log("Order placed successfully, navigating to details page");
      navigate(`/orderDetails?orderNumber=${orderNumber}`);
    } catch (error) {
      console.error("Error in PayPal payment approval process:", error);
      toast.error("Error in PayPal payment approval process: " + error.message);
    }
  };

  const getItemPrice = (item) => {
    console.log("Item:", item);

    // Check if there's a selected variation and variations are defined
    if (item.selectedVariation && item.Variations) {
      // Find the selected variation data
      const selectedVariationData = item.Variations[item.selectedVariation];

      if (selectedVariationData && selectedVariationData.length > 0) {
        const variation = selectedVariationData[0]; // Assuming there's only one object in the variation array

        console.log("Selected Variation Data:", variation);

        // Return sale price of the selected variation if available, otherwise return regular price
        if (variation.salePrice !== null && variation.salePrice !== undefined) {
          return variation.salePrice;
        } else if (
          variation.regularPrice !== null &&
          variation.regularPrice !== undefined
        ) {
          return variation.regularPrice;
        }
      }
    }

    console.log("No selected variation or variation price found.");

    // If no variation selected or variation price not found, fallback to general prices
    if (item.GeneralSalePrice !== null && item.GeneralSalePrice !== undefined) {
      console.log("Returning General Sale Price:", item.GeneralSalePrice);
      return item.GeneralSalePrice;
    } else {
      console.log("Returning General Regular Price:", item.GeneralRegularPrice);
      return item.GeneralRegularPrice || 0; // Fallback to GeneralRegularPrice or default to 0
    }
  };




  return (
    <div className="container mx-auto p-4">
      {cart.length > 0 ? (
        <form onSubmit={handlePlaceOrder}>
          <p className="bg-blue-50 p-2">
            Have a coupon?{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={handleCouponClick}
            >
              Click here to enter your code
            </span>
          </p>

          {showCouponInput && (
            <div className="mt-2">
              <p>If you have a coupon code, please apply it below.</p>
              <div className="flex mt-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  className="border p-2 mr-2 w-full"
                />
                <button className="bg-blue-500 text-white p-2">
                  Apply Coupon
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Billing details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <div>
                  <label
                    htmlFor="billingFirstName"
                    className="block text-sm font-medium"
                  >
                    First name
                  </label>
                  <input
              type="text"
              id="billingFirstName"
              className={`border p-2 w-full ${
                formErrors.billingFirstName ? "bg-red-50" : "bg-blue-50"
              }`}
              value={billing.firstName}
              onChange={(e) =>
                setBilling({ ...billing, firstName: e.target.value })
              }
            />
            {formErrors.billingFirstName && (
              <p className="text-red-500">{formErrors.billingFirstName}</p>
            )}
                </div>
                <div>
                  <label
                    htmlFor="billingLastName"
                    className="block text-sm font-medium"
                  >
                    Last name
                  </label>
                  <input
              type="text"
              id="billingLastName"
              className={`border p-2 w-full ${
                formErrors.billingLastName ? "bg-red-50" : "bg-blue-50"
              }`}
              value={billing.lastName}
              onChange={(e) =>
                setBilling({ ...billing, lastName: e.target.value })
              }
            />
            {formErrors.billingLastName && (
              <p className="text-red-500">{formErrors.billingLastName}</p>
            )}
                </div>
              </div>

              <div className="mb-2">
                <label
                  htmlFor="billingPhone"
                  className="block text-sm font-medium"
                >
                  Phone
                </label>
                <input
            type="text"
            id="billingPhone"
            className={`border p-2 w-full ${
              formErrors.billingPhone ? "bg-red-50" : "bg-blue-50"
            }`}
            value={billing.phone}
            onChange={(e) =>
              setBilling({ ...billing, phone: e.target.value })
            }
          />
          {formErrors.billingPhone && (
            <p className="text-red-500">{formErrors.billingPhone}</p>
          )}
              </div>

              <div className="mb-2">
                <label
                  htmlFor="billingCity"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Choose Location
                </label>
                <select
                  id="billingCity"
                  className={`border p-2 w-full ${
                    formErrors.billingCity ? "bg-red-50" : "bg-blue-50"
                  }`}
                  value={billing.city}
                  onChange={(e) => {
                    const selectedCity = e.target.value;
                    setBilling({
                      ...billing,
                      city: selectedCity,
                      town: "", // Reset town when city changes
                    });
                    setSelectedCity(selectedCity);
                  }}
                >
                  <option value="">Select Region</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>

                {formErrors.billingCity && (
                  <p className="text-red-500">{formErrors.billingCity}</p>
                )}

                <select
                  id="billingTown"
                  className={`border p-2 w-full mt-2 ${
                    formErrors.billingTown ? "bg-red-50" : "bg-blue-50"
                  }`}
                  value={billing.town}
                  onChange={(e) => {
                    const selectedTown = e.target.value;
                    setBilling({ ...billing, town: selectedTown });
                    setSelectedTown(selectedTown);
                  }}
                  disabled={!billing.city} // Disable town dropdown if city is not selected
                >
                  <option value="">Select City</option>
                  {towns.map((town) => (
                    <option key={town.id} value={town.id}>
                      {town.name}
                    </option>
                  ))}
                </select>

                {formErrors.billingTown && (
                  <p className="text-red-500">{formErrors.billingTown}</p>
                )}

<input
            type="text"
            id="streetAddress"
            placeholder="Apartment, suite, street etc"
            className={`border mt-2 p-2 w-full ${
              formErrors.streetAddress ? "bg-red-50" : "bg-blue-50"
            }`}
            value={billing.streetAddress}
            onChange={(e) =>
              setBilling({
                ...billing,
                streetAddress: e.target.value,
              })
            }
            autoComplete="new-password"
          />
          {formErrors.streetAddress && (
            <p className="text-red-500">{formErrors.streetAddress}</p>
          )}
              </div>

              <div className="mb-2">
                <label
                  htmlFor="orderInstructions"
                  className="block text-sm font-medium text-gray-700"
                >
                  Order Instructions, stating preferences (optional)
                </label>
                <input
                  type="text"
                  id="orderInstructions"
                  placeholder="Notes on your order, e.g. special notes concerning delivery."
                  className="border p-2 w-full bg-blue-50"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <table className="table-auto border-collapse w-full mb-4">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Products</th>
                    <th className="border px-4 py-2">Quantity</th>
                    <th className="border px-4 py-2">Price</th>
                    <th className="border px-4 py-2">Variation</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchedCart.map((item, index) => {
                    const price = getItemPrice(item);
                    return (
                      <tr key={index}>
                        <td className="border px-4 py-2">{item.ProductName}</td>
                        <td className="border px-4 py-2">{item.quantity}</td>
                        <td className="border px-4 py-2">
                          ksh{price * item.quantity}
                        </td>
                        <td className="border p-2">
                          {item.selectedVariation && (
                            <div>
                              {item.selectedVariation
                                .replace(/_/g, " ") // Replace underscores with spaces
                                .split(" ") // Split by spaces into an array
                                .map((line, index) => (
                                  <div key={index}>
                                    {line.charAt(0).toUpperCase() +
                                      line.slice(1)}
                                  </div>
                                ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="border px-4 py-2 font-bold">Subtotal</td>
                    <td className="border p-2 font-bold text-right" colSpan="3">
                      ksh
                      {cart.reduce(
                        (total, item) =>
                          total + getItemPrice(item) * item.quantity,
                        0
                      )}
                    </td>
                  </tr>
                  {deliveryFee && (
                    <tr>
                      <td className="border px-4 py-2 font-bold">
                        Delivery Fee
                      </td>
                      <td
                        className="border p-2 font-bold text-right"
                        colSpan="3"
                      >
                        ksh {deliveryFee}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="border px-4 py-2 font-bold">Total</td>
                    <td className="border p-2 font-bold text-right" colSpan="3">
                      ksh {calculateTotal()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mb-4">
                <input
                  type="radio"
                  id="payOnDelivery"
                  name="paymentMethod"
                  value="cashOnDelivery"
                  checked={paymentMethod === "cashOnDelivery"}
                  onChange={handlePayOnDelivery}
                />
                <label htmlFor="payOnDelivery" className="ml-2">
                  Pay On Delivery
                </label>
              </div>

              <div className="mb-4">
                <input
                  type="radio"
                  id="payNow"
                  name="paymentMethod"
                  value="stkPush"
                  checked={paymentMethod === "stkPush"}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="payNow" className="ml-2">
                  Pay Now
                </label>
              </div>

              <div className="mb-4">
                <input
                  type="radio"
                  id="sendToMpesa"
                  name="paymentMethod"
                  value="sendToMpesa"
                  checked={paymentMethod === "sendToMpesa"}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="sendToMpesa" className="flex items-center ml-2">
                  Pay with another number
                  <img src={mpesalogo} alt="M-Pesa Logo" className="ml-2" />
                </label>
                {paymentMethod === "sendToMpesa" && (
                  <div className="mt-4">
                    <p className="mt-4">
                      Pay by sending to Mpesa mobile number
                    </p>
                    <p className="mt-4">
                      Mpesa Recipient Name: {mpesaPaymentDetails.mpesaName}
                    </p>
                    <div className="mt-4 bg-white p-4 rounded-lg">
                      <strong>Confirm Mpesa Payment Details</strong>
                      <div className="mt-4">
                        <label htmlFor="mpesaName">Mpesa Payment Name:</label>
                        <br />
                        <input
                          type="text"
                          id="mpesaName"
                          placeholder="Enter your Mpesa name"
                          value={mpesaPaymentDetails.mpesaName}
                          onChange={handleMpesaNameChange}
                          className="mt-2 border border-gray-500 p-2 w-full"
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="mobileNumber">
                          Mobile Phone Number:
                        </label>
                        <br />
                        <input
                          type="text"
                          id="mobileNumber"
                          placeholder="Enter your mobile number"
                          value={mpesaPaymentDetails.mobileNumber}
                          onChange={handleMobileNumberChange}
                          className="mt-2 border border-gray-500 p-2 w-full"
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="transactionCode">
                          Mpesa Transaction Code:
                        </label>
                        <br />
                        <input
                          type="text"
                          id="transactionCode"
                          placeholder="Enter transaction code"
                          value={mpesaPaymentDetails.transactionCode}
                          onChange={handleTransactionCodeChange}
                          className="mt-2 mb-8 border border-gray-500 p-2 w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <input
                  type="radio"
                  id="paypal"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === "paypal"}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="paypal" className="flex items-center ml-2">
                  <FaPaypal className="mr-2" /> Pay with PayPal
                </label>
              </div>

              {paymentMethod === "paypal" && (
                <PayPalButtons
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            value: calculateTotal().toFixed(2), // Example total amount
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                      handlePaypalApprove(details);
                    });
                  }}
                />
              )}

              <p className="mt-4">
                Your personal data will be used to process your order, support
                your experience throughout this website, and for other purposes
                described in our privacy policy.
              </p>
              <button
                type="submit"
                className="bg-blue-400 px-4 py-2 rounded text-white font-bold mt-4"
              >
                PLACE ORDER
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div>
          <p>Your cart is currently empty.</p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-blue-500 text-white p-2 mt-4"
          >
            Return to Shop
          </button>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Checkout;
