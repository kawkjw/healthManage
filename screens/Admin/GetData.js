import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, Button } from "react-native";
import { db } from "../../config/MyBase";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default GetData = ({ navigation }) => {
  const [collectionName, setCollectionName] = useState("");
  const getCollection = async () => {
    let data = [];
    await db
      .collection(collectionName)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          data.push(doc.data());
        });
        console.log(data);
      })
      .catch((error) => console.log(error));
    return data;
  };
  const writeToCsv = async () => {
    const csv = await getCollection();
    const currentDate = new Date();
    let header = "\uFEFF";
    let key = [];
    for (let index in csv[0]) {
      header = header + index + ",";
      key.push(index);
    }
    header = header.slice(0, -1) + "\r\n";

    const filename =
      currentDate.toLocaleDateString() +
      " T" +
      [
        currentDate.getHours().toString(),
        currentDate.getMinutes().toString(),
        currentDate.getSeconds().toString(),
      ].join(".");

    const pathToWrite =
      FileSystem.cacheDirectory + `${encodeURI(filename)}.csv`;

    let str = "";
    for (let i = 0; i < csv.length; i++) {
      let line = "";
      for (let j = 0; j < Object.keys(csv[i]).length; j++) {
        if (line != "") line = line + ",";
        line = line + csv[i][key[j]];
      }
      str = str + line + "\r\n";
    }
    const csvString = header + str;
    try {
      await FileSystem.writeAsStringAsync(pathToWrite, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(pathToWrite);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const checkAdmin = async () => {
      await db
        .collection("users")
        .doc(await AsyncStorage.getItem("userToken"))
        .get()
        .then((user) => {
          const data = user.data();
          if (data.permission !== 0) {
            navigation.goBack();
          }
        });
    };
    checkAdmin();
  }, []);
  return (
    <SafeAreaView>
      <Text>download db</Text>
      <TextInput
        style={{ borderWidth: 1 }}
        autoFocus={true}
        value={collectionName}
        onChangeText={setCollectionName}
      />
      <Button title="download collection" onPress={writeToCsv} />
    </SafeAreaView>
  );
};
