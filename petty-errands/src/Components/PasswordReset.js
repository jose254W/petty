import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PasswordReset = () => {
  const [resetFormData, setResetFormData] = useState({
    code: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const [resetFormErrors, setResetFormErrors] = useState({});

  const handleResetChange = (e) => {
    const { name, value } = e.target;

    setResetFormData({
      ...resetFormData,
      [name]: value,
    });
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errors = validateResetForm();

    if (Object.keys(errors).length === 0) {
      try {
        console.log("Reset form data:", resetFormData);

        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_APP_HOST}/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: resetFormData.code,
              email: resetFormData.email,
              newPassword: resetFormData.newPassword,
            }),
          }
        );

        console.log("Reset password API response:", response);

        if (response.status === 200) {
          toast.success("Password reset successful");

          navigate("/login");
        } else {
          const errorData = await response.json();
          console.error("Password reset failed. API response:", errorData);

          setResetFormErrors({ api: errorData.message });
        }
      } catch (error) {
        console.error("Password reset failed. Error:", error.message);
      }
    } else {
      setResetFormErrors(errors);
    }
  };

  const validateResetForm = () => {
    const errors = {};

    if (!resetFormData.code.trim()) {
      errors.code = "Code is required";
    }

    if (!resetFormData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(resetFormData.email)) {
      errors.email = "Invalid email address";
    }

    if (!resetFormData.newPassword.trim()) {
      errors.newPassword = "New Password is required";
    }

    if (resetFormData.newPassword !== resetFormData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reset your password</h1>

      <form onSubmit={handleResetSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <input
            type="text"
            name="code"
            value={resetFormData.code}
            onChange={handleResetChange}
            placeholder="Code"
            className={`mt-1 p-2 w-full border ${
              resetFormErrors.code ? "border-red-500" : ""
            }`}
            required
          />
          {resetFormErrors.code && (
            <p className="text-red-500 text-sm mt-1">{resetFormErrors.code}</p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="email"
            name="email"
            value={resetFormData.email}
            onChange={handleResetChange}
            placeholder="Email"
            className={`mt-1 p-2 w-full border ${
              resetFormErrors.email ? "border-red-500" : ""
            }`}
            required
          />
          {resetFormErrors.email && (
            <p className="text-red-500 text-sm mt-1">{resetFormErrors.email}</p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="password"
            name="newPassword"
            value={resetFormData.newPassword}
            onChange={handleResetChange}
            placeholder="New Password"
            className={`mt-1 p-2 w-full border ${
              resetFormErrors.newPassword ? "border-red-500" : ""
            }`}
            required
          />
          {resetFormErrors.newPassword && (
            <p className="text-red-500 text-sm mt-1">
              {resetFormErrors.newPassword}
            </p>
          )}
        </div>
        <div className="mb-4">
          <input
            type="password"
            name="confirmPassword"
            value={resetFormData.confirmPassword}
            onChange={handleResetChange}
            placeholder="Confirm New Password"
            className={`mt-1 p-2 w-full border ${
              resetFormErrors.confirmPassword ? "border-red-500" : ""
            }`}
            required
          />
          {resetFormErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {resetFormErrors.confirmPassword}
            </p>
          )}
        </div>
        <div className="mb-4">
          <button
            type="submit"
            className="bg-gray-800 font-bold text-white px-4 py-2 hover:bg-blue-900"
          >
            Reset Password
          </button>
        </div>
      </form>
      <p className="mt-4 text-sm">
        Don't need to reset your password?{" "}
        <Link to="/login" className="font-bold text-blue-500">
          Back to Login
        </Link>
      </p>
      <ToastContainer />
    </div>
  );
};

export default PasswordReset;
