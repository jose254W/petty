import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { firebase } from "../Config/firebaseConfig";

const DashboardNav = () => {
  const location = useLocation();
  const [username, setUsername] = useState(null);

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
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-around items-center text-2xl text-gray-500 border-b border-solid border-gray-400 py-8">
        <Link
          to="/account-adminorder"
          className={`${
            location.pathname === "/account-adminorder"
              ? "text-black font-bold"
              : "text-gray-700 font-semibold  hover:text-black"
          }`}
        >
          Manage Orders
        </Link>
        <Link
          to="/addProduct"
          className={`${
            location.pathname === "/addProduct"
              ? "text-black font-bold"
              : "text-gray-700 font-semibold  hover:text-black"
          }`}
        >
          Add Product
        </Link>
        <Link
          to="/account-removeproduct"
          className={`${
            location.pathname === "/account-removeproduct"
              ? "text-black font-bold"
              : "text-gray-700 font-semibold  hover:text-black"
          }`}
        >
          Edit Product
        </Link>
      </div>
    </div>
  );
};

export default DashboardNav;