import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../Config/firebaseConfig";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      await auth.sendPasswordResetEmail(email);
      setResetCodeSent(true);
    } catch (error) {
      console.error("Failed to send password reset request. Error:", error.message);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-20">
      <p className="font-bold text-lg mb-14">
        Lost your password? Please enter your email address. You
        will receive a link to create a new password via email.
      </p>

      {resetCodeSent ? (
        <p className="text-lg font-semibold mt-4 ">
          Password reset instructions sent.
          <Link to="/login" className="text-blue-500 underline">
            Click here to log in
          </Link>
        </p>
      ) : (
        <form onSubmit={handleResetPassword} className="max-w-md mx-auto mt-4">
          <label
            htmlFor="email"
            className="block text-lg font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 p-2 w-full border border-solid border-gray-600 outline-none focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-gray-500 text-white px-4 py-2 mt-2 hover:bg-gray-700"
          >
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
