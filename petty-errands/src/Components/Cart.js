import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";
import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  setCart,
  updateCartCount,
} from "../Redux/Product/Actions/productActions";

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.product.cart);
  const [selectedShipping, setSelectedShipping] = useState(
    localStorage.getItem("selectedShipping") || "flat-rate"
  );
  const accessToken = localStorage.getItem("accessToken");

  const fetchCartDetails = async () => {
    console.log("Fetching product details...");
    const productIds = cart.map((item) => item.product_id);
    console.log("Product IDs:", productIds);
    const promises = productIds.map(async (productId) => {
      try {
        const doc = await db.collection("Products").doc(productId).get();
        if (doc.exists) {
          const productData = doc.data();
          return {
            productName: productData.ProductName || "Unknown Product",
            productPrice: productData.ProductPrice || 0,
            url: productData.ProductImg || noImage,
            productCategory: productData.ProductCategory || "",
            shortDescription: productData.ShortDescription || "",
            productDescription: productData.ProductDescription || "",
            maxBuy: productData.MaxBuy || 0,
            productGroup: productData.ProductGroup || "",
            productVariations: productData.ProductVariations || null,
          };
        } else {
          console.log(`Product with ID ${productId} not found.`);
          return null;
        }
      } catch (error) {
        console.error(
          `Error fetching product with ID ${productId}`,
          error.message
        );
        return null;
      }
    });
    const productsData = await Promise.all(promises);
    console.log("Products data:", productsData);
    const updatedCart = cart.map((item, index) => {
      const productData = productsData[index];
      return {
        ...item,
        ProductName: productData?.productName || "Unknown Product",
        ProductPrice: Number(productData?.productPrice || 0),
        ProductImg: Array.isArray(productData.ProductImg)
          ? productData.ProductImg
          : [noImage],
        ProductCategory: productData?.productCategory || "",
        ShortDescription: productData?.shortDescription || "",
        ProductDescription: productData?.productDescription || "",
        MaxBuy: Number(productData?.maxBuy || 0),
        ProductGroup: productData?.productGroup || "",
        ProductVariations: productData?.productVariations || null,
      };
    });
    dispatch(setCart(updatedCart.filter(Boolean))); // Filter out null values
  };

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart && cart.length === 0) {
      dispatch(setCart(JSON.parse(storedCart)));
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    dispatch(updateCartCount(cart.length));
  }, [dispatch, cart]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const handleProceedToCheckout = async () => {
    try {
      const cartString = localStorage.getItem("cart");
      const cart = cartString ? JSON.parse(cartString) : null;

      if (!Array.isArray(cart) || cart.length === 0) {
        console.error("Cart is empty or not an array");
        toast.error("Cart is empty or not formatted correctly");
        return;
      }

      const user = auth.currentUser;
      const userId = user ? user.uid : "guest"; // Use "guest" as user ID if not authenticated

      const cartData = cart.map((item) => ({
        ProductName: item.ProductName || "Default Name",
        ProductPrice: Number(item.ProductPrice) || 0,
        ProductImg: Array.isArray(item.ProductImg)
          ? item.ProductImg
          : [noImage],
        ProductCategory: item.ProductCategory || "Default Category",
        ShortDescription: item.ShortDescription || "No description",
        ProductDescription:
          item.ProductDescription || "No detailed description",
        MaxBuy: Number(item.MaxBuy) || 1,
        ProductGroup: item.ProductGroup || "Default Group",
        ProductVariations: item.ProductVariations || [],
        selectedVariation: item.selectedVariation || null,
        quantity: item.quantity || 1,
      }));

      await db.collection("carts").doc(userId).set({ products: cartData });
      console.log("Cart details posted to Firestore successfully!");

      navigate("/checkout");
    } catch (error) {
      console.error("Checkout failed:", error.message);
      toast.error("Checkout failed: " + error.message);
    }
  };

  const handleShippingChange = (value) => {
    setSelectedShipping(value);
    localStorage.setItem("selectedShipping", value);
  };

  const handleRemoveItem = ({ productId, selectedVariation }) => {
    dispatch(removeFromCart({ productId, selectedVariation }));
  };

  const handleIncreaseQuantity = ({ productId, selectedVariation }) => {
    dispatch(increaseQuantity({ productId, selectedVariation }));
  };

  const handleDecreaseQuantity = ({ productId, selectedVariation }) => {
    dispatch(decreaseQuantity({ productId, selectedVariation }));
  };

  const getSelectedImage = (item) => {
    console.log('Item Variations:', item.Variations);
    console.log('Selected Variation:', item.selectedVariation);
  
    if (item.Variations && typeof item.Variations === 'object') {
      const selectedVariation = item.selectedVariation;
  
      if (selectedVariation && item.Variations[selectedVariation]) {
        const selectedVariationData = item.Variations[selectedVariation];
  
        if (selectedVariationData && selectedVariationData.length > 0) {
          const variation = selectedVariationData[0];
          console.log('Variation Image URL:', variation.variationImage);
          return variation.variationImage || noImage;
        }
      }
    }
  
    return item.ProductImg && Array.isArray(item.ProductImg) && item.ProductImg.length > 0
      ? item.ProductImg[0]?.url || noImage
      : noImage;
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

  const isCartEmpty = cart.length === 0;

  if (isCartEmpty) {
    return (
      <div className="px-4 py-2">
        <h1 className="font-bold text-center text-2xl md:text-3xl lg:text-4xl">
          MY CART
        </h1>
        <p className="text-center">Your cart is empty.</p>
        <Link to="/shopp">
          <button className="bg-blue-500 text-white rounded p-2 mt-4 mx-auto block">
            Return to Shop
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="overflow-x-auto">
        <table
          key={cart.length}
          className="table-auto border-collapse w-full text-sm md:text-base lg:text-lg"
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2"></th>
              <th className="border p-2">Image</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Variation</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => {
              const price = getItemPrice(item);

              const uniqueKey = `${item.product_id}-${item.selectedVariation}`;

              return (
                <tr key={uniqueKey} className="hover:bg-gray-100">
                  <td className="border p-2">
                    <button
                      onClick={() =>
                        handleRemoveItem({
                          productId: item.product_id,
                          selectedVariation: item.selectedVariation,
                        })
                      }
                      className="text-red-600 rounded p-1"
                    >
                      <FaTimes className="text-1xl" />
                    </button>
                  </td>
                  <td className="border p-2">
                    <img
                      src={getSelectedImage(item)} // Use the updated getSelectedImage function
                      alt="Product Image"
                      onError={(e) => {
                        e.target.src = noImage; // Fallback image if there's an error
                      }}
                      className="w-full h-28 object-contain"
                    />
                  </td>

                  <td className="border p-2">{item.ProductName}</td>
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

                  <td className="border p-2">ksh{price}</td>
                  <td className="border p-2">
                    <button
                      className="text-sm py-1 bg-blue-500 text-white rounded-l p-1"
                      onClick={() =>
                        handleDecreaseQuantity({
                          productId: item.product_id,
                          selectedVariation: item.selectedVariation,
                        })
                      }
                    >
                      -
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      className="text-sm py-1 bg-blue-500 text-white rounded-r p-1"
                      onClick={() =>
                        handleIncreaseQuantity({
                          productId: item.product_id,
                          selectedVariation: item.selectedVariation,
                        })
                      }
                    >
                      +
                    </button>
                  </td>
                  <td className="border p-2">ksh{price * item.quantity}</td>
                </tr>
              );
            })}
            {/* <tr>
              <td className="border p-2" colSpan="6">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  className="border p-2 w-full md:w-auto"
                />
                <button
                  className="bg-blue-500 text-white rounded p-2 ml-2 mt-2 md:mt-0"
                  onClick={handleApplyCoupon}
                >
                  Apply Coupon
                </button>
              </td>
            </tr> */}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-xl md:text-2xl lg:text-3xl">
        <p className="font-bold">CART TOTALS</p>
      </div>
      <table className="table-auto border-collapse w-full md:w-2/3 mt-4 mb-9">
        <tbody>
          <tr>
            <td className="border p-2 font-bold">Subtotal</td>
            <td className="border p-2 font-bold text-right">
              ksh
              {cart.reduce(
                (total, item) => total + getItemPrice(item) * item.quantity,
                0
              )}
            </td>
          </tr>
          <tr>
            <td className="border p-2 font-bold">Total</td>
            <td className="border p-2 font-bold text-right">
              ksh
              {cart.reduce(
                (total, item) => total + getItemPrice(item) * item.quantity,
                0
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="ml-3">
        <button
          onClick={handleProceedToCheckout}
          className="bg-blue-500 rounded-md text-white px-3 py-2 mb-16 w-full md:w-auto"
        >
          Checkout
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Cart;