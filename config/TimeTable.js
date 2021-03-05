import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { TextSize } from "../css/MyStyles";

export default TimeTable = ({ classData, kind = "pt", nameList = {}, style, ...props }) => {
    const [timeLabel, setTimeLabel] = useState([]);
    const [data, setData] = useState([]);

    useEffect(() => {
        const initialTimeLabelList = () => {
            const start = 7;
            let list = [];
            for (let i = 0; i < 18; i++) {
                let temp = start + i;
                list.push(temp < 10 ? "0" + temp + ":00" : temp + ":00");
            }
            setTimeLabel(list);
        };
        const initialDataList = () => {
            let list = [];
            classData.forEach((v) => {
                let temp = {};
                temp["name"] = v.name;
                let classList = new Array(18).fill({});
                v.classes.map((c) => {
                    if (c !== -1) {
                        if (kind === "pt") {
                            classList[c.start - 7] = {
                                time: c.start < 10 ? "0" + c.start + ":00" : c.start + ":00",
                                kind: kind,
                                hasClass: true,
                                classInfo: {
                                    clientName: c.clientName,
                                    remainCount: c.remainCount,
                                },
                            };
                        }
                    }
                });
                temp["classes"] = classList;
                list.push(temp);
            });
            list.sort((a, b) => {
                if (a.name > b.name) return 1;
                if (a.name < b.name) return -1;
                return 0;
            });
            setData(list);
        };
        initialTimeLabelList();
        initialDataList();
    }, []);

    return (
        <SafeAreaView style={[{ backgroundColor: "white" }, style]}>
            <View
                style={{
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderTopWidth: 1,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRightWidth: 1,
                    }}
                >
                    <View
                        style={{
                            height: hp("4%"),
                            justifyContent: "center",
                            borderBottomWidth: 1,
                            alignSelf: "stretch",
                            alignItems: "center",
                        }}
                    >
                        <Text style={TextSize.largeSize}>Time</Text>
                    </View>
                    {timeLabel.map((label, index) => (
                        <View
                            key={index}
                            style={[
                                {
                                    height: hp("4%"),
                                    alignItems: "center",
                                    alignSelf: "stretch",
                                    justifyContent: "center",
                                },
                                index !== timeLabel.length - 1
                                    ? {
                                          borderBottomWidth: 1,
                                          borderBottomColor: "#e6e6e6",
                                      }
                                    : undefined,
                            ]}
                        >
                            <Text style={TextSize.largeSize}>{label}</Text>
                        </View>
                    ))}
                </View>
                <View style={{ flex: 7 }}>
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        scrollEnabled={data.length > 3}
                    >
                        {data.map((d, index) => (
                            <View
                                key={index}
                                style={[
                                    {
                                        width: wp("35%"),
                                        alignItems: "center",
                                    },
                                    index !== data.length - 1 ? { borderRightWidth: 1 } : undefined,
                                ]}
                            >
                                <View
                                    style={{
                                        height: hp("4%"),
                                        justifyContent: "center",
                                        alignItems: "center",
                                        alignSelf: "stretch",
                                        borderBottomWidth: 1,
                                    }}
                                >
                                    <Text style={TextSize.largeSize}>{d.name}</Text>
                                </View>
                                {d.classes.map((c, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            {
                                                alignSelf: "stretch",
                                                height: hp("4%"),
                                                alignItems: "center",
                                                justifyContent: "center",
                                            },
                                            index !== d.classes.length - 1
                                                ? {
                                                      borderBottomWidth: 1,
                                                      borderBottomColor: "#e6e6e6",
                                                  }
                                                : undefined,
                                            c.hasClass
                                                ? {
                                                      backgroundColor: "#99ccff",
                                                      borderWidth: 1,
                                                      borderColor: "#80bfff",
                                                  }
                                                : undefined,
                                        ]}
                                    >
                                        <Text>
                                            {c.hasClass
                                                ? c.kind === "pt"
                                                    ? c.classInfo.remainCount === -1
                                                        ? c.classInfo.clientName +
                                                          " PT(회원권 없음)"
                                                        : c.classInfo.clientName +
                                                          " PT (" +
                                                          c.classInfo.remainCount +
                                                          "회 남음)"
                                                    : (nameList[c.classInfo.className] !== undefined
                                                          ? nameList[c.classInfo.className].ko
                                                          : "Error") +
                                                      " (" +
                                                      c.classInfo.currentClient +
                                                      "/" +
                                                      c.classInfo.maxClient +
                                                      ")"
                                                : undefined}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};
