import React, { useState } from 'react';
import { firebase } from '../Config/firebaseConfig';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async () => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        console.error('User not authenticated.');
        return;
      }

      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      window.alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error.message);
      window.alert('Failed to update password. Please check your current password and try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div>
        <h1 className="font-bold text-3xl mt-3 ">Update your password</h1>
        <div className="mt-4">
          <label htmlFor="currentPassword" className="block mb-2 text-xl">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-1/2 p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="newPassword" className="block mb-2 text-xl">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-1/2 p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="confirmPassword" className="block mb-2 text-xl">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-1/2 p-2 mb-2 border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handlePasswordChange}
          className="bg-gray-900 text-white px-4 py-3 rounded-3xl mt-4 text-xl"
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;