import React, { useContext } from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import GetData from "./GetData";
import MyCalendar from "./MyCalendar";
import Locker from "./Locker";
import FindUser from "./ManageUser/FindUser";
import SelectUser from "./ManageUser/SelectUser";
import ModifyUser from "./ManageUser/ModifyUser";
import WeekCalendar from "./WeekCalendar";

const Stack = createStackNavigator();
const MyStack = () => {
  const { signOut } = useContext(AuthContext);

  return (
    <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen
        name="HomeScreen"
        component={Home}
        options={{ title: "Home" }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "사용자 정보",
          headerLeft: () => {},
          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 10,
                width: "100%",
                height: "60%",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={signOut}
            >
              <Text>로그아웃</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="Calendar" component={MyCalendar} />
      <Stack.Screen name="GetData" component={GetData} />
      <Stack.Screen name="Locker" component={Locker} />
      <Stack.Screen name="FindUser" component={FindUser} />
      <Stack.Screen name="SelectUser" component={SelectUser} />
      <Stack.Screen name="ModifyUser" component={ModifyUser} />
      <Stack.Screen name="WeekCalendar" component={WeekCalendar} />
    </Stack.Navigator>
  );
};

export default AuthSuccess = ({ navigation, route }) => {
  return <MyStack />;
};
