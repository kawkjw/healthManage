import React, { useContext } from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import GX from "./Class/GX";
import PT from "./Class/PT";

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
            <Stack.Screen name="GX" component={GX} />
            <Stack.Screen name="PT" component={PT} />
        </Stack.Navigator>
    );
};

export default TNavigator = ({ navigation, route }) => {
    return <MyStack />;
};
