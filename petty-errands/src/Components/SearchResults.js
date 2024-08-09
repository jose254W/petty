import React, { useEffect, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig"; // Import the Firebase db instance
import noImage from "../Images/noImage.png";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";
import SideNav from "./SideNav";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const searchQuery = new URLSearchParams(location.search).get("term");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [clickedProducts, setClickedProducts] = useState([]);
  const { product_id } = useParams();
  const cart = useSelector((state) => state.product.cart);
  const [clickedCarts, setClickedCarts] = useState([]);
  const dispatch = useDispatch();
  const showItems = 7;

  const productsPerPage = 5; // Define productsPerPage
  const [currentPage, setCurrentPage] = useState(1); // Define currentPage and setCurrentPage

  // Function to check if a product is in the cart

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
  // Fetch search results based on the search term
  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const productsSnapshot = await db.collection("Products").get();
        const productsData = productsSnapshot.docs.map((doc) => ({
          product_id: doc.id,
          ...doc.data(),
        }));

        const filteredProducts = productsData.filter((product) =>
          product.ProductName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filteredProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Error fetching search results:", error.message);
      }
    };

    if (searchQuery) {
      fetchSearchResults();
    } else {
      setLoading(false);
    }
  }, [searchQuery]);

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
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Calculate total number of pages
  const totalPages = Math.ceil(searchResults.length / productsPerPage);

  // Get current products based on pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  // Slice the products array to get the products for the current page
  const currentProducts = searchResults.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Function to handle pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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

  // Change page

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
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);
  const getProductCount = (categoryName) => {
    return products.filter(
      (product) => product.ProductCategory === categoryName
    ).length;
  };

  const visibleCategories = Array.from(
    new Set(products.map((product) => product.ProductCategory))
  );

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
    <div className="container mx-auto mt-8 grid grid-cols-3 gap-8 mb-14">
      {/* Categories section */}
      <div className="col-span-3 md:col-span-1 lg:col-span-1 w-full text-xl  h-fit">
        <SideNav />
      </div>

      {/* Search results section */}
      <div className="col-span-3 md:col-span-2 lg:col-span-2 w-full ">
        <h1 className="text-3xl font-bold mb-4">
          Search Results for "{searchQuery}"
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Loading spinner */}
          {loading && <p>Loading...</p>}
          {/* No results found message */}
          {!loading && searchResults.length === 0 && <p>No results found.</p>}
          {/* Display search results */}
          {!loading &&
            searchResults.length > 0 &&
            currentProducts.map((product) => (
              <div key={product.product_id} className="border p-1 max-w-xs">
                {/* Product details */}
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
                        onClick={() => addToWishlist(product.product.id)}
                      >
                        <FaRegHeart className="text-2xl" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold text-xl cursor-pointer">
                      {product.ProductName}
                    </p>

                    {/* Display discounted price and strike through original price if available */}
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

                {/* Add to Cart button */}
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
            ))}
        </div>
        <div className="flex justify-end items-start mb-4 mt-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              className={`px-2 py-1 rounded-full bg-gray-500 text-white font-semibold disabled:opacity-50 ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={currentPage === 1}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`mx-2 px-3 py-1 rounded-full ${
                  i + 1 === currentPage
                    ? "bg-teal-600 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              className={`px-2 py-1 rounded-full bg-gray-500 text-white font-semibold disabled:opacity-50 ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={currentPage === totalPages}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SearchResults;
