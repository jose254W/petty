import React, { useEffect, useRef, useState } from "react";
import {
  FaBars,
  FaCaretDown,
  FaCaretRight,
  FaCaretUp,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db, firebase } from "../Config/firebaseConfig";
import applogo from "../Images/applogo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    userDropdown: false,
    category: false,
  });
  const [clicked, setClicked] = useState(false);
  const cart = useSelector((state) => state.product.cart);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [username, setUsername] = useState(null);
  const [userRole, setUserRole] = useState(null); // State for storing user role
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // New state for user authentication status

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleDropdownItemClick = (categoryId) => {
    closeDropdown("category");
    navigate(`/category/${categoryId}`);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !containerRef.current.contains(e.target)
      ) {
        setDropdowns((prevDropdowns) => ({
          ...prevDropdowns,
          category: false,
        }));
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownRef]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const productsSnapshot = await db.collection("Products").get();
        const productsData = productsSnapshot.docs.map((doc) => ({
          product_id: doc.id,
          ...doc.data(),
        }));
        const visibleCategories = Array.from(
          new Set(productsData.map((product) => product.ProductCategory))
        );
        setCategories(visibleCategories);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Error fetching products:", error.message);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (user) {
          const userData = await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          if (userData.exists) {
            const { username } = userData.data();
            setUsername(username);
            setIsUserLoggedIn(true); // Set user authentication status to true
          } else {
            setIsUserLoggedIn(false); // Set user authentication status to false if no user is logged in
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleClick = () => {
    setMenuOpen(!menuOpen);
    document.body.style.overflow = menuOpen ? "auto" : "hidden"; // Toggle body scroll
  };

  const toggleDropdown = (category) => {
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      [category]: !prevDropdowns[category],
    }));
  };

  const closeDropdown = (category) => {
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      [category]: false,
    }));
  };

  const toggleUserDropdown = () => {
    setClicked(!clicked);
    setDropdowns((prevDropdowns) => ({
      ...prevDropdowns,
      userDropdown: !prevDropdowns.userDropdown,
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && menuOpen) {
        setMenuOpen(false);
        document.body.style.overflow = "auto"; // Re-enable body scroll
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpen]);

  const handleLogout = async (cart) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const userId = user.uid;

      const cartData = cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      }));

      await db.collection("carts").doc(userId).set({ cart: cartData });

      console.log("Cart details posted to Firestore successfully!");
    } catch (error) {
      console.error("Failed to post cart details to Firestore:", error.message);
    }

    try {
      await auth.signOut();

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Failed to log out:", error.message);
    }

    localStorage.removeItem("signupEmail");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");

    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (user) {
          const userData = await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          if (userData.exists) {
            const { username, role } = userData.data(); // Assuming role is stored in user document
            setUsername(username);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div ref={containerRef}>
      <div className="sticky z-50 top-0 bg-white px-6 py-6 flex items-center justify-between">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <Link to="/">
            <img
              src={applogo}
              alt="App Logo"
              className="h-auto w-auto max-w-24 sm:max-w-32 md:max-w-40 lg:max-w-48 xl:max-w-56 2xl:max-w-64 xl:mr-6"
            />
          </Link>
          {!menuOpen && (
            <button onClick={handleClick} className="xl:hidden">
              <FaBars className="text-2xl sm:text-2xl lg:text-3xl" />
            </button>
          )}
        </div>
        <nav className="hidden xl:flex flex-1 justify-center items-center space-x-4">
          <div onClick={() => toggleDropdown("category")} className="relative">
            <div className="flex items-center whitespace-nowrap cursor-pointer rounded-l-3xl bg-white p-3">
              <span className="mr-1 font-bold">All Categories</span>
              {dropdowns.category ? <FaCaretUp /> : <FaCaretDown />}
            </div>
            {dropdowns.category && (
              <ul
                ref={dropdownRef}
                className="pl-2 mt-1 absolute z-10 w-60 max-h-72 overflow-y-auto bg-white border border-gray-300"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {categories.map((category, index) => (
                  <li
                    key={index}
                    className="py-2 w-full text-xl hover:bg-blue-50 border-b border-gray-200"
                    onClick={() => handleDropdownItemClick(category)}
                  >
                    <Link
                      to={`/category/${category}`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {categories.map((category, index) => (
            <li key={index} className="relative group list-none">
              <Link
                to={`/category/${category}`}
                className="text-black font-bold text-lg whitespace-nowrap hover:text-blue-500"
              >
                {category}
              </Link>
            </li>
          ))}
          {isUserLoggedIn && (
            <li
              className={`relative group text-xl font-semibold list-none ${clicked}`}
              onMouseEnter={toggleUserDropdown}
              onMouseLeave={toggleUserDropdown}
              onClick={toggleUserDropdown}
            >
              {/* User icon */}
              <span className="flex items-center justify-end">
                <FaUser className="ml-12 mr-2" />
                {username && (
                  <span className="flex cursor-pointer items-center font-bold text-black capitalize whitespace-nowrap">
                    Hi, {username}!
                    <FaCaretDown className="ml-1" />
                  </span>
                )}
              </span>
              {dropdowns.userDropdown && (
                <ul className="absolute top-full list-none left-0 bg-white border border-solid border-gray-200 p-6 ">
                  <li>
                    <Link
                      to="/account"
                      className={`${
                        location.pathname === "/account" ? "text-blue-500" : ""
                      } block mb-2 `}
                    >
                      Account info
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/account-savelists"
                      className={`${
                        location.pathname === "/account-savelists"
                          ? "text-blue-500"
                          : ""
                      } block mb-2`}
                    >
                      My wishlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/account-order"
                      className={`${
                        location.pathname === "/account-order"
                          ? "text-blue-500"
                          : ""
                      } block mb-2`}
                    >
                      My Order
                    </Link>
                  </li>
                  {userRole === "admin" && (
                    <li>
                      <Link
                        to="/account-adminorder"
                        className={`${
                          location.pathname === "/account-adminorder"
                            ? "text-blue-500"
                            : ""
                        } block mb-2`}
                      >
                        My Admin Order
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      to="/account-password"
                      className={`${
                        location.pathname === "/account-password"
                          ? "text-blue-500"
                          : ""
                      } block mb-2`}
                    >
                      Change password
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="#"
                      onClick={() => handleLogout(cart)}
                      className="block mb-2 hover:underline focus:underline hover:text-black"
                    >
                      Log Out
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}
        </nav>
      </div>
      <nav>
        {isUserLoggedIn && (
          <ul
            className={`${
              menuOpen
                ? "fixed top-0 left-0 w-4/5 bg-teal-50 p-8 z-50 h-full flex flex-col items-start transition-transform duration-300 ease-in-out transform translate-x-0 opacity-95 overflow-y-auto"
                : "fixed top-0 left-0 w-4/5 bg-teal-50 p-8 z-50 h-full flex flex-col items-start transition-transform duration-300 ease-in-out transform -translate-x-full xl:hidden opacity-95 overflow-y-auto"
            }`}
          >
            {menuOpen && (
              <button onClick={handleClick} className="self-end mb-4">
                <FaTimes className="text-2xl" />
              </button>
            )}
            <div className="block xl:hidden">
              <Link
                to="/shopMenu"
                className="flex items-center font-bold whitespace-nowrap cursor-pointer mb-1"
              >
                All Categories <FaCaretRight className="ml-2" />
              </Link>
            </div>
            {categories.map((category, index) => (
              <li key={index} className="relative group mt-4 w-full">
                <Link
                  to={`/category/${category}`}
                  className="text-black font-bold text-lg hover:text-teal-700 w-full block"
                  onClick={handleClick}
                >
                  {category}
                </Link>
                <div className="h-px w-3/5 bg-gray-300 mt-2"></div>
              </li>
            ))}
            <li
              className={`relative group text-xl font-semibold mt-4 ${clicked}`}
              onClick={toggleUserDropdown}
            >
              {/* User icon */}
              <span className="flex items-center">
                <FaUser className="mr-2" />
                {/* Username text */}
                {username && (
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "black",
                      textTransform: "capitalize",
                    }}
                  >
                    <span className="flex cursor-pointer items-center font-bold text-black capitalize whitespace-nowrap">
                      Hi, {username}!
                      <FaCaretDown className="ml-1" />
                    </span>
                  </span>
                )}
              </span>
              {dropdowns.userDropdown && (
                <div className="absolute top-full mt-1 left-0 border border-solid border-gray-200 p-4 rounded-md shadow-md">
                  <ul className="divide-y divide-gray-200">
                    <li>
                      <Link
                        to="/account"
                        className={`${
                          location.pathname === "/account"
                            ? "text-blue-500"
                            : ""
                        } block py-2`}
                        onClick={handleClick}
                      >
                        <span className="text-gray-800 font-semibold whitespace-nowrap">
                          Account Info
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/account-savelists"
                        className={`${
                          location.pathname === "/account-savelists"
                            ? "text-blue-500"
                            : ""
                        } block py-2`}
                        onClick={handleClick}
                      >
                        <span className="text-gray-800 font-semibold whitespace-nowrap">
                          My wishlist
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/account-order"
                        className={`${
                          location.pathname === "/account-order"
                            ? "text-blue-500"
                            : ""
                        } block py-2`}
                        onClick={handleClick}
                      >
                        <span className="text-gray-800 font-semibold whitespace-nowrap">
                          My Orders
                        </span>
                      </Link>
                    </li>
                    {userRole === "admin" && (
                      <li>
                        <Link
                          to="/account-adminorder"
                          className={`${
                            location.pathname === "/account-adminorder"
                              ? "text-blue-500"
                              : ""
                          } block py-2`}
                          onClick={handleClick}
                        >
                          <span className="text-gray-800 font-semibold whitespace-nowrap">
                            My Admin Order
                          </span>
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        to="/account-password"
                        className={`${
                          location.pathname === "/account-password"
                            ? "text-blue-500"
                            : ""
                        } block py-2`}
                        onClick={handleClick}
                      >
                        <span className="text-gray-800 font-semibold whitespace-nowrap">
                          Change Password
                        </span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="#"
                        onClick={() => {
                          handleLogout(cart);
                          handleClick();
                        }}
                        className="block py-2 hover:underline focus:underline hover:text-black"
                      >
                        <span className="text-gray-800 font-semibold whitespace-nowrap">
                          Log Out
                        </span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
