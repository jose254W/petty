import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../Config/firebaseConfig";

const SideNav = () => {
  const [dropdowns, setDropdowns] = useState({
    menu: false,
  });
  const navigate = useNavigate();
  const toggleDropdown = (category) => {
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      [category]: !prevDropdowns[category],
    }));
  };
  const [products, setProducts] = useState([]);
  const showItems = 7;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await db.collection("Products").get();
        const productsData = productsSnapshot.docs.map((doc) => ({
          product_id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Error fetching products:", error.message);
      }
    };

    fetchProducts();
  }, []);

  const visibleCategories = Array.from(new Set(products.map(product => product.ProductCategory)));

  

  return (
    <div className="text-gray-700 text-xl w-full">
      <div className="hidden md:flex flex-col border border-solid">
        <Link
          to="/shopMenu"
          className="nav-link border-b mb-2"
        >
          <p className="font-bold mb-2">All Categories </p>
        </Link>

        {visibleCategories.slice(0, showItems).map((category, index) => (
          <Link
            key={index}
            to={`/category/${category}`}
            className="nav-link mb-1 p-3 border-b hover:bg-blue-50"
          >
            {category} 
          </Link>
        ))}

        {visibleCategories > showItems && (
          <p
            className="text-blue-600 cursor-pointer text-lg mt-2 text-center p-2"
            onClick={() => {
              navigate(`/shopMenu`);
            }}
          >
            See More...
          </p>
        )}
      </div>

      <div className="md:hidden flex-col items-center justify-between mb-4">
        <button onClick={() => toggleDropdown("menu")} className="text-2xl">
          {dropdowns.menu ? <FaTimes /> : <FaBars />}
        </button>

        <nav className={`flex flex-col border border-solid ${dropdowns.menu ? "block" : "hidden"}`}>
          <Link
            to="/shopMenu"
            className="nav-link border-b"
          >
          <p className="font-bold mb-2">All Categories </p>
          </Link>

          {visibleCategories.map((category, index) => (
            <Link
              key={index}
              to={`/category/${category}`}
              className="nav-link mb-3 p-3 border-b"
            >
              {category}
            </Link>
          ))}

          {visibleCategories > showItems && (
            <p
              className="text-blue-600 cursor-pointer text-lg mt-2 text-center p-2"
              onClick={() => {
                navigate(`/shopMenu`);
              }}
            >
              See More...
            </p>
          )}
        </nav>
      </div>
    </div>
  );
};

export default SideNav;