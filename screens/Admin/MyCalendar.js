import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  SafeAreaView,
  Keyboard,
  TextInput,
  Image,
} from "react-native";
import { Agenda } from "react-native-calendars";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import myBase, { db, arrayDelete } from "../../config/MyBase";
import { getStatusBarHeight } from "react-native-status-bar-height";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { AuthStyles, MyStyles } from "../../css/MyStyles";

export default MyCalendar = () => {
  const [items, setItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [todayDate, setTodayDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalNewClass, setModalNewClass] = useState(false);
  const today = new Date();
  const [clientName, setClientName] = useState("");
  const [classStartDate, setClassStartDate] = useState(new Date());
  const [classEndDate, setClassEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");

  const classDB = db
    .collection("users")
    .doc(myBase.auth().currentUser.uid)
    .collection("classes");

  const restoreItems = async () => {
    setIsLoading(true);
    let data = {};
    setTodayDate(today.toISOString().split("T")[0]);
    const thisDate = new Date(today.getFullYear(), today.getMonth(), 2);
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 2);
    const lastDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const nextLastDate = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0
    ).getDate();
    const thisMonthString = thisDate.toISOString().substring(0, 7);
    const nextMonthString = nextDate.toISOString().substring(0, 7);

    const getItemsFromDB = async (monthString) => {
      await classDB
        .doc(monthString)
        .get()
        .then(async (doc) => {
          const toDoArray = doc.data().class;
          toDoArray.forEach(async (toDo) => {
            await classDB
              .doc(monthString)
              .collection(toDo)
              .orderBy("start", "asc")
              .get()
              .then((documents) => {
                documents.forEach((document) => {
                  const itemData = document.data();
                  const start = itemData.start.toDate();
                  const end = itemData.end.toDate();
                  data[monthString + "-" + toDo].push({
                    name: itemData.clientName,
                    start:
                      start.getHours() +
                      ":" +
                      (start.getMinutes() === 0 ? "00" : start.getMinutes()),
                    end:
                      end.getHours() +
                      ":" +
                      (end.getMinutes() === 0 ? "00" : end.getMinutes()),
                    startDate: start,
                    id: document.id,
                  });
                });
              });
          });
        })
        .catch((error) => {
          classDB.doc(monthString).set({ class: [] });
        });
    };

    for (let i = 1; i <= lastDate; i++) {
      let day = i < 10 ? "0" + i : i;
      const timeString = thisMonthString + "-" + day.toString();
      data[timeString] = [];
    }
    for (let i = 1; i <= nextLastDate; i++) {
      let day = i < 10 ? "0" + i : i;
      const timeString = nextMonthString + "-" + day.toString();
      data[timeString] = [];
    }
    await getItemsFromDB(thisMonthString);
    await getItemsFromDB(nextMonthString);
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    restoreItems();

    const start_date = new Date(today.getFullYear(), today.getMonth(), 2)
      .toISOString()
      .split("T")[0];
    const end_date = new Date(today.getFullYear(), today.getMonth() + 2, 1)
      .toISOString()
      .split("T")[0];
    setStartDate(start_date);
    setEndDate(end_date);
  }, []);

  const removeClass = async (id, date) => {
    const docName = [
      date.getFullYear().toString(),
      (date.getMonth() + 1).toString(),
    ].join("-");
    const dateId =
      date.getDate() < 10 ? "0" + date.getDate() : date.getDate().toString();
    await classDB
      .doc(docName)
      .collection(dateId)
      .doc(id)
      .delete()
      .then(async () => {
        await classDB
          .doc(docName)
          .collection(dateId)
          .get()
          .then(async (snapshots) => {
            if (snapshots.empty) {
              await classDB.doc(docName).update({ class: arrayDelete(dateId) });
            }
          });
        Alert.alert("Success", "Delete Success", [
          { text: "OK", onPress: () => restoreItems() },
        ]);
      });
  };

  const renderItem = (item) => {
    return (
      <View style={{ height: 100 }}>
        <TouchableOpacity
          style={[styles.item]}
          onPress={() =>
            Alert.alert("", item.name, [
              {
                text: "Delete",
                onPress: () => {
                  Alert.alert("Are you sure?", "", [
                    { text: "Cancel" },
                    {
                      text: "Delete",
                      onPress: () => removeClass(item.id, item.startDate),
                      style: "destructive",
                    },
                  ]);
                },
                style: "destructive",
              },
              { text: "OK" },
            ])
          }
        >
          <Text>
            {item.start}~{item.end}
          </Text>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyDate = () => {
    return (
      <View style={styles.emptyDate}>
        <View style={{ borderWidth: 1, borderColor: "#e6e6e6" }}></View>
      </View>
    );
  };

  const rowHasChanged = (r1, r2) => {
    return r1.name !== r2.name;
  };

  const showDateStartPicker = () => {
    Keyboard.dismiss();
    setShowStartPicker(true);
    setPickerMode("date");
  };

  const showTimeStartPicker = () => {
    Keyboard.dismiss();
    setShowStartPicker(true);
    setPickerMode("time");
  };

  const showDateEndPicker = () => {
    Keyboard.dismiss();
    setShowEndPicker(true);
    setPickerMode("date");
  };

  const showTimeEndPicker = () => {
    Keyboard.dismiss();
    setShowEndPicker(true);
    setPickerMode("time");
  };

  const startPickerOnChange = (date) => {
    setShowStartPicker(!showStartPicker);
    setClassStartDate(date);
    setClassEndDate(date);
  };

  const endPickerOnChange = (date) => {
    setShowEndPicker(!showEndPicker);
    setClassEndDate(date);
  };

  const createNewClass = async () => {
    if (clientName.length !== 0) {
      const startDocId = [
        classStartDate.getFullYear().toString(),
        classStartDate.getMonth() + 1 < 10
          ? "0" + (classStartDate.getMonth() + 1)
          : (classStartDate.getMonth() + 1).toString(),
      ].join("-");
      const startDate =
        classStartDate.getDate() < 10
          ? "0" + classStartDate.getDate().toString()
          : classStartDate.getDate().toString();
      await classDB.doc(startDocId).collection(startDate).add({
        clientName: clientName,
        start: classStartDate,
        end: classEndDate,
      });
      await classDB
        .doc(startDocId)
        .get()
        .then(async (doc) => {
          const toDoArray = doc.data().class;
          if (toDoArray.indexOf(startDate) === -1) {
            toDoArray.push(startDate);
            await classDB.doc(startDocId).update({ class: toDoArray.sort() });
          }
        })
        .catch((error) => {
          classDB.doc(startDocId).set({ class: [startDate] });
        });
      Alert.alert("Success", "Create new class", [
        {
          text: "OK",
          onPress: async () => {
            setModalNewClass(false);
            setClientName("");
            await restoreItems();
          },
        },
      ]);
    } else {
      Alert.alert("Failure", "Input Client name");
    }
  };

  const getClassDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return year + ". " + month + ". " + day + ".";
  };

  const getClassTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "오후 " : "오전 ";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return ampm + hours + ":" + minutes;
  };

  return (
    <>
      {isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            style={{ width: 50, height: 50 }}
            source={require("../../assets/loading.gif")}
          />
        </View>
      ) : (
        <>
          <Agenda
            items={items}
            //loadItemsForMonth={(month) => {
            //    loadItems();
            //}}
            selected={todayDate}
            renderItem={(item) => {
              //console.log(item);
              return renderItem(item);
            }}
            renderEmptyDate={renderEmptyDate}
            rowHasChanged={rowHasChanged}
            minDate={startDate}
            maxDate={endDate}
            onRefresh={() => restoreItems()}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              restoreItems();
            }}
            style={[styles.floatButton, styles.refreshButton]}
          >
            <MaterialIcons name="refresh" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setClassStartDate(new Date());
              setClassEndDate(new Date());
              setModalNewClass(true);
            }}
            style={[styles.floatButton, styles.addButton]}
          >
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
      <Modal animationType="slide" visible={modalNewClass} transparent={true}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "white",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? getStatusBarHeight() : 0,
              left: 5,
              margin: 10,
              padding: 5,
              zIndex: 1,
            }}
            onPress={() => {
              setModalNewClass(false);
              setClientName("");
            }}
          >
            <Text style={{ fontSize: 17 }}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              Keyboard.dismiss();
              setShowStartPicker(false);
              setShowEndPicker(false);
            }}
            accessible={false}
            activeOpacity={1}
          >
            <View style={{ flex: 1 }} />
            <View style={{ flex: 8, paddingHorizontal: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text>Client Name:</Text>
                </View>
                <View style={{ flex: 3 }}>
                  <TextInput
                    style={AuthStyles.textInput}
                    value={clientName}
                    onChangeText={setClientName}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 20,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text>Start:</Text>
                </View>
                <View style={{ flex: 2, alignItems: "center" }}>
                  <TouchableOpacity onPress={showDateStartPicker}>
                    <Text style={AuthStyles.authText}>
                      {getClassDate(classStartDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 2, alignItems: "center" }}>
                  <TouchableOpacity onPress={showTimeStartPicker}>
                    <Text style={AuthStyles.authText}>
                      {getClassTime(classStartDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DateTimePickerModal
                isVisible={showStartPicker}
                mode={pickerMode}
                date={classStartDate}
                onConfirm={startPickerOnChange}
                onCancel={() => setShowStartPicker(false)}
              />
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 20,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text>End:</Text>
                </View>
                <View style={{ flex: 2, alignItems: "center" }}>
                  <TouchableOpacity onPress={showDateEndPicker}>
                    <Text style={AuthStyles.authText}>
                      {getClassDate(classEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 2, alignItems: "center" }}>
                  <TouchableOpacity onPress={showTimeEndPicker}>
                    <Text style={AuthStyles.authText}>
                      {getClassTime(classEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DateTimePickerModal
                isVisible={showEndPicker}
                mode={pickerMode}
                date={classEndDate}
                onConfirm={endPickerOnChange}
                onCancel={() => setShowEndPicker(false)}
              />
              <TouchableOpacity
                style={[
                  MyStyles.buttonShadow,
                  {
                    aspectRatio: 6,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                onPress={createNewClass}
              >
                <Text>Submit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: "white",
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 32,
    marginRight: 10,
    justifyContent: "center",
  },
  floatButton: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 50,
    ...Platform.select({
      ios: {
        shadowColor: "#c6c6c6",
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  addButton: {
    right: 30,
    bottom: 30,
    backgroundColor: "#66d9ff",
  },
  refreshButton: {
    right: 30,
    bottom: 90,
    backgroundColor: "white",
  },
});
