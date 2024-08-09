import RcSlider from "rc-slider";
import "rc-slider/assets/index.css";
import React, { useEffect, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";
import shopMenu1 from "../Images/shopMenu1.jpg";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";

const Shop = () => {
  const navigate = useNavigate();
  const [clicked, setClicked] = useState(false);
  const [products, setProducts] = useState([]);
  const [clickedProducts, setClickedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [selectedFilter, setSelectedFilter] = useState(() => {
    return localStorage.getItem("selectedFilter") || "default";
  });
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.product.cart);
  const [clickedCarts, setClickedCarts] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]); // Initial price range dynamically set

  const showItems = 7;

  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  const filteredProducts = () => {
    let filtered = [...products];

    filtered = filtered.filter(
      (product) =>
        parseFloat(product.GeneralSalePrice) >= priceRange[0] &&
        parseFloat(product.GeneralSalePrice) <= priceRange[1]
    );

    return filtered;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = db.collection("Products");
        const snapshot = await productsRef.get();
        const productsData = snapshot.docs.map((doc) => ({
          product_id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);

        const prices = productsData
          .map((product) => parseFloat(product.GeneralSalePrice))
          .filter((price) => !isNaN(price));
        const min = prices.length ? Math.min(...prices) : 0;
        const max = prices.length ? Math.max(...prices) : 1000;
        setMinPrice(min);
        setMaxPrice(max);
        setPriceRange([min, max]);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    const maxBuy = product.product_maxbuy || Infinity; // Default to Infinity if product_maxbuy is not available

    if (!isProductInCart(product.product_id)) {
      if (maxBuy > 0) {
        dispatch(addToCart({ ...product, quantity: 1 })); // Add the product with quantity 1
        toast.success(`${product.ProductName} added to cart`);
        setClickedProducts([product.product_id]);

        setTimeout(() => {
          setClickedProducts([]);
        }, 300);
      } else {
        console.error(
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
        // If the current quantity is less than the max buy limit, increase the quantity
        dispatch(increaseQuantity(product.product_id)); // Increase the quantity for the existing product
        toast.success(`${product.ProductName} quantity increased in cart`);
        setClickedProducts([product.product_id]);

        setTimeout(() => {
          setClickedProducts([]);
        }, 300);
      } else {
        console.error(
          "Product quantity cannot be increased. Max purchase limit reached."
        );
        toast.error(
          "Product cannot be added to cart. Max purchase limit reached."
        );
      }
    }
  };

  const isProductInCart = (productId) => {
    return cart.some((item) => item.product_id === productId);
  };
  const addToWishlist = async (productId) => {
    // Ensure the user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("You must be logged in to add items to your wishlist.");
      return;
    }

    const userId = currentUser.uid;

    // Ask user confirmation
    if (
      window.confirm("Are you sure you want to add this item to your wishlist?")
    ) {
      try {
        // Check if the item already exists in the wishlist
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

        // Add the item to the wishlist
        await wishlistRef.add({
          productId: productId,
          addedAt: new Date(), // Store the time of adding
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = db.collection("Products");
        const snapshot = await productsRef.get();
        const productsData = snapshot.docs.map((doc) => ({
          product_id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        const prices = productsData.map((product) => product.GeneralSalePrice);
        setMinPrice(Math.min(...prices));
        setMaxPrice(Math.max(...prices));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  // Slice the products array to get the products for the current page
  const currentProducts = filteredProducts().slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Modify the goToNextPage function
  const goToNextPage = () => {
    setCurrentPage((prevPage) =>
      Math.min(prevPage + 1, Math.ceil(products.length / productsPerPage))
    );
  };

  // Modify the goToPrevPage function
  const goToPrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const visibleCategories = Array.from(
    new Set(products.map((product) => product.ProductCategory))
  );

  const getProductCount = (categoryName) => {
    return products.filter(
      (product) => product.ProductCategory === categoryName
    ).length;
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
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
      <img
        src={shopMenu1}
        alt="shoppic"
        className="w-full h-38 mb-4 col-span-4"
      />
      <div className="col-span-4 md:col-span-4 lg:col-span-1 w-full text-xl h-auto">
        <div className="col-span-4 md:col-span-4 lg:col-span-1 w-full text-xl border border-solid border-gray-200 h-auto mt-4">
          <div className="mb-6">
            <h1 className="font-bold text-2xl mb-2 p-2 bg-gray-100">
              Price Range
            </h1>
            <RcSlider
              range
              value={priceRange}
              min={minPrice}
              max={maxPrice}
              onChange={handlePriceChange}
              withBars
            />
            <p className="text-center mt-2">
              Price: Ksh{priceRange[0]} - Ksh{priceRange[1]}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-4 md:col-span-3 lg:col-span-3">
        <div className="flex justify-between mb-4">
          <h1 className="font-bold text-3xl text-start ">SHOP</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.product_id} // Use product_id as the key
              className="border p-1 max-w-xs relative hover:scale-105 transform transition duration-300 ease-in-out"
            >
              {/* Product details */}
              <Link to={`/productDetails/${product.product_id}`}>
                <div className="relative">
                  {/* Product image */}
                  <img
                    src={
                      (product.ProductImg &&
                        product.ProductImg[0] &&
                        product.ProductImg[0].url) ||
                      getFirstVariationImage(product.Variations) ||
                      noImage
                    }
                    alt={noImage}
                    className="w-full h-28 object-contain mb-1 rounded-lg"
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                </div>
                <button
                  className="absolute top-2 right-2 bg-transparent border-none text-blue-500"
                  onClick={() => addToWishlist(product.product_id)}
                >
                  <FaRegHeart className="text-2xl" />
                </button>
                <div className="flex-grow">
                  <p className="text-md font-semibold whitespace-nowrap">
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
            </div>
          ))}
        </div>

        <div className="flex justify-end mb-4 mt-8">
          <button
            onClick={goToPrevPage}
            className="mx-2 px-2 py-1 rounded-full bg-gray-500 text-white"
            disabled={currentPage === 1}
          >
            {"<"}
          </button>
          <div className="flex">
            {Array.from(
              {
                length: Math.ceil(filteredProducts().length / productsPerPage),
              },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`mx-2 px-3 py-1 rounded-full ${
                    i + 1 === currentPage
                      ? "bg-teal-500 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}
          </div>
          <button
            onClick={goToNextPage}
            className="mx-2 px-2 py-1 rounded-full bg-gray-500 text-white"
            disabled={
              currentPage === Math.ceil(products.length / productsPerPage)
            }
          >
            {">"}
          </button>
        </div>

        <Link
          to="/cart"
          className="block text-center text-teal-500 font-bold text-xl mt-4"
        >
          Go to Cart
        </Link>
      </div>
    </div>
  );
};

export default Shop;
