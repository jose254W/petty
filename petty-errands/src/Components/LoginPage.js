import React from "react";
import { FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";
function LoginPage() {
  return (
    <div className="text-left">
      <p className="bg-gray-100 hover:text-blue-500 p-6 w-full font-bold cursor-pointer flex items-center">
        <FaLock className="mr-1 ml-24 " /> 
        <Link to="/login" className="p-2  ">
          Login
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
