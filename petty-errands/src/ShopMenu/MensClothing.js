import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import {
  addToCart,
  increaseQuantity,
} from "../Redux/Product/Actions/productActions";

function MensClothing() {
  const { id } = useParams();
  const [product, setProduct] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `https://fakestoreapi.com/products/category/men's clothing`
        );
        setProduct(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    fetchProduct();
  }, [id]);

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.product.cart);

  const isProductInCart = (productId) => {
    return cart.some((item) => item.id === productId);
  };

  const handleAddToCart = (product) => {
    if (!isProductInCart(product.id)) {
      dispatch(addToCart({ ...product, quantity: 1 }));
    } else {
      dispatch(increaseQuantity(product.id));
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
  };

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-center">MEN'S CLOTHING</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {product &&
          product.map((product) => (
            <div
              key={product.id}
              className="max-w-xs rounded overflow-hidden shadow-lg"
            >
              <Link to={`/productDetails/${product.id}`}>
                <img
                  className="w-full h-32 object-contain"
                  src={product.image}
                  alt={product.title}
                />
                <div className="px-6 py-4">
                  <h2 className="font-bold text-xl mb-2">{product.title}</h2>
                  <p className="text-gray-700 text-base">${product.price}</p>
                </div>
              </Link>
              <button
                className="bg-black text-center text-sm text-white rounded-xl px-3 py-1"
                onClick={() => handleAddToCart(product)}
              >
                Add to cart
              </button>
            </div>
          ))}
      </div>

      <Slider {...settings}>
        {product.map((product) => (
          <div
            key={product.id}
            className="p-2 w-36 max-w-xs flex items-center justify-center relative group hover:shadow-lg transition-transform duration-300 ease-in-out transform hover:translate-y-2 "
          >
            <div className="bg-white border border-gray-500 overflow-hidden flex-col h-60 w-full sm:w-64 md:w-70 lg:w-80 relative">
              <Link to={`/productDetails/${product.id}`}>
                <div>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-1/3 h-20 object-contain mb-2 rounded cursor-pointer"
                  />
                  <div className="group-hover:opacity-0 transition-opacity duration-300 ease-in-out">
                    <p className="text-sm font-semibold mb-1 cursor-pointer">
                      {product.title}
                    </p>
                    <p>{product.price}</p>
                  </div>
                </div>
              </Link>
              <button
                className="bg-blue-500 text-center text-sm text-white rounded-full px-6 py-2 absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out"
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default MensClothing;
