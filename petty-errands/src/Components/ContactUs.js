import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEnvelope, FaMapMarker, FaPhone } from "react-icons/fa";
import contactpic from "../Images/contactpic.jpg";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (success) {
      // Clear input fields after sending message
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }
  }, [success]);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendMessage = async () => {
    try {
      setLoading(true);

      const formData = {
        name,
        email,
        subject,
        message,
      };

      const response = await axios.post(
        "https://us-central1-petty-errands.cloudfunctions.net/sendContactMessage",
        formData
      );
      console.log(response.data); // Log the response from the Cloud Function

      setSuccess("Message sent successfully.");
      setError("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Error sending message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div style={{ width: "75%" }}>
        <img
          src={contactpic}
          alt="contactpic"
          className="mx-auto  w-full h-auto"
        />
      </div>
      <div className="flex flex-col lg:flex-row p-5 mt-9">
        <div className="bg-gray-300 p-8 mb-4 lg:mb-0 lg:mr-4 w-full lg:w-2/3 flex items-center">
          <FaEnvelope className="mr-2" />
          <span>support@domainstore.com</span>
        </div>
        <div className="bg-gray-300 p-8 mb-4 lg:mb-0 lg:mr-4 w-full lg:w-2/3 flex items-center">
          <FaPhone className="mr-2" />
          <span>(+84) 0123456789</span>
        </div>
        <div className="bg-gray-300 p-8 mb-4 lg:mb-0 lg:mr-4 w-full lg:w-1/2 flex items-center">
          <FaMapMarker className="mr-2" />
          <span>
            123 Suspendis mattis, Sollicitudin District, Accums Fringilla
          </span>
        </div>
      </div>

      <div className="flex md:flex-row flex-col">
        <div className="md:w-[50%] w-[90%] mx-auto bg-white flex flex-col md:p-12 p-4 items-start">
          <iframe
            title="Kenya Map"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4963882.175843201!2d36.821899949999995!3d-1.29206695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ske!4v1638071810961!5m2!1sen!2ske"
          ></iframe>
        </div>

        <div className="md:w-[50%] w-[90%] mx-auto bg-white flex flex-col  md:p-12 p-4 items-start ">
          <div className="flex gap-2 mb-4 font-bold text-2xl">
            SEND YOUR INQUIRIES
          </div>
          <p className="text-gray-500 mb-4">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam.
          </p>
          {/* <hr className="my-1 w-[70%]  border-dashed border-gray-500" /> */}

          {/* <p className="text-gray-500 text-m">Tel: +254 796 807 933</p>
          <p className="text-gray-500 mb-4">Email: info@gictdigitalgreen.org</p> */}

          <div className="flex flex-col gap-4">
            <input
              type="name"
              placeholder="Your name"
              className="p-2 border border-gray-500"
              style={{ width: "500px" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your email"
              className="p-2 border border-gray-500 "
              style={{ width: "500px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              placeholder="Your subject"
              className="p-2 border border-gray-500"
              style={{ width: "500px" }}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              placeholder="Your message"
              className="p-2 border border-gray-500"
              rows={4}
              style={{ width: "500px" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="px-4 py-2 w-fit bg-blue-500 text-white  transition duration-500 ease-in-out hover:bg-blue-700"
              onClick={handleSendMessage}
            >
              SEND MESSAGE
            </button>
            {loading && <p className="text-blue-500">Sending...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
