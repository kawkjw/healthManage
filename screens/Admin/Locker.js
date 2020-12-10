import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { db } from "../../config/MyBase";
import Dialog from "react-native-dialog";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

export default Locker = () => {
  const [data, setData] = useState();
  const [selectedLocker, setSelectedLocker] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [visible, setVisible] = useState(false);
  const [changed, setChanged] = useState(true);

  useEffect(() => {
    const getLockers = async () => {
      let items = Array.apply(null, Array(63)).map((value, index) => {
        return {
          id: index + 1,
          occupied: false,
          name: "none",
          phoneNumber: "none",
          uid: "none",
        };
      });
      await db
        .collection("lockers")
        .get()
        .then((lockers) => {
          lockers.forEach((locker) => {
            const { name, phoneNumber, uid } = locker.data();
            items[Number(locker.id) - 1]["name"] = name;
            items[Number(locker.id) - 1]["phoneNumber"] = phoneNumber;
            items[Number(locker.id) - 1]["uid"] = uid;
            items[Number(locker.id) - 1]["occupied"] = true;
          });
        });
      setData(items);
    };
    getLockers();
  }, [changed]);

  useEffect(() => {
    setPhoneNumber(
      phoneNumber
        .replace(/[^0-9]/g, "")
        .replace(
          /(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,
          "$1-$2-$3"
        )
        .replace("--", "-")
    );
  }, [phoneNumber]);

  const removeLocker = async (id) => {
    await db
      .collection("lockers")
      .doc(id.toString())
      .delete()
      .then(() => {
        Alert.alert("Success", "Remove Success", [{ text: "OK" }]);
      })
      .catch((error) => {
        Alert.alert("Failure", "Already Removed", [{ text: "OK" }]);
      });
    setChanged(!changed);
  };

  const handleCancel = () => {
    setPhoneNumber("");
    setVisible(false);
  };

  const addLocker = async () => {
    await db
      .collection("users")
      .where("phoneNumber", "==", phoneNumber)
      .get()
      .then((snapshots) => {
        if (snapshots.empty) {
          throw Error("Not Existed User");
        } else if (snapshots.size > 1) {
          throw Error("Several Phone Number");
        }
        snapshots.forEach(async (snapshot) => {
          const { name, uid } = snapshot.data();
          const phone = snapshot.data().phoneNumber;
          Alert.alert(
            "Info",
            `Name: ${name}\nPhone: ${phone}\nIs that right?`,
            [
              {
                text: "OK",
                onPress: async () => {
                  await db
                    .collection("lockers")
                    .where("uid", "==", uid)
                    .get()
                    .then(async (lockers) => {
                      if (lockers.size > 0) {
                        let lockerNum;
                        lockers.forEach((locker) => {
                          lockerNum = locker.id;
                        });
                        throw Error(`Already Have Locker: ${lockerNum}`);
                      } else {
                        await db
                          .collection("lockers")
                          .doc(selectedLocker.toString())
                          .get()
                          .then((doc) => {
                            if (!doc.exists) {
                              db.collection("lockers")
                                .doc(selectedLocker.toString())
                                .set({
                                  name: name,
                                  phoneNumber: phoneNumber,
                                  uid: uid,
                                });
                            }
                          })
                          .then(() => {
                            Alert.alert("Success", "Add Success", [
                              {
                                text: "OK",
                                onPress: () => {
                                  handleCancel();
                                  setChanged(!changed);
                                },
                              },
                            ]);
                          });
                      }
                    })
                    .catch((error) => {
                      Alert.alert("Failure", error.message);
                    });
                },
              },
              { text: "Cancel" },
            ]
          );
        });
      })
      .catch((error) => {
        Alert.alert("Failure", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Dialog.Container visible={visible}>
        <Dialog.Title>Input phone number</Dialog.Title>
        <Dialog.Input
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={13}
        />
        <Dialog.Button label="Cancel" onPress={handleCancel} />
        <Dialog.Button label="OK" onPress={addLocker} />
      </Dialog.Container>
      <FlatList
        data={data}
        windowSize={1}
        renderItem={({ item }) => (
          <View style={{ flex: 1, flexDirection: "column", margin: 5 }}>
            <TouchableOpacity
              style={styles.locker}
              onPress={() => {
                if (item.occupied) {
                  Alert.alert(
                    item.id.toString(),
                    `${item.name}\n${item.phoneNumber}`,
                    [
                      {
                        text: "Delete",
                        onPress: () => {
                          Alert.alert("Are you sure?", "", [
                            { text: "Cancel" },
                            {
                              text: "Delete",
                              onPress: () => {
                                removeLocker(item.id);
                              },
                              style: "destructive",
                            },
                          ]);
                        },
                        style: "destructive",
                      },
                      { text: "OK" },
                    ]
                  );
                } else {
                  Alert.alert(item.id.toString(), "Not occupied", [
                    {
                      text: "Add",
                      onPress: () => {
                        setSelectedLocker(item.id);
                        setVisible(true);
                      },
                    },
                    { text: "OK" },
                  ]);
                }
              }}
            >
              <Text
                style={{
                  color: item.occupied ? "red" : "blue",
                  fontSize: 30,
                }}
              >
                {item.id}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        numColumns={7}
        keyExtractor={(item, index) => index}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  locker: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: wp("14%"),
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 10,
  },
});
