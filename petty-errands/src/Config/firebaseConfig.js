import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD2d2tBnKI2-JS0j8tWl2YzVntjXl9FIOU",
  authDomain: "petty-errands.firebaseapp.com",
  projectId: "petty-errands",
  storageBucket: "petty-errands.appspot.com",
  messagingSenderId: "1039425128802",
  appId: "1:1039425128802:web:b75143d04e99714bff843b",
  measurementId: "G-RN24Q4PM7W"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await auth.signInWithPopup(googleAuthProvider);
    if (result) {
      const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
      const token = credential ? credential.accessToken : null;
      const user = result.user;
      return { user, token };
    } else {
      throw new Error("Google Sign In Failed: No result returned.");
    }
  } catch (error) {
    console.error("Google Sign In Failed:", error);
    throw error;
  }
};
const getUserRole = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.role || 'user'; // Assuming 'role' field exists in user document
    } else {
      console.error('User document not found');
      return 'user'; // Return default role if user document doesn't exist
    }
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Return default role on error
  }
};



export { auth, db, firebase, getUserRole, signInWithGoogle, storage };
