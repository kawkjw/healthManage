import firebase from "firebase";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNRrX_KHSjaEIzkC0gYE-qLyiMs6XWHBo",
  authDomain: "test-app-kawk.firebaseapp.com",
  databaseURL: "https://test-app-kawk.firebaseio.com",
  projectId: "test-app-kawk",
  storageBucket: "test-app-kawk.appspot.com",
  messagingSenderId: "447709582973",
  appId: "1:447709582973:web:b4339a86b175091c234314",
  measurementId: "G-Y6MRF0JZMK",
};

const myBase = firebase.initializeApp(firebaseConfig);

export default myBase;
export const db = myBase.firestore();
export const arrayDelete = (d) => firebase.firestore.FieldValue.arrayRemove(d);
