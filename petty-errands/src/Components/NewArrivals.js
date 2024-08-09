import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaRegHeart } from "react-icons/fa";
import { auth, db } from "../Config/firebaseConfig";
import { addToCart, increaseQuantity } from "../Redux/Product/Actions/productActions";
import noImage from "../Images/noImage.png";

const NewArrivals = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const cart = useSelector((state) => state.product.cart);
  const [clickedCarts, setClickedCarts] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const newArrivalsSnapshot = await db
          .collection("Products")
          .where("ProductTime", ">=", oneMonthAgo)
          .orderBy("ProductTime", "desc")
          .get();

        const newArrivalsData = [];
        newArrivalsSnapshot.forEach((doc) => {
          const productId = doc.id;
          const productData = doc.data();
          newArrivalsData.push({ product_id: productId, ...productData });
        });

        setNewArrivals(newArrivalsData);
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      }
    };

    fetchNewArrivals();
  }, []);

  const isProductInCart = (productId) => {
    return cart.some((item) => item.product_id === productId);
  };

  const handleAddToCart = (product) => {
    const maxBuy = product.product_maxbuy || Infinity;

    if (!isProductInCart(product.product_id)) {
      if (maxBuy > 0) {
        dispatch(addToCart({ ...product, quantity: 1 }));
        toast.success(`${product.ProductName} added to cart`);

        setClickedCarts((prevClickedCarts) => [
          ...prevClickedCarts,
          product.product_id,
        ]);

        setTimeout(() => {
          setClickedCarts((prevClickedCarts) =>
            prevClickedCarts.filter((id) => id !== product.product_id)
          );
        }, 300);
      } else {
        toast.error(
          "Product cannot be added to cart. Max purchase limit reached."
        );
      }
    } else {
      const currentQuantity =
        cart.find((item) => item.product_id === product.product_id)?.quantity ||
        0;

      if (currentQuantity < maxBuy) {
        dispatch(increaseQuantity(product.product_id));
        toast.success(`${product.ProductName} quantity increased in cart`);

        setClickedCarts((prevClickedCarts) => [
          ...prevClickedCarts,
          product.product_id,
        ]);

        setTimeout(() => {
          setClickedCarts((prevClickedCarts) =>
            prevClickedCarts.filter((id) => id !== product.product_id)
          );
        }, 300);
      } else {
        toast.error(
          "Product quantity cannot be increased. Max purchase limit reached."
        );
      }
    }
  };

  const addToWishlist = async (productId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("You must be logged in to add items to your wishlist.");
      return;
    }

    const userId = currentUser.uid;

    if (
      window.confirm("Are you sure you want to add this item to your wishlist?")
    ) {
      try {
        const wishlistRef = db
          .collection("wishlist")
          .doc(userId)
          .collection("items");
        const snapshot = await wishlistRef
          .where("productId", "==", productId)
          .get();

        if (!snapshot.empty) {
          toast.info("This item is already in your wishlist.");
          return;
        }

        await wishlistRef.add({
          productId: productId,
          addedAt: new Date(),
        });

        toast.success("Item added to wishlist successfully!");
      } catch (error) {
        console.error("Error adding item to wishlist:", error);
        toast.error("Failed to add item to wishlist.");
      }
    } else {
      toast.info("Item addition cancelled.");
    }
  };

  const getFirstVariationImage = (variations) => {
    for (const key in variations) {
      if (
        variations[key] &&
        variations[key][0] &&
        variations[key][0].variationImage
      ) {
        return variations[key][0].variationImage;
      }
    }
    return null;
  };

  const getPriceRange = (variations) => {
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const key in variations) {
      variations[key].forEach((variation) => {
        if (variation.salePrice !== null && variation.salePrice !== undefined) {
          if (variation.salePrice < minPrice) minPrice = variation.salePrice;
          if (variation.salePrice > maxPrice) maxPrice = variation.salePrice;
        }
        if (
          variation.regularPrice !== null &&
          variation.regularPrice !== undefined
        ) {
          if (variation.regularPrice < minPrice)
            minPrice = variation.regularPrice;
          if (variation.regularPrice > maxPrice)
            maxPrice = variation.regularPrice;
        }
      });
    }

    if (minPrice === Infinity || maxPrice === -Infinity) return null;
    return minPrice === maxPrice
      ? `Ksh ${minPrice}`
      : `Ksh ${minPrice} - Ksh ${maxPrice}`;
  };


  return (
    <div className="shadow-xl p-6 container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3 p-4 border border-solid border-gray-200">
          <h1 className="font-bold text-xl bg-blue-50 p-6 mb-6">
            New Arrivals
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((product, index) => (
              <div
                key={index}
                className="flex flex-col items-center mb-8 relative"
              >
                <div className="relative w-24 h-24">
                  <img
src={
  (product.ProductImg &&
    product.ProductImg[0] &&
    product.ProductImg[0].url) ||
  getFirstVariationImage(product.Variations) ||
  noImage
}                  alt={product.ProductName}
                    className="w-full h-full object-cover mb-2"
                  />
                  <button
                    className="bg-transparent border-none text-blue-500 absolute top-0 right-0 mt-2 -mr-24"
                    onClick={() => addToWishlist(product.product_id)}
                  >
                    <FaRegHeart className="text-2xl" />
                  </button>
                </div>
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
                <p className="text-lg">{product.ProductName}</p>
                {product.GeneralRegularPrice ? (
                      <>
                        <p className="text-md font-bold text-teal-600 whitespace-nowrap">
                          Ksh {product.GeneralSalePrice}
                        </p>
                        <p className="text-md line-through text-red-600 whitespace-nowrap">
                          Ksh {product.GeneralRegularPrice}
                        </p>
                        <p className="text-xs font-bold text-red-600 whitespace-nowrap">
                          {Math.round(
                            (100 *
                              (product.GeneralRegularPrice -
                                product.GeneralSalePrice)) /
                              product.GeneralRegularPrice
                          )}
                          % Off
                        </p>
                      </>
                    ) : (
                      <p className="text-md font-bold text-teal-600 whitespace-nowrap">
                        {getPriceRange(product.Variations)}
                      </p>
                    )}
                <div className="flex mt-2 w-full">
                {product.GeneralRegularPrice ? (
                  <button
                    className={`bg-teal-600 text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out ${
                      clickedCarts.includes(product.product_id)
                        ? "bg-teal-900"
                        : ""
                    }`}
                    onClick={() => {
                      handleAddToCart(product);
                      setClickedCarts((prevClickedCarts) => [
                        ...prevClickedCarts,
                        product.product_id,
                      ]);
                      setTimeout(() => {
                        setClickedCarts((prevClickedCarts) =>
                          prevClickedCarts.filter(
                            (id) => id !== product.product_id
                          )
                        );
                      }, 300);
                    }}
                  >
                    Add to Cart
                  </button>
                ) : (
                  <Link
                    to={`/productdetails/${product.product_id}`}
                    className="bg-teal-600 ml-24 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out"
                  >
                    View Product
                  </Link>
                )}
              </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewArrivals;
