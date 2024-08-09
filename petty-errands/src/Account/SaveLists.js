import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";

function SaveLists() {
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        fetchWishlist(user.uid);
      } else {
        setCurrentUser(null);
        setLoading(false);
        setError("User not logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchWishlist = async (userId) => {
    try {
      const wishlistRef = db
        .collection("wishlist")
        .doc(userId)
        .collection("items");
      const snapshot = await wishlistRef.get();

      if (snapshot.empty) {
        console.log("No matching documents.");
        setSavedProducts([]);
        setLoading(false); // Ensure loading state is updated here
        return;
      }

      const products = [];
      for (const doc of snapshot.docs) {
        const wishlistItem = doc.data();
        const productId = wishlistItem.productId;
        const productRef = db.collection("Products").doc(productId);
        const productDoc = await productRef.get();

        if (productDoc.exists) {
          const productData = productDoc.data();
          products.push({
            id: doc.id,
            product_id: productId,
            ...productData,
          });
        } else {
          console.error("Product not found for ID:", productId);
        }
      }

      setSavedProducts(products);
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      setError("Failed to fetch wishlist items");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWishlist = async (productId, wishlistItemId) => {
    try {
      console.log("Deleting product from wishlist:", wishlistItemId);
      await db
        .collection("wishlist")
        .doc(currentUser.uid)
        .collection("items")
        .doc(wishlistItemId)
        .delete();
      console.log(
        "Successfully deleted product from wishlist:",
        wishlistItemId
      );

      // Update the state immediately after deletion
      setSavedProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== wishlistItemId)
      );
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      setError(`Error deleting wishlist item: ${error.message}`);
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
    <div className="container mx-auto p-2">
      <div>
        <h1 className="font-bold text-3xl m-3">My wishlist</h1>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {savedProducts.map((product) => (
            <div key={product.id} className="border p-2 rounded-md">
              <Link
                to={`/productDetails/${product.product_id}`}
                className="hover:no-underline"
              >
                <div className="aspect-w-2 aspect-h-3 mb-2 overflow-hidden flex justify-center items-center">
                <img
                      src={
                        (product.ProductImg &&
                          product.ProductImg[0] &&
                          product.ProductImg[0].url) ||
                        getFirstVariationImage(product.Variations) ||
                        noImage
                      }
                  alt={product.ProductName}
                    className="w-48 h-48 object-contain rounded-md"
                  />
                </div>
              </Link>

              <div className="flex-grow">
                <p className="text-lg font-bold whitespace-nowrap">
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

              <p className="text-m mb-1 ">
                <span className="font-bold text-black">Category:</span>
                <span className="font-normal text-black text-lg whitespace-nowrap">
                  {" "}
                  {product.ProductCategory}
                </span>
              </p>
              <button
                onClick={() =>
                  handleDeleteWishlist(product.product_id, product.id)
                }
                className="bg-red-600 text-white px-2 py-2 rounded mt-2"
              >
                Remove from Wishlist
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SaveLists;