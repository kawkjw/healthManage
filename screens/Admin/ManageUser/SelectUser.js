import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { db } from "../../../config/MyBase";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { RFPercentage } from "react-native-responsive-fontsize";

export default SelectUser = ({ navigation, route }) => {
    const [findUsers, setFindUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUserInfo = async () => {
            const { name, phoneNumber } = route.params;
            let users = [];
            setLoading(true);
            if (name !== "" && phoneNumber !== "") {
                (
                    await db
                        .collection("users")
                        .where("name", "==", name)
                        .where("phoneNumber", "==", phoneNumber)
                        .where("permission", "==", 2)
                        .get()
                ).forEach((doc) => {
                    users.push(doc.data());
                });
            } else if (name !== "") {
                (
                    await db
                        .collection("users")
                        .where("name", "==", name)
                        .where("permission", "==", 2)
                        .get()
                ).forEach((doc) => {
                    users.push(doc.data());
                });
            } else if (phoneNumber !== "") {
                (
                    await db
                        .collection("users")
                        .where("phoneNumber", "==", phoneNumber)
                        .where("permission", "==", 2)
                        .get()
                ).forEach((doc) => {
                    users.push(doc.data());
                });
            }
            setFindUsers(users);
            setLoading(false);
        };
        getUserInfo();
    }, []);

    return (
        <SafeAreaView
            style={[
                styles.container,
                findUsers.length === 0 ? { alignItems: "center" } : undefined,
            ]}
        >
            {loading ? (
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Image
                        style={{ width: 50, height: 50 }}
                        source={require("../../../assets/loading.gif")}
                    />
                </View>
            ) : findUsers.length !== 0 ? (
                <FlatList
                    data={findUsers}
                    renderItem={({ item }) => (
                        <View style={{ flexDirection: "column", margin: 5 }}>
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() =>
                                    navigation.replace("ShowUser", {
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
            ) : (
                <Text style={{ fontSize: RFPercentage(3) }}>
                    Not Found Client
                </Text>
            )}
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
