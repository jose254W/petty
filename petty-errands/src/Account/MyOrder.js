import React, { useEffect, useState } from "react";
import { auth, db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";

function MyOrder() {
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching user orders...");
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("User not authenticated.");
        }

        const userId = currentUser.uid;
        const ordersRef = db.collection("orders").where("userId", "==", userId);

        const snapshot = await ordersRef.get();
        const ordersData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            console.log("Order data:", data);

            const deliveryFee = await fetchDeliveryFee(userId);

            const orderPaymentSnapshot = await db
              .collection("orderPayments")
              .where("orderNumber", "==", data.orderNumber)
              .limit(1)
              .get();

            let orderPaymentData = {};
            if (!orderPaymentSnapshot.empty) {
              orderPaymentData = orderPaymentSnapshot.docs[0].data();
            }

            return {
              id: doc.id,
              date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
              email: data.email || "Not specified",
              paid: data.Paid !== undefined ? data.Paid : "Unknown",
              orderNumber: data.orderNumber || "Not specified",
              paymentMethod: data.paymentMethod || "Not specified",
              total: data.total || "Not specified",
              status: orderPaymentData.status || "Processing",
              mpesaCode: data.mpesaCode || "Not specified",
              items: data.items
                ? data.items.map((item) => ({
                    ...item,
                    ProductName: item.ProductName || "No name provided",
                    ProductPrice:
                      item.regularPrice ||
                      item.GeneralSalePrice ||
                      item.GeneralRegularPrice ||
                      "No price provided",
                    quantity: item.quantity || 1,
                  }))
                : [],
              deliveryFee: deliveryFee || "Not specified",
            };
          })
        );

        console.log("Processed orders data:", ordersData);
        setOrderHistory(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserOrders();
  }, []);

  const fetchDeliveryFee = async (userId) => {
    try {
      const orderPaymentsRef = db
        .collection("orderPayments")
        .where("userId", "==", userId);
      const snapshot = await orderPaymentsRef.get();
      if (!snapshot.empty) {
        const orderPaymentData = snapshot.docs[0].data();
        const { city, town } = orderPaymentData.billing || {};
        if (city && town) {
          const townDoc = await db
            .collection("deliveryFees")
            .doc(city)
            .collection("towns")
            .doc(town)
            .get();
          if (townDoc.exists) {
            return townDoc.data().fee || "Not specified";
          }
        }
      }
      return "Not specified";
    } catch (error) {
      console.error("Error fetching delivery fee:", error);
      return "Not specified";
    }
  };

  const getProductImage = (item) => {
    console.log("Full item object:", JSON.stringify(item, null, 2));

    if (item.ProductImg) {
      if (typeof item.ProductImg === 'string') {
        console.log("Using ProductImg string:", item.ProductImg);
        return item.ProductImg;
      }
      if (Array.isArray(item.ProductImg) && item.ProductImg.length > 0) {
        if (typeof item.ProductImg[0] === 'string') {
          console.log("Using ProductImg array string:", item.ProductImg[0]);
          return item.ProductImg[0];
        }
        if (item.ProductImg[0].url) {
          console.log("Using ProductImg array object url:", item.ProductImg[0].url);
          return item.ProductImg[0].url;
        }
      }
    }

    if (item.ProductImage) {
      console.log("Using ProductImage:", item.ProductImage);
      return item.ProductImage;
    }

    if (item.ProductGallery) {
      if (typeof item.ProductGallery === 'string') {
        console.log("Using ProductGallery string:", item.ProductGallery);
        return item.ProductGallery;
      }
      if (Array.isArray(item.ProductGallery) && item.ProductGallery.length > 0) {
        console.log("Using ProductGallery array:", item.ProductGallery[0]);
        return item.ProductGallery[0];
      }
    }

    if (item.selectedVariation && item.Variations) {
      const variationData = item.Variations[item.selectedVariation];
      if (variationData && variationData[0] && variationData[0].variationImage) {
        console.log("Using variation image:", variationData[0].variationImage);
        return variationData[0].variationImage;
      }
    }

    console.log("No image found, using noImage");
    return noImage;
  };

  const parseHTMLToText = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.textContent || "";
  };

  const getStatusWidth = (status) => {
    switch (status) {
      case "Processing":
        return "33%";
      case "On Its Way":
        return "66%";
      case "Delivered":
        return "100%";
      default:
        return "0%";
    }
  };

  const sortedOrders = orderHistory.slice().sort((a, b) => b.date - a.date);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return <div className="text-center mt-8">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="font-bold text-3xl mt-3 mb-5">My Order History</h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => paginate(currentPage - 1)}
          className="pagination-btn bg-blue-500 text-white px-3 py-1 rounded"
          style={{ marginRight: "0.5rem" }}
          disabled={currentPage === 1}
        >
          {"< Previous"}
        </button>
        <div className="flex">
          {Array.from(
            { length: Math.ceil(orderHistory.length / ordersPerPage) },
            (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`pagination-btn ${
                  i + 1 === currentPage ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                } px-3 py-1 rounded mx-1`}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => paginate(currentPage + 1)}
          className="pagination-btn bg-blue-500 text-white px-3 py-1 rounded"
          style={{ marginLeft: "0.5rem" }}
          disabled={
            currentPage === Math.ceil(orderHistory.length / ordersPerPage)
          }
        >
          {"Next >"}
        </button>
      </div>
      {currentOrders.map((order, orderIndex) => (
        <div key={order.id || orderIndex} className="border border-gray-200 rounded-lg shadow-lg p-6 mb-6 bg-white">
          <div className="mb-4">
            <h2 className="font-bold text-xl text-blue-700">
              Order ID: <span className="text-black">{order.id}</span>
            </h2>
            <p className="text-gray-600">{`Date: ${order.date.toLocaleString()}`}</p>
            {/* <p className="text-gray-600">{`Email: ${order.email}`}</p> */}
            <p className="font-semibold">{`Paid: ${
              order.paid ? "Yes" : "No"
            }`}</p>
            <p className="text-gray-600">{`Order Number: ${order.orderNumber}`}</p>
            <p className="text-gray-600">{`Payment Method: ${order.paymentMethod}`}</p>
            <p className="text-gray-600">{`Total: ${order.total}`}</p>
            {order.mpesaCode && (
              <p className="text-gray-600">{`M-Pesa Code: ${order.mpesaCode}`}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, itemIndex) => {
                const imageUrl = getProductImage(item);
                console.log(`Image URL for item ${itemIndex}:`, imageUrl);
                return (
                  <div key={item.product_id || itemIndex} className="border border-gray-200 rounded-lg shadow-md p-4 bg-white">
                    <img
                      src={imageUrl}
                      alt={item.ProductName || "Product"}
                      className="w-full h-40 object-contain mb-2"
                      onError={(e) => {
                        console.log("Image failed to load:", imageUrl);
                        e.target.onerror = null;
                        e.target.src = noImage;
                      }}
                    />
                    <h3 className="font-bold text-lg">{item.ProductName || "Unnamed Product"}</h3>
                    <p className="text-teal-600 font-bold">{`Ksh ${item.ProductPrice}`}</p>
                    <p className="text-gray-600">{`Quantity: ${item.quantity}`}</p>
                    {item.selectedVariation && (
                      <p className="text-gray-600">{`Variation: ${item.selectedVariation}`}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="col-span-full text-center text-gray-600">
                No items available
              </p>
            )}
          </div>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
            <div className="relative mb-4">
              <div className="absolute top-1/2 left-0 w-full h-1 rounded bg-gray-300">
                <div
                  className="h-full rounded bg-blue-500"
                  style={{ width: getStatusWidth(order.status) }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="block text-gray-600">Processing</span>
                <span
                  className={`inline-block w-4 h-4 rounded-full mt-2 ${
                    order.status === "Processing"
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                ></span>
              </div>
              <div>
                <span className="block text-gray-600">On Its Way</span>
                <span
                  className={`inline-block w-4 h-4 rounded-full mt-2 ${
                    order.status === "On Its Way"
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                ></span>
              </div>
              <div>
                <span className="block text-gray-600">Delivered</span>
                <span
                  className={`inline-block w-4 h-4 rounded-full mt-2 ${
                    order.status === "Delivered" ? "bg-blue-500" : "bg-gray-300"
                  }`}
                ></span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyOrder;