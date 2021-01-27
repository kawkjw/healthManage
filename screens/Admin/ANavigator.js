import React, { useContext } from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import Locker from "./Locker";
import FindUser from "./ManageUser/FindUser";
import SelectUser from "./ManageUser/SelectUser";
import ModifyUser from "./ManageUser/ModifyUser";

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
            <Stack.Screen name="Locker" component={Locker} />
            <Stack.Screen name="FindUser" component={FindUser} />
            <Stack.Screen name="SelectUser" component={SelectUser} />
            <Stack.Screen name="ModifyUser" component={ModifyUser} />
        </Stack.Navigator>
    );
};

export default ANavigator = ({ navigation, route }) => {
    return <MyStack />;
};
