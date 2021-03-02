import React, { useEffect, useRef } from "react";
import { SERVICE_KEY } from "@env";

export const useInterval = (callback, delay) => {
    const savedCallBack = useRef();

    useEffect(() => {
        savedCallBack.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = () => {
            savedCallBack.current();
        };
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

export const getHoliday = async (year, month) => {
    const url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";
    let queryParams = "?" + encodeURIComponent("ServiceKey") + "=" + SERVICE_KEY;
    queryParams += "&" + encodeURIComponent("pageNo") + "=" + encodeURIComponent("1");
    queryParams += "&" + encodeURIComponent("numOfRows") + "=" + encodeURIComponent("15");
    queryParams += "&" + encodeURIComponent("solYear") + "=" + encodeURIComponent(year.toString());
    queryParams +=
        "&" +
        encodeURIComponent("solMonth") +
        "=" +
        encodeURIComponent(month < 10 ? "0" + month : month.toString());
    queryParams += "&" + encodeURIComponent("_type") + "=" + encodeURIComponent("json");

    const endDate = new Date(year, month, 0);
    let holidayJson = [];
    await fetch(url + queryParams)
        .then((response) => response.text())
        .then((data) => {
            const {
                response: {
                    body: {
                        totalCount,
                        items: { item },
                    },
                },
            } = JSON.parse(data);
            if (totalCount === 0) {
                holidayJson = [];
            } else if (totalCount === 1) {
                holidayJson = [item];
            } else {
                holidayJson = item;
            }
        });
    let holidayList = Array(endDate.getDate() + 1).fill(false);
    holidayJson.forEach((holiday) => {
        if (holiday.isHoliday === "Y") {
            holidayList[Number(holiday.locdate.toString().substr(-2))] = true;
        }
    });
    return holidayList;
};
