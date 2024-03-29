import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { MyStyles, TextSize, theme } from "../../../css/MyStyles";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Surface, Text } from "react-native-paper";
import ToHome from "../../../components/ToHome";

export default SelectDate = ({ navigation, route }) => {
    const { classname, end } = route.params;
    const [sixDate, setSixDate] = useState([]);

    const getDateString = (year, month) => {
        return year + "-" + (month < 10 ? "0" + month : month);
    };

    useEffect(() => {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let array = [getDateString(year, month)];
        for (let i = 0; i < 5; i++) {
            month = month + 1;
            if (month > 12) {
                month = month - 12;
                year = year + 1;
            }
            array.push(getDateString(year, month));
        }
        setSixDate(array);
    }, []);

    return (
        <View style={MyStyles.container}>
            <ToHome navigation={navigation} />
            <ScrollView
                style={{
                    flex: 1,
                    paddingTop: 20,
                    alignSelf: "stretch",
                }}
                contentContainerStyle={{ alignItems: "center" }}
            >
                {sixDate.map((d, i) => {
                    return (
                        <Surface key={i} style={MyStyles.surface}>
                            <TouchableOpacity
                                style={MyStyles.menu}
                                onPress={() => {
                                    if (classname === "pilates" || classname === "squash") {
                                        navigation.navigate("GX", {
                                            classname: classname,
                                            date: d,
                                            week: route.params.week,
                                            end: end,
                                        });
                                    } else {
                                        navigation.navigate("GX", {
                                            classname: classname,
                                            date: d,
                                            end: end,
                                        });
                                    }
                                }}
                            >
                                <Text style={TextSize.largeSize}>{d}</Text>
                            </TouchableOpacity>
                        </Surface>
                    );
                })}
            </ScrollView>
            <View
                style={{ backgroundColor: theme.colors.primary, height: hp("6%"), width: "100%" }}
            />
        </View>
    );
};
