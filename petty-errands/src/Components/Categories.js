import React, { useEffect, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";

const Categories = () => {
  const [currentCategory, setCurrentCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const { category } = useParams(); // Extract category name from the URL
  const [clickedCarts, setClickedCarts] = useState([]);
  const cart = useSelector((state) => state.product.cart);
  const dispatch = useDispatch();
  const [clickedProducts, setClickedProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await db.collection("Products").get();
        const productsData = productsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          product_id: doc.id,
        }));

        console.log("Fetched products:", productsData); // Log fetched products

        // Filter products by category
        const filteredProducts = productsData.filter((product) => {
          console.log("Product category:", product.ProductCategory); // Log product category
          return product.ProductCategory.includes(category);
        });

        console.log("Filtered products:", filteredProducts); // Log filtered products

        if (filteredProducts.length === 0) {
          console.log(`No products found for category: ${category}`);
        } else {
          setProducts(filteredProducts);
          setCurrentCategory(category);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [category]);

  // Render loading state or no products message if necessary
  if (!currentCategory) {
    return <p>Loading...</p>;
  }

  if (products.length === 0) {
    return <p>No products available for this category.</p>;
  }

  // Function to check if product is in cart
  const isProductInCart = (productId) => {
    return cart.some((item) => item.product_id === productId);
  };

  // Function to handle adding to cart
  const handleAddToCart = (product) => {
    const maxBuy = product.product_maxbuy || Infinity;

    if (!isProductInCart(product.product_id)) {
      if (maxBuy > 0) {
        dispatch(addToCart({ ...product, quantity: 1 }));
        toast.success(`${product.ProductName} added to cart`);
        setClickedProducts([product.product_id]);
        setTimeout(() => {
          setClickedProducts([]);
        }, 300);
      } else {
        console.log(
          "Product cannot be added to cart. Max purchase limit reached."
        );
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
        setClickedProducts([product.product_id]);
        setTimeout(() => {
          setClickedProducts([]);
        }, 300);
      } else {
        console.log(
          "Product quantity cannot be increased. Max purchase limit reached."
        );
      }
    }
  };

  // Function to handle adding to wishlist
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
    <div className="container mx-auto mt-4 mb-4 px-4 sm:px-6 lg:px-8">
      <div className="text-start">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
          {currentCategory.toUpperCase()}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.product_id}
            className="border p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <Link to={`/productDetails/${product.product_id}`}>
              <div className="relative">
                <img
                  src={
                    (product.ProductImg &&
                      product.ProductImg[0] &&
                      product.ProductImg[0].url) ||
                    getFirstVariationImage(product.Variations) ||
                    noImage
                  }
                  alt={product.ProductName}
                  className="w-full h-48 object-contain"
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
                <div className="absolute top-0 right-0 mt-2 mr-2">
                  <button
                    className="bg-transparent border-none text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWishlist(product.product_id);
                    }}
                  >
                    <FaRegHeart className="text-lg sm:text-xl lg:text-2xl" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-semibold text-sm sm:text-base lg:text-lg cursor-pointer">
                  {product.ProductName}
                </p>
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
              </div>
            </Link>
            {product.GeneralRegularPrice ? (
              <button
                className={`bg-teal-600 text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out ${
                  clickedCarts.includes(product.product_id) ? "bg-teal-900" : ""
                }`}
                onClick={() => {
                  handleAddToCart(product);
                  setClickedCarts((prevClickedCarts) => [
                    ...prevClickedCarts,
                    product.product_id,
                  ]);
                  setTimeout(() => {
                    setClickedCarts((prevClickedCarts) =>
                      prevClickedCarts.filter((id) => id !== product.product_id)
                    );
                  }, 300);
                }}
              >
                Add to Cart
              </button>
            ) : (
              <Link
              to={`/productdetails/${product.product_id}`}
              className={`bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out ${
                clickedCarts.includes(product.product_id)
                  ? "bg-teal-900"
                  : ""
              }`}
            >
              View Product
            </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
