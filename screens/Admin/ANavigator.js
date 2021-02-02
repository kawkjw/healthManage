import React, { useContext } from "react";
import { Text, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./Home";
import Profile from "./Profile";
import { AuthContext } from "../Auth";
import Locker from "./Locker";
import FindUser from "./ManageUser/FindUser";
import SelectUser from "./ManageUser/SelectUser";
import ClientInfo from "./ClientInfo/ClientInfo";
import SelectMembership from "./ClientInfo/SelectMembership";
import ClientInfoMenu from "./ClientInfoMenu";
import ClientsbyMembership from "./ClientInfo/ClientsbyMembership";
import ShowUser from "./ManageUser/ShowUser";
import ClassInfoMenu from "./ClassInfoMenu";
import GxInfo from "./ClassInfo/GxInfo";
import PtInfo from "./ClassInfo/PtInfo";

const Stack = createStackNavigator();
const MyStack = () => {
    const { signOut } = useContext(AuthContext);

    const enToKo = (s) => {
        switch (s) {
            case "health":
                return "헬스";
            case "spinning":
                return "스피닝";
            case "yogaZoomba":
                return "GX(요가, 줌바)";
            case "squash":
                return "스쿼시";
            case "pilates":
                return "필라테스";
            case "pt":
                return "PT";
        }
    };

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
            <Stack.Screen
                name="FindUser"
                component={FindUser}
                options={{ headerTitle: "고객 검색" }}
            />
            <Stack.Screen
                name="SelectUser"
                component={SelectUser}
                options={{ headerTitle: "검색 결과" }}
            />
            <Stack.Screen
                name="ShowUser"
                component={ShowUser}
                options={{ headerTitle: "고객 정보" }}
            />
            <Stack.Screen
                name="ClientInfoMenu"
                component={ClientInfoMenu}
                options={{ headerTitle: "메뉴" }}
            />
            <Stack.Screen
                name="SelectMembership"
                component={SelectMembership}
                options={{ headerTitle: "이용권 선택" }}
            />
            <Stack.Screen
                name="ClientInfo"
                component={ClientInfo}
                options={{ headerTitle: "모든 고객 정보" }}
            />
            <Stack.Screen
                name="ClientsbyMembership"
                component={ClientsbyMembership}
                options={({ route }) => ({
                    headerTitle: enToKo(route.params.membershipName),
                })}
            />
            <Stack.Screen
                name="ClassInfoMenu"
                component={ClassInfoMenu}
                options={{ headerTitle: "메뉴" }}
            />
            <Stack.Screen
                name="GxInfo"
                component={GxInfo}
                options={{ headerTitle: "GX" }}
            />
            <Stack.Screen
                name="PtInfo"
                component={PtInfo}
                options={{ headerTitle: "PT" }}
            />
        </Stack.Navigator>
    );
};

export default ANavigator = ({ navigation, route }) => {
    return <MyStack />;
};
