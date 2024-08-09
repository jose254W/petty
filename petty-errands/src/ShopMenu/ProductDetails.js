import React, { useEffect, useState } from "react";
import { FaFacebook, FaPinterest, FaRegHeart, FaTwitter } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
  FacebookShareButton,
  PinterestShareButton,
  TwitterShareButton,
} from "react-share";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";

const ProductDetails = () => {
  const { product_id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [displayedPrice, setDisplayedPrice] = useState(null);
  const cart = useSelector((state) => state.product.cart);
  const [youMayAlsoLikeProducts, setYouMayAlsoLikeProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [variations, setVariations] = useState([]);
  const [clickedCarts, setClickedCarts] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [isValidVariation, setIsValidVariation] = useState(false);
  const [errorToastShown, setErrorToastShown] = useState(false);

  const dispatch = useDispatch();
  useEffect(() => {
    console.log("Fetching product details for product ID:", product_id);

    const fetchProductDetails = async () => {
      try {
        const productDoc = await db
          .collection("Products")
          .doc(product_id)
          .get();

        if (productDoc.exists) {
          const productData = {
            product_id: productDoc.id,
            ...productDoc.data(),
          };

          console.log("Fetched product data:", productData);

          setProduct(productData);

          const hasVariations = Object.keys(productData.Variations).length > 0;

          if (hasVariations) {
            const productVariations = Object.entries(productData.Variations)
              .flatMap(([key, values]) =>
                values.map((variation) => ({
                  key,
                  ...variation,
                }))
              )
              .sort((a, b) => (a.index > b.index ? 1 : -1)); // Sort by index

            const defaultVariation =
              productVariations.find((variation) => variation.index === 1) ||
              productVariations[0];

            console.log(
              "Setting main image from variation:",
              defaultVariation.variationImage
            );

            setMainImage(defaultVariation.variationImage || noImage);
            setDisplayedPrice(
              Number(
                defaultVariation.salePrice || defaultVariation.regularPrice
              )
            );

            setVariations(productVariations);
            setSelectedVariation(defaultVariation);

            // Set initial attributes based on the default variation
            const initialAttributes = {};
            defaultVariation.key.split("_").forEach((val, index) => {
              const attributeName = productData.ProductAttributes[index]?.name;
              if (attributeName) {
                initialAttributes[attributeName] = val;
              }
            });
            setSelectedAttributes(initialAttributes);
          } else {
            setVariations([]);
            setSelectedVariation(null);

            const productImages = [
              productData.ProductImg[0]?.url,
              ...productData.ProductGallery,
            ];

            console.log(
              "Setting main image from product image:",
              productData.ProductImg[0]?.url
            );
            setMainImage(productData.ProductImg[0]?.url || noImage);

            setDisplayedPrice(
              Number(
                productData.GeneralSalePrice || productData.GeneralRegularPrice
              )
            );

            setProduct((prevProduct) => ({
              ...prevProduct,
              ProductGallery: productImages.filter(Boolean),
            }));
          }

          // Fetch "You May Also Like Products" based on the parent category
          const parentCategory = productData.ParentCategory;
          if (parentCategory) {
            const youMayAlsoLikeProductsSnapshot = await db
              .collection("Products")
              .where("ParentCategory", "==", parentCategory)
              .get();

            const youMayAlsoLikeProducts =
              youMayAlsoLikeProductsSnapshot.docs.map((doc) => ({
                product_id: doc.id,
                ...doc.data(),
              }));

            console.log("You may also like products:", youMayAlsoLikeProducts);

            setYouMayAlsoLikeProducts(youMayAlsoLikeProducts);
          }

          // Fetch "Related Products" based on the product category
          const productCategory = productData.ProductCategory[0];
          if (productCategory) {
            const relatedProductsSnapshot = await db
              .collection("Products")
              .where("ProductCategory", "array-contains", productCategory)
              .get();

            const relatedProducts = relatedProductsSnapshot.docs.map((doc) => ({
              product_id: doc.id,
              ...doc.data(),
            }));

            console.log("Related products:", relatedProducts);

            setRelatedProducts(relatedProducts);
          }
        } else {
          console.log("Product not found for ID:", product_id);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    fetchProductDetails();
  }, [product_id]);

  useEffect(() => {
    if (product && product.ProductAttributes) {
      const initialAttributes = {};
      product.ProductAttributes.forEach((attr) => {
        initialAttributes[attr.name] = "";
      });
      setSelectedAttributes(initialAttributes);
    }
  }, [product]);

  const handleAttributeSelect = (attributeName, attributeValue) => {
    setSelectedAttributes((prevAttributes) => {
      const updatedAttributes = {
        ...prevAttributes,
        [attributeName]: attributeValue,
      };

      console.log(`Selected ${attributeName}: ${attributeValue}`);
      console.log("Updated selected attributes:", updatedAttributes);

      // Check if all attributes are selected
      const allAttributesSelected =
        Object.keys(updatedAttributes).length ===
          product.ProductAttributes.length &&
        Object.values(updatedAttributes).every((value) => value !== "");

      if (allAttributesSelected) {
        const variationKey = Object.values(updatedAttributes)
          .map((value) => `_${value}`)
          .join("");

        console.log("Constructed variation key:", variationKey);

        // Fetch the exact variation based on the key
        const matchingVariations = product.Variations[variationKey];

        if (!matchingVariations || matchingVariations.length === 0) {
          if (!errorToastShown) {
            toast.error("No matching variation found for selected attributes.");
            setErrorToastShown(true);
          }
          setIsValidVariation(false);
        } else {
          // Find the correct variation item in the array
          const matchingVariation = matchingVariations.find(
            (variation) => variation.combination === variationKey
          );

          if (matchingVariation) {
            console.log("Matching variation found:", matchingVariation);
            setSelectedVariation({ key: variationKey, ...matchingVariation });
            setMainImage(matchingVariation.variationImage || noImage); // Update main image
            setDisplayedPrice(
              Number(
                matchingVariation.salePrice || matchingVariation.regularPrice
              )
            ); // Update price
            setIsValidVariation(true);
            setErrorToastShown(false); // Reset error toast state if variation is valid
          } else {
            if (!errorToastShown) {
              toast.error(
                "No matching variation found for selected attributes."
              );
              setErrorToastShown(true);
            }
            setIsValidVariation(false);
          }
        }
      } else {
        setIsValidVariation(false);
        setErrorToastShown(false);
      }

      return updatedAttributes;
    });
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  const handleThumbnailClick = (imageUrl) => {
    console.log("Clicked thumbnail image URL:", imageUrl);
    setMainImage(imageUrl || noImage);
  };

  const handleVariationSelect = (variationKey) => {
    const selected = variations.find(
      (variation) => variation.key === variationKey
    );

    if (selected) {
      setMainImage(selected.variationImage || noImage);
      setDisplayedPrice(Number(selected.salePrice || selected.regularPrice));
      setSelectedVariation(selected);
    } else {
      console.log("No matching variation found for selected variation");
    }
  };

  const handleAttributeChange = (attributeName, value) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
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

  const handleAddToCart = (product) => {
    const { product_maxbuy: maxBuy = Infinity } = product;

    const cartItemIdentifier = `${product.product_id}_${
      selectedVariation?.key || ""
    }`;

    const existingCartItemIndex = cart.findIndex(
      (item) => item.cartItemIdentifier === cartItemIdentifier
    );

    if (existingCartItemIndex === -1) {
      if (maxBuy > 0) {
        dispatch(
          addToCart({
            ...product,
            quantity: 1,
            selectedVariation: selectedVariation?.key || "",
            cartItemIdentifier,
            regularPrice: selectedVariation?.regularPrice,
            salePrice: selectedVariation?.salePrice,
          })
        );
        toast.success(`${product.ProductName} added to cart`);
      } else {
        console.error(
          "Product cannot be added to cart. Max purchase limit reached."
        );
        toast.error(
          "Product cannot be added to cart. Max purchase limit reached."
        );
      }
    } else {
      const currentQuantity = cart[existingCartItemIndex].quantity;
      if (currentQuantity < maxBuy) {
        dispatch(
          increaseQuantity({
            productId: product.product_id,
            selectedVariation: selectedVariation?.key || "",
          })
        );
        toast.success(`${product.ProductName} quantity increased in cart`);
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

  if (!product) {
    return <div>Loading...</div>;
  }

  const percentageDiscount = selectedVariation
    ? selectedVariation.salePrice
      ? Math.round(
          ((Number(selectedVariation.regularPrice) -
            Number(selectedVariation.salePrice)) /
            Number(selectedVariation.regularPrice)) *
            100
        )
      : 0
    : product.GeneralSalePrice
    ? Math.round(
        ((Number(product.GeneralRegularPrice) -
          Number(product.GeneralSalePrice)) /
          Number(product.GeneralRegularPrice)) *
          100
      )
    : 0;

  const stripHtmlTags = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Function to count words in a string
  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const strippedDescription = stripHtmlTags(product.ProductDescription);

  // Word count for scroll logic
  const isLongText = countWords(strippedDescription) > 10;

  const displayedPriceFormatted =
    displayedPrice !== null && !isNaN(displayedPrice)
      ? displayedPrice.toFixed(2)
      : "0.00";
  const generalRegularPriceFormatted =
    selectedVariation?.regularPrice !== null &&
    !isNaN(Number(selectedVariation?.regularPrice))
      ? Number(selectedVariation?.regularPrice).toFixed(2)
      : "0.00";

  const hasMultipleAttributes = product.ProductAttributes.length > 1;

  const areAllAttributesSelected = hasMultipleAttributes
    ? product.ProductAttributes.every(
        (attribute) => selectedAttributes[attribute.name]
      )
    : true;

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
    <div className="bg-gray-100 container mx-auto">
      <div className="max-w-3xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg flex flex-col lg:flex-row my-8">
        <div className="lg:w-1/2 p-4">
          <div className="mb-4 relative">
            <img
              className="w-auto h-auto object-contain object-center transition-transform transform hover:scale-110"
              src={mainImage}
              alt="Main Product"
              onError={(e) => {
                e.target.src = noImage;
              }}
            />

            <div className="absolute -top-4 right-8 mt-8">
              <button
                className="bg-transparent border-none text-blue-500"
                onClick={() => addToWishlist(product.product_id)}
              >
                <FaRegHeart className="text-2xl" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap justify-center mt-4">
            {variations && variations.length > 0
              ? variations.map((variation, index) => (
                  <img
                    key={index}
                    className="w-16 h-16 object-contain cursor-pointer m-1 transition-transform transform hover:scale-110 border border-gray-300"
                    src={variation.variationImage || noImage}
                    alt={`Variation ${index + 1}`}
                    onClick={() => handleVariationSelect(variation.key)}
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                ))
              : product.ProductGallery.map((image, index) => (
                  <img
                    key={index}
                    className="w-16 h-16 object-contain cursor-pointer m-1 transition-transform transform hover:scale-110 border border-gray-300"
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    onClick={() => handleThumbnailClick(image)}
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                ))}
          </div>
          <div className="mt-4 flex items-center">
            <p className="font-semibold text-lg mr-2">Share:</p>
            <div className="flex space-x-2">
              <FacebookShareButton
                url={window.location.href}
                quote={product.ProductName}
              >
                <FaFacebook className="text-blue-600 text-xl" />
              </FacebookShareButton>
              <TwitterShareButton
                url={window.location.href}
                title={product.ProductName}
              >
                <FaTwitter className="text-blue-400 text-xl" />
              </TwitterShareButton>
              <PinterestShareButton
                url={window.location.href}
                media={product.ProductImg[0]?.url || ""}
                description={product.ProductName}
              >
                <FaPinterest className="text-red-600 text-xl" />
              </PinterestShareButton>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 p-4 flex flex-col">
          <h1 className="text-2xl font-semibold mb-4">{product.ProductName}</h1>
          <div className="text-gray-600 text-base">
            {selectedVariation?.salePrice ? (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-teal-600">
                  Ksh{displayedPriceFormatted}
                </span>
                <span className="line-through font-semibold ml-2 text-gray-500">
                  Ksh{generalRegularPriceFormatted}
                </span>
                <span className="text-lg ml-2 text-green-600">
                  {percentageDiscount}% off
                </span>
              </div>
            ) : product.GeneralSalePrice ? (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-teal-600">
                  Ksh{displayedPriceFormatted}
                </span>
                <span className="line-through font-semibold ml-2 text-gray-500">
                  Ksh{Number(product.GeneralRegularPrice).toFixed(2)}
                </span>
                <span className="text-lg ml-2 text-green-600">
                  {percentageDiscount}% off
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-teal-600">
                Ksh{displayedPriceFormatted}
              </span>
            )}
          </div>
          <div className="text-gray-700 mt-2 text-lg">
            <div
              dangerouslySetInnerHTML={{
                __html: product.ShortDescription,
              }}
            />
          </div>
          <div className="mt-4">
            {product.ProductAttributes &&
              product.ProductAttributes.length > 0 &&
              product.ProductAttributes.map((attribute, attrIndex) => (
                <div key={attrIndex} className="mb-4">
                  <h3 className="text-lg font-semibold">{attribute.name}</h3>
                  <div className="flex flex-wrap mt-2">
                    {attribute.values.map((value, valIndex) => (
                      <button
                        key={valIndex}
                        className={`border rounded-full px-3 py-1 mr-2 mb-2 ${
                          selectedAttributes[attribute.name] === value
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-gray-200 text-black border-gray-200"
                        }`}
                        onClick={() =>
                          handleAttributeSelect(attribute.name, value)
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div>
            <button
              className={`bg-teal-600 text-white text-xl rounded-full px-2 py-2 mt-2 mb-2 w-full transition-all duration-300 ease-in-out ${
                !isValidVariation && product.ProductAttributes.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                clickedCarts.includes(product.product_id) ? "bg-teal-900" : ""
              }`}
              onClick={() => {
                if (
                  isValidVariation ||
                  product.ProductAttributes.length === 0
                ) {
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
                }
              }}
              disabled={
                !isValidVariation && product.ProductAttributes.length > 0
              }
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8 container mx-auto bg-white rounded-lg px-4 py-8">
        <p
          className={`text-black text-xl mb-4 ${
            isLongText
              ? "overflow-auto max-h-[200px] max-w-full whitespace-pre-wrap"
              : ""
          }`}
        >
          <span className="text-black text-2xl sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4">
            Description:
          </span>
          <br />
          {strippedDescription}
        </p>
      </div>

      {/* You May Also Like Products */}
      <div className="mt-8 mb-8 container mx-auto bg-white rounded-lg px-4 py-8">
        <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4">
          You May Also Like
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {youMayAlsoLikeProducts.map((product) => (
            <div
              key={product.product_id}
              className="border p-1 max-w-xs flex flex-col justify-between"
            >
              <Link
                to={`/productDetails/${product.product_id}`}
                className="block"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="relative">
                  {/* Product image */}
                  <img
                    src={
                      getFirstVariationImage(product.Variations) ||
                      product.ProductImg[0]?.url ||
                      noImage
                    }
                    alt={product.ProductName}
                    className="w-full h-48 object-contain"
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                </div>
                {/* Product details */}
                <div className="mt-2 flex-grow">
                  <p className="text-lg font-semibold whitespace-nowrap">
                    {product.ProductName}
                  </p>
                  <p className="text-lg font-bold text-teal-600 whitespace-nowrap">
                    Ksh{" "}
                    {product.GeneralSalePrice ||
                      product.GeneralRegularPrice ||
                      getPriceRange(product.Variations)}
                  </p>
                </div>
              </Link>
              {/* Button or Link based on price availability */}
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
                  to={`/productDetails/${product.product_id}`}
                  className="bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-3 lg:py-2 mt-2 w-full transition-all duration-300 ease-in-out"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View Product
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-8 mb-8 container mx-auto bg-white rounded-lg px-4 py-8">
        <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4">
          Related Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {relatedProducts.map((product) => (
            <div
              key={product.product_id}
              className="border p-1 max-w-xs flex flex-col justify-between"
            >
              <Link
                to={`/productDetails/${product.product_id}`}
                className="block"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="relative">
                  {/* Product image */}
                  <img
                    src={
                      getFirstVariationImage(product.Variations) ||
                      product.ProductImg[0]?.url ||
                      noImage
                    }
                    alt={product.ProductName}
                    className="w-full h-48 object-contain"
                    onError={(e) => {
                      e.target.src = noImage;
                    }}
                  />
                </div>
                {/* Product details */}
                <div className="mt-2 flex-grow">
                  <p className="text-lg font-semibold whitespace-nowrap">
                    {product.ProductName}
                  </p>
                  <p className="text-lg font-bold text-teal-600 whitespace-nowrap">
                    Ksh{" "}
                    {product.GeneralSalePrice ||
                      product.GeneralRegularPrice ||
                      getPriceRange(product.Variations)}
                  </p>
                </div>
              </Link>
              {/* Button or Link based on price availability */}
              {product.GeneralRegularPrice ? (
                <button
                  className={`bg-teal-600 text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 mt-2 w-full transition-all duration-300 ease-in-out ${
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
                  to={`/productDetails/${product.product_id}`}
                  className="bg-teal-600 text-center text-white text-xs sm:text-sm lg:text-base rounded-full px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-3 mt-2 w-full transition-all duration-300 ease-in-out"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  View Product
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ProductDetails;