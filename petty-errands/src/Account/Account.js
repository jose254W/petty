import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BsCalendar, BsEnvelope, BsTelephone } from "react-icons/bs";
import { FaChevronDown } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { firebase } from "../Config/firebaseConfig";

function Account() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedGender, setSelectedGender] = useState("male");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState(null);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aboutYou, setAboutYou] = useState("");
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
    state: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          toast.error("User not authenticated.");
          return;
        }

        const userId = user.uid;
        const userRef = firebase.firestore().collection("users").doc(userId);
        const userData = await userRef.get();

        if (userData.exists) {
          const userDataObj = userData.data();
          setEmail(userDataObj.email || "");
          setPhoneNumber(userDataObj.phone || "");
          setFullName(userDataObj.username || ""); // Assuming username is stored as 'username' in Firestore
          setAddress(userDataObj.address || "");
          setBillingInfo(userDataObj.billingInfo || {});
          setSelectedGender(userDataObj.gender || "male");
          setDob(
            userDataObj.dob ? new Date(userDataObj.dob.seconds * 1000) : null
          );
          // Autofill profile picture if available
          if (userDataObj.profilePicture) {
            const profilePictureRef = firebase
              .storage()
              .refFromURL(userDataObj.profilePicture);
            try {
              const profilePictureURL =
                await profilePictureRef.getDownloadURL();
              console.log("Profile Picture URL:", profilePictureURL);
              setProfilePicture(profilePictureURL);
            } catch (error) {
              console.error("Error fetching profile picture URL:", error);
              toast.error(
                "Error fetching profile picture. Please try again later."
              );
            }
          }
        } else {
          toast.error("User profile does not exist.");
        }
      } catch (error) {
        console.error("Error fetching user profile information:", error);
        toast.error(
          "Error fetching user profile information. Please try again later."
        );
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    setProfilePicture(file);
  };

  // Update the JSX accordingly
  <img
    src={profilePicture && profilePicture}
    alt="Profile Preview"
    className="w-40 h-40 rounded-full object-cover"
  />;

  // Additionally, remember to revoke the object URL when component unmounts
  useEffect(() => {
    return () => {
      if (profilePicture) {
        URL.revokeObjectURL(profilePicture);
      }
    };
  }, [profilePicture]);

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
  };

  const handleGenderChange = (event) => {
    setSelectedGender(event.target.value);
  };

  const handleDateChange = (date) => {
    setDob(date);
  };

  const handleUpdateAccount = async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        toast.error("User not authenticated.");
        return;
      }

      const userId = user.uid;
      const userRef = firebase.firestore().collection("users").doc(userId);

      // Upload profile picture if available
      let profilePictureURL = null;
      if (profilePicture) {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`profilePictures/${userId}`);
        await fileRef.put(profilePicture);
        profilePictureURL = await fileRef.getDownloadURL();
      }

      const userData = {
        username: fullName,
        email,
        dob: dob ? firebase.firestore.Timestamp.fromDate(dob) : null,
        address,
        billingInfo,
        phone: phoneNumber,
        gender: selectedGender,
        profilePicture: profilePictureURL, // Save profile picture URL to Firestore
      };

      await userRef.set(userData, { merge: true }); // Merge with existing data if exists

      toast.success("Information Updated successfully!");
    } catch (error) {
      toast.error("Error updating user information:", error);
    }
  };

  const handleBillingChange = (e) => {
    setBillingInfo({ ...billingInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-3xl mt-10 mb-4 text-center">
        Account Information
      </h1>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col items-center">
            <label
              htmlFor="profilePicture"
              className="block mb-2 font-semibold text-xl text-center"
            >
              Profile Picture
            </label>
            <div className="relative">
              {profilePicture ? (
                <>
                  <img
                    src={profilePicture && profilePicture}
                    alt="Profile Preview"
                    className="w-40 h-40 rounded-full object-cover"
                  />

                  <button
                    onClick={handleRemoveProfilePicture}
                    className="absolute top-0 right-0 bg-black text-white p-1 rounded-3xl w-7"
                  >
                    X
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    document.getElementById("profilePictureInput").click()
                  }
                  className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <span className="text-gray-500">Add Image</span>
                </button>
              )}
              {!profilePicture && (
                <input
                  type="file"
                  id="profilePictureInput"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                />
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block mb-2 font-semibold text-xl"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
            />

            <label htmlFor="email" className="block mb-2 font-semibold text-xl">
              Email
            </label>
            <div className="flex items-center">
              <BsEnvelope className="mr-2 text-xl" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full text-xl p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>

            <label htmlFor="dob" className="block mb-2 font-semibold text-xl">
              Date of Birth
            </label>
            <div className="flex items-center border border-solid">
              <BsCalendar className="mr-2 ml-1 text-xl" />
              <DatePicker
                selected={dob}
                onChange={handleDateChange}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select Date"
                className="w-full p-2 mb-2 focus:outline-none text-xl"
                maxDate={new Date()}
              />
            </div>

            <label
              htmlFor="address"
              className="block mb-2 font-semibold text-xl"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
            />

            <label
              htmlFor="gender"
              className="block mb-2 font-semibold text-xl"
            >
              Gender
            </label>
            <div className="relative">
              <select
                id="gender"
                value={selectedGender}
                onChange={handleGenderChange}
                className="w-full text-xl p-2 mb-2 focus:outline-none appearance-none bg-white border border-gray-300 rounded-md pr-8"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute top-0 right-0 p-2 pointer-events-none">
                <FaChevronDown />
              </div>
            </div>

            <label
              htmlFor="phoneNumber"
              className="block mb-2 font-semibold text-xl"
            >
              Phone Number
            </label>
            <div className="flex items-center">
              <BsTelephone className="mr-2 text-xl" />
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Billing */}
          <div className="col-span-2">
            <h2 className="text-5xl mb-4 font-bold text-start mb-16">
              Billing Address:
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mt-4 text-gray-700 text-lg font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={billingInfo.firstName}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={billingInfo.lastName}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={billingInfo.addressLine1}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={billingInfo.addressLine2}
                  onChange={handleBillingChange}
                  className="form-input w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={billingInfo.city}
                  onChange={handleBillingChange}
                  className="form-input w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  name="postcode"
                  value={billingInfo.postcode}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={billingInfo.country}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={billingInfo.state}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={billingInfo.phone}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-lg font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={billingInfo.email}
                  onChange={handleBillingChange}
                  className="form-input  w-96 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdateAccount}
          className="bg-gray-700 text-white p-2 rounded-3xl mt-4"
        >
          Update Account
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Account;
