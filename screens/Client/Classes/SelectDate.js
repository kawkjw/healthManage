import React, { useEffect, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { MyStyles } from "../../../css/MyStyles";

export default SelectDate = ({ navigation, route }) => {
    const { width } = Dimensions.get("screen");
    const widthButton = width - 40;

    const { classname } = route.params;
    const [sixDate, setSixDate] = useState([]);

    const getDateString = (year, month) => {
        return year + "-" + (month < 10 ? "0" + month : month);
    };

    useEffect(() => {
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let array = [getDateString(year, month)];
        for (let i = 0; i < 6; i++) {
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
        <SafeAreaView style={MyStyles.container}>
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
                        <TouchableOpacity
                            key={i}
                            style={[
                                MyStyles.phoneButton,
                                MyStyles.buttonShadow,
                                { width: widthButton, marginBottom: 20 },
                                i === sixDate.length - 1
                                    ? { marginBottom: 40 }
                                    : undefined,
                            ]}
                            onPress={() =>
                                navigation.navigate("GX", {
                                    classname: classname,
                                    date: d,
                                })
                            }
                        >
                            <Text>{d}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};
