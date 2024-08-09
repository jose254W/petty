import React, { useState } from "react";
import GoogleButton from "react-google-button";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db, signInWithGoogle } from "../../Config/firebaseConfig";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "user", // Default role is set to user
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "password") {
      updatePasswordStrength(value);
    }
  };

  const updatePasswordStrength = (password) => {
    const strength = determinePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const determinePasswordStrength = (password) => {
    if (password.length >= 8) {
      return "Strong";
    }
    return "Weak";
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone)) {
      errors.phone = "Invalid phone number";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^\d+$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(
          formData.email,
          formData.password
        );
        await userCredential.user.sendEmailVerification();
        await db.collection("users").doc(userCredential.user.uid).set({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role, // Include the role in the user document
        });
        toast.success("Check your email for a verification email");
        navigate("/login"); // Navigate to login after successful user creation
      } catch (error) {
        toast.error("Sign Up Failed: " + error.message);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { user } = await signInWithGoogle();
      if (user) {
        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
          await userRef.set({
            username: user.displayName || "",
            email: user.email,
          });
        }

        navigate("/");
        toast.success("Signed in with Google successfully!");
      }
    } catch (error) {
      console.error("Google Sign Up Failed:", error);
      toast.error("Google Sign Up Failed: " + error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SIGN UP</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <InputField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={formErrors.username}
        />
        <InputField
          type="email"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
        />
        <InputField
          type="tel"
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={formErrors.phone}
          placeholder="e.g., 0700000000"
        />
        <InputField
          type="password"
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
        />
        <InputField
          type="password"
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={formErrors.confirmPassword}
        />

        <div className="mb-4">
          <p
            className={`text-sm mt-1 ${
              passwordStrength === "Strong" ? "text-green-500" : "text-red-500"
            }`}
          >
            Password Strength: {passwordStrength}
          </p>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="role"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Sign Up
        </button>
      </form>
      <div className="mt-4">
        <GoogleButton onClick={handleGoogleSignUp} />
      </div>
      <ToastContainer />
    </div>
  );
};

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder = "",
}) => (
  <div className="mb-4">
    <label
      className="block text-gray-700 text-sm font-bold mb-2"
      htmlFor={name}
    >
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`shadow appearance-none border ${
        error ? "border-red-500" : ""
      } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
      autoComplete="off"
    />
    {error && <p className="text-red-500 text-xs italic">{error}</p>}
  </div>
);

export default SignUp;