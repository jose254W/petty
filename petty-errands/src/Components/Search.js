import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch, FaShoppingCart } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";

const Search = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const showItems = 5; // Maximum number of items to show in the dropdown
  const [dropdowns, setDropdowns] = useState({
    category: false,
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const cartCount = useSelector((state) => state.product.cartCount);

  const { category_id } = useParams(); // Extract category_id from the URL

  const parseProductVariations = (variationsString, key) => {
    try {
      const variations = JSON.parse(variationsString);
      return variations[key] || null; // Extract size or color, or return null if not present
    } catch (error) {
      console.error("Error parsing product_variations:", error);
      return null;
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        console.log("Fetching all products from Firebase...");

        const productsSnapshot = await db.collection("Products").get();
        const responseData = [];

        productsSnapshot.forEach((doc) => {
          const productData = doc.data();
          responseData.push({ id: doc.id, ...productData });
        });

        if (responseData.length > 0) {
          console.log("Products found in Firebase:", responseData);
          setProducts(responseData);
        } else {
          console.error("No products found in the collection");
          toast.error("No products found in the collection");
        }
      } catch (error) {
        console.error("Error fetching all products from Firebase:", error);
        toast.error(
          "Error fetching all products from Firebase:",
          error.message
        );
      }
    };

    fetchAllProducts();
  }, []);

  const handleSearch = async (searchTerm) => {
    setSearchTerm(searchTerm);

    console.log("Searching for term:", searchTerm);

    try {
      const searchTermLower = searchTerm.toLowerCase(); // Convert search term to lowercase

      const productsSnapshot = await db.collection("Products").get();
      const searchResults = productsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((product) => {
          const productNameLower = product.ProductName.toLowerCase(); // Convert product name to lowercase
          return productNameLower.includes(searchTermLower); // Check if product name contains the lowercase search term
        });

      setFilteredProducts(searchResults.slice(0, showItems));
      setIsDropdownVisible(true);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Error searching products:", error.message);
    }
  };

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setFilteredProducts([]);
    setIsDropdownVisible(false);
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      console.log("Navigating with searchTerm:", searchTerm);
      handleSearch(searchTerm);
      // Navigate to the search results page with the search term as a query parameter
      navigate(`/searchResults?term=${encodeURIComponent(searchTerm)}`);
      clearSearch();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.classList.contains("category-dropdown-toggle")
      ) {
        setDropdowns((prevDropdowns) => ({
          ...prevDropdowns,
          category: false,
        }));
        clearSearch();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [clearSearch]);

  const closeDropdown = () => {
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      category: false,
    }));
    clearSearch();
  };

  const toggleDropdown = (category) => {
    console.log("Toggling dropdown for category:", category); // Add this line to check if function is being called
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      category:
        category === "category"
          ? !prevDropdowns.category
          : prevDropdowns.category,
    }));
  };

  const handleDropdownItemClick = (categoryId) => {
    closeDropdown();
    navigate(`/category/${categoryId}`);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching unique product categories...");

        const productsSnapshot = await db.collection("Products").get();
        const uniqueCategories = Array.from(
          new Set(
            productsSnapshot.docs.map((doc) => doc.data().ProductCategory)
          )
        );

        console.log("Unique product categories:", uniqueCategories);
        setCategories(uniqueCategories);
        setIsDropdownVisible(true); // Set the dropdown to be visible when categories are fetched
      } catch (error) {
        console.error("Error fetching categories from Firebase:", error);
        toast.error("Error fetching categories:", error.message);
      }
    };

    fetchCategories();
  }, []);

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
    <div className="container max-w-full mx-auto mt-8 bg-teal-500 relative">
      <div className="p-2 flex justify-center items-center">
        <div className="relative w-full md:w-1/2 lg:w-1/2">
          <input
            type="text"
            placeholder="Search Item..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyPress}
            className="p-2 sm:p-3 md:p-4 rounded-3xl mb-0 pr-8 w-full outline-none focus:outline-none bg-white"
          />
          <FaSearch
            className="absolute inset-y-0 right-0 mr-4 sm:mr-6 md:mr-8 text-xl sm:text-2xl md:text-2xl text-black cursor-pointer mt-2 sm:mt-3"
            onClick={() => {
              handleSearch(searchTerm);
              navigate(`/searchResults?term=${encodeURIComponent(searchTerm)}`);
              clearSearch();
            }}
          />
        </div>
        <div className="flex items-start ml-12 sm:ml-20 lg:ml-36">
          <Link to="/cart" className="text-black">
            <FaShoppingCart className=" text-3xl " />
            {cartCount > 0 && (
              <span className="bg-black text-white rounded-full px-2 py-1 ml-5">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      {isDropdownVisible && searchTerm && (
        <div className="grid grid-cols-1 gap-2 w-58 mt-4 absolute border border-gray-500 rounded top-1/2 left-1/4 right-1/4 bg-white z-20">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-3 w-full flex flex-row">
              <Link
                to={`/productDetails/${product.id}`}
                onClick={clearSearch}
                className="flex"
              >
                <img
src={
  (product.ProductImg &&
    product.ProductImg[0] &&
    product.ProductImg[0].url) ||
  getFirstVariationImage(product.Variations) ||
  noImage
}                  alt={product.ProductName || "Product Image"}
                  className="w-1/3 h-20 object-contain border border-solid border-gray-800 mb-2 cursor-pointer"
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
                <div className="flex flex-col justify-between h-full p-2">
                  <div className="text-lg font-bold mb-2">
                    {product.ProductName}
                  </div>
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
            </div>
          ))}
          {products.length > showItems && (
            <p
              className="text-blue-600 font-semibold cursor-pointer text-lg mt-2 text-center p-2"
              onClick={() => {
                navigate(`
                  /searchResults?term=${encodeURIComponent(searchTerm)}
                `);
                clearSearch();
              }}
            >
              See More...
            </p>
          )}
          {searchTerm && filteredProducts.length === 0 && (
            <p className="text-red-600 text-lg p-3">No products found</p>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Search;
