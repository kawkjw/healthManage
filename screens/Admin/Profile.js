import React, { useContext, useEffect, useState } from "react";
import { Button, SafeAreaView, Text } from "react-native";
import myBase, { db } from "../../config/MyBase";
import { AuthContext } from "../Auth";
import { pushNotificationsToAdmin } from "../../config/MyExpo";

export default Profile = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [permit, setPermit] = useState(2);
  const uid = myBase.auth().currentUser.uid;
  const getUserData = async () => {
    if (uid !== null) {
      const thisuser = db.collection("users").doc(uid);
      await thisuser.get().then((user) => {
        if (user.exists) {
          setPhoneNumber(user.data().phoneNumber);
          if (user.data().permission === 2) {
            signOut();
          } else {
            setPermit(user.data().permission);
          }
        }
      });
    }
  };

  useEffect(() => {
    getUserData();
  }, []);
  return (
    <SafeAreaView>
      <Text>Profile</Text>
      <Text>{phoneNumber}</Text>
      <Text>{permit === 0 ? "You are Admin" : "You are Client"}</Text>
      <Button
        title="Test Notification"
        onPress={() => pushNotificationsToAdmin("Test", "Notification")}
      />
    </SafeAreaView>
  );
};
