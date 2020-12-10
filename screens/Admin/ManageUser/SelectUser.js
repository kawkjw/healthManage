import React, { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

export default SelectUser = ({ navigation, route }) => {
  const [findUsers, setFindUsers] = useState([]);

  useEffect(() => {
    const getUserInfo = async () => {
      const { name, phoneNumber } = route.params;
      let users = [];
      if (name !== "" && phoneNumber !== "") {
        (
          await db
            .collection("users")
            .where("name", "==", name)
            .where("phoneNumber", "==", phoneNumber)
            .get()
        ).forEach((doc) => {
          users.push(doc.data());
        });
      } else if (name !== "") {
        (await db.collection("users").where("name", "==", name).get()).forEach(
          (doc) => {
            users.push(doc.data());
          }
        );
      } else if (phoneNumber !== "") {
        (
          await db
            .collection("users")
            .where("phoneNumber", "==", phoneNumber)
            .get()
        ).forEach((doc) => {
          users.push(doc.data());
        });
      }
      setFindUsers(users);
    };
    getUserInfo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={findUsers}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "column", margin: 5 }}>
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.replace("ModifyUser", {
                  user: item,
                })
              }
            >
              <Text>{item.name}</Text>
              <Text>{item.phoneNumber}</Text>
            </TouchableOpacity>
          </View>
        )}
        numColumns={3}
        keyExtractor={(item, index) => index}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  item: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: wp("30%"),
    height: wp("30%"),
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 10,
  },
});
