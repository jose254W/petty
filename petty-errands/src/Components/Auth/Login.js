import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../Config/firebaseConfig";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length === 0) {
      try {
        // Sign in with email and password
        await auth.signInWithEmailAndPassword(
          formData.email,
          formData.password
        );

        // Redirect to home page
        navigate("/account");
      } catch (error) {
        console.error("Login Failed", error.message);
        setApiError(error.message);
      }
    } else {
      setFormErrors(errors);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Invalid email address";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }

    return errors;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LOGIN</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 p-2 w-full border ${
              formErrors.email ? "border-red-500" : ""
            }`}
            required
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 p-2 w-full border ${
              formErrors.password ? "border-red-500" : ""
            }`}
            required
          />
          {formErrors.password && (
            <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="rememberMe" className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm">Remember Me</span>
          </label>
        </div>

        {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

        <div>
          <button
            type="submit"
            className="bg-gray-800 font-bold text-white px-4 py-2 hover:bg-blue-900"
          >
            LOGIN
          </button>
        </div>
        <div className="mb-4">
          <Link to="/forgotPassword" className="text-blue-500 underline">
            Forgot Password?
          </Link>
        </div>
      </form>
      <p className="mt-4 text-sm">
        Don't have an account?{" "}
        <Link to="/signup" className="font-bold text-blue-500 ">
          Sign up here
        </Link>
      </p>
    </div>
  );
};

export default Login;
