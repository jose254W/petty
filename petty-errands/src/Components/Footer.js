import React from "react";
import {
  FaEnvelope,
  FaFacebook,
  FaGooglePlus,
  FaInstagram,
  FaMapMarker,
  FaPhone,
  FaPinterest,
  FaTwitter,
} from "react-icons/fa";
import applogo from '../Images/applogo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-200 text-gray-700 p-6 mt-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <img src={applogo} alt="App Logo" className="h-12 w-64 ml-4 mr-2" />
        </div>
        <div className="text-center ml-4">
          <div className="text-left">
            <h3 className="text-2xl mb-6 font-bold">CONTACT US</h3>
            <p className="flex items-center mb-2">
              <FaMapMarker className="text-xl mr-2" />
              Address: No 40 Baria Street 133/2 NewYork City, NY, United States
            </p>
            <p className="flex items-center mb-2">
              <FaEnvelope className="text-xl mr-2" />
              Email: contact@Revoshop.com
            </p>
            <div className="flex items-center mb-2">
              <FaPhone className="text-xl mr-2" />
              <div>
                Phone 1: 0123456789
                <br />
                Phone 2: 0123456789
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mb-4">
        <p className="text-lg font-bold mb-2 mt-4 mr-4">FOLLOW US</p>
        <a
          href="https://www.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebook className="text-2xl mx-2" />
        </a>
        <a
          href="https://twitter.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaTwitter className="text-2xl mx-2" />
        </a>
        <a
          href="https://www.pinterest.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaPinterest className="text-2xl mx-2" />
        </a>
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram className="text-2xl mx-2" />
        </a>
        <a
          href="https://plus.google.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGooglePlus className="text-2xl mx-2" />
        </a>
      </div>
      <p className="text-center text-sm mt-auto">
        &copy;{currentYear} Shopping & Petty Errands. All Rights Reserved. Designed by Shopping & Petty Errands.Com.
      </p>
    </footer>
  );
};

export default Footer;