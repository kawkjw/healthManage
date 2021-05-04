import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { db } from "../../../config/MyBase";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { TextSize, theme } from "../../../css/MyStyles";
import { Text, ActivityIndicator, Surface } from "react-native-paper";

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
        <View
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
                    <ActivityIndicator animating={true} size="large" color="black" />
                </View>
            ) : findUsers.length !== 0 ? (
                <FlatList
                    data={findUsers}
                    renderItem={({ item }) => (
                        <Surface
                            style={{
                                flexDirection: "column",
                                margin: 5,
                                elevation: 4,
                                borderRadius: 10,
                            }}
                        >
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
                        </Surface>
                    )}
                    numColumns={3}
                    keyExtractor={(item, index) => index}
                />
            ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={TextSize.largeSize}>검색 결과가 없습니다.</Text>
                </View>
            )}
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
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
        borderRadius: 10,
    },
});
