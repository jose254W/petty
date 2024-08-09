import { default as React, useCallback, useEffect, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { auth, db } from "../Config/firebaseConfig";
import Cover1 from "../Images/Cover1.png";
import carousel2 from "../Images/flash.jpeg";
import carousel1 from "../Images/mega.jpeg";
// import carousel4 from "../Images/carousel4.jpg";
import { FaCaretRight } from "react-icons/fa";
import disc11 from "../Images/disc11.jpeg";
import disc22 from "../Images/disc22.jpeg";
import newArrival1 from "../Images/newArrival1.jpeg";
import newArrival2 from "../Images/newArrival2.jpeg";
import noImage from "../Images/noImage.png";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";
const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState([]);
  const [products, setProducts] = useState([]);
  const cart = useSelector((state) => state.product.cart);
  const [clickedProducts, setClickedProducts] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const dispatch = useDispatch();
  const [clickedCarts, setClickedCarts] = useState([]);
  const accessToken = localStorage.getItem("accessToken");
  const [discountedProducts, setDiscountedProducts] = useState([]);

  const slidesData = [
    {
      image: Cover1,
      // text: "I dinner or lunch due and need some shopping - NOW?",
    },
    {
      image: carousel1,
      // text: "Need some quick Shopping",
    },
    {
      image: carousel2,
      // text: "I dinner or lunch due and need some shopping - NOW?",
    },
  ];

  const newArrivalSlides = [
    {
      image: newArrival1,
      text: "Check out our latest arrivals!",
    },
    {
      image: newArrival2,
      text: "Fresh and new products just for you!",
    },
  ];

  const discountedProductsSlides = [
    {
      image: disc11,
      text: "Check out our latest arrivals!",
    },
    {
      image: disc22,
      text: "Fresh and new products just for you!",
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slidesData.length);
  }, [slidesData.length]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => {
      clearInterval(interval);
    };
  }, [nextSlide]);

  const [categoryProducts, setCategoryProducts] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await db.collection("Products").get();
        const productsData = {};
        const discountedProductsList = [];
        productsSnapshot.forEach((doc) => {
          const productId = doc.id;
          const product = { product_id: productId, ...doc.data() };
          const category = product.ProductCategory;
          if (!productsData[category]) {
            productsData[category] = [];
          }
          if (productsData[category].length < 4) {
            productsData[category].push(product);
          }
          if (product.GeneralRegularPrice) {
            discountedProductsList.push(product);
          }
        });

        // Limit to the first 5 categories
        const limitedCategoryProducts = Object.keys(productsData)
          .slice(0, 4)
          .reduce((result, key) => {
            result[key] = productsData[key];
            return result;
          }, {});

        setCategoryProducts(limitedCategoryProducts);
        setDiscountedProducts(discountedProductsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
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
        dispatch(increaseQuantity(product.product_id));
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

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const newArrivalsSnapshot = await db
          .collection("Products")
          .orderBy("ProductTime", "desc")
          .limit(7)
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

  const parseHTMLToText = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.textContent || "";
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
        <div className="col-span-3  max-h-full p-0">
          <Carousel
            showArrows={false}
            showStatus={false}
            showIndicators={true}
            showThumbs={false}
            selectedItem={currentSlide}
            onChange={(index) => setCurrentSlide(index)}
            infiniteLoop={true}
            className="z-0"
          >
            {slidesData.map((slide, index) => (
              <div key={index} className="carousel-slide relative">
                <img src={slide.image} alt={`Slide ${index + 1}`} />
                <div className="slide-text absolute font-medium text-2xl top-3/4 left-1/2 text-white transition-transform transform -translate-x-1/2 -translate-y-1/2 p-4">
                  {slide.text}
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        <div className="col-span-3 p-4 border border-solid border-gray-200">
          <h1 className="font-bold text-xl bg-blue-50 p-6 mb-6">
            <Link to="/new-arrivals" className="nav-link">
              New Arrivals
            </Link>
          </h1>
          <div className="col-span-3 md:col-span-1">
            <Link to="/new-arrivals" className="nav-link">
              <Carousel
                showArrows={false}
                showStatus={false}
                showIndicators={true}
                showThumbs={false}
                infiniteLoop={true}
                autoPlay={true}
                interval={2000} // 3 seconds interval
                className="z-0 mb-10"
              >
                {newArrivalSlides.map((slide, index) => (
                  <div key={index} className="new-arrival-slide relative">
                    <div className="relative">
                      <img
                        src={slide.image}
                        alt={`New Arrival Slide ${index + 1}`}
                        className="w-full h-auto max-h-64 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </Carousel>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {newArrivals.map((product, index) => (
               <div
               key={index}
               className="flex flex-col justify-between items-center mb-4 relative bg-white shadow-md rounded-lg p-2 overflow-hidden"
             >
               <div className="relative w-full">
                 <img
                   src={
                     (product.ProductImg &&
                       product.ProductImg[0] &&
                       product.ProductImg[0].url) ||
                     getFirstVariationImage(product.Variations) ||
                     noImage
                   }
                   alt={product.ProductName}
                   className="w-full h-28 object-contain mb-1 rounded-lg"
                 />
                 <button
                   className="bg-transparent border-none text-blue-500 absolute top-1 right-1"
                   onClick={() => addToWishlist(product.product_id)}
                 >
                   <FaRegHeart className="text-xl" />
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
                   className="bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out"
                 >
                   View Product
                 </Link>
               )}
             </div>
            ))}
          </div>
        </div>
        <div className="col-span-3 p-4 border border-solid border-gray-200">
          <h1 className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl bg-blue-50 p-6 mb-6 whitespace-nowrap">
            DISCOUNTED PRODUCTS
          </h1>
          <div className="col-span-3 md:col-span-1">
            <Carousel
              showArrows={false}
              showStatus={false}
              showIndicators={true}
              showThumbs={false}
              infiniteLoop={true}
              autoPlay={true}
              interval={2000}
              className="z-0 mb-10"
            >
              {discountedProductsSlides.map((slide, index) => (
                <div key={index} className="new-arrival-slide relative">
                  <div className="relative">
                    <img
                      src={slide.image}
                      alt={`New Arrival Slide ${index + 1}`}
                      className="w-full h-auto max-h-66 object-contain rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </Carousel>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {discountedProducts.map((product, index) => (
               <div
               key={index}
               className="flex flex-col justify-between items-center mb-4 relative bg-white shadow-md rounded-lg p-2 overflow-hidden"
             >
               <div className="relative w-full">
                 <img
                   src={
                     (product.ProductImg &&
                       product.ProductImg[0] &&
                       product.ProductImg[0].url) ||
                     getFirstVariationImage(product.Variations) ||
                     noImage
                   }
                   alt={product.ProductName}
                   className="w-full h-28 object-contain mb-1 rounded-lg"
                 />
                 <button
                   className="bg-transparent border-none text-blue-500 absolute top-1 right-1"
                   onClick={() => addToWishlist(product.product_id)}
                 >
                   <FaRegHeart className="text-xl" />
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
                   className="bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out"
                 >
                   View Product
                 </Link>
               )}
             </div>
            ))}
          </div>
        </div>
        {Object.entries(categoryProducts).map(([category, products]) => (
          <div
            key={category}
            className="col-span-3 p-2 border border-solid border-gray-200"
          >
            <div className="flex justify-between items-center bg-blue-50 p-2 mb-4">
              <h1 className="font-bold text-md sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap">
                <a href={`/category/${category}`}>{category.toUpperCase()}</a>
              </h1>
              <Link
                to={`/category/${category}`}
                className="flex items-center ml-4 text-xs sm:text-sm md:text-base lg:text-lg text-black whitespace-nowrap"
              >
                See more <FaCaretRight className="ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between items-center mb-4 relative bg-white shadow-md rounded-lg p-2 overflow-hidden"
                >
                  <div className="relative w-full">
                    <img
                      src={
                        (product.ProductImg &&
                          product.ProductImg[0] &&
                          product.ProductImg[0].url) ||
                        getFirstVariationImage(product.Variations) ||
                        noImage
                      }
                      alt={product.ProductName}
                      className="w-full h-28 object-contain mb-1 rounded-lg"
                    />
                    <button
                      className="bg-transparent border-none text-blue-500 absolute top-1 right-1"
                      onClick={() => addToWishlist(product.product_id)}
                    >
                      <FaRegHeart className="text-xl" />
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
                      className="bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out"
                    >
                      View Product
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
