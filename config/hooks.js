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
        })
        .catch((error) => {
            console.log("getholiday", error);
        });
    let holidayList = Array(endDate.getDate() + 1).fill(false);
    holidayJson.forEach((holiday) => {
        if (holiday.isHoliday === "Y") {
            holidayList[Number(holiday.locdate.toString().substr(-2))] = true;
        }
    });
    return holidayList;
};

export const displayedAt = (createdAt) => {
    const milliSeconds = new Date() - createdAt;
    const seconds = milliSeconds / 1000;
    if (seconds < 60) return `방금 전`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}분 전`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}시간 전`;
    const days = hours / 24;
    if (days < 7) return `${Math.floor(days)}일 전`;
    const weeks = days / 7;
    if (weeks < 5) return `${Math.floor(weeks)}주 전`;
    const months = days / 30;
    if (months < 12) return `${Math.floor(months)}개월 전`;
    const years = days / 365;
    return `${Math.floor(years)}년 전`;
};

export const checkBatchimEnding = (word) => {
    if (typeof word !== "string") return null;

    var lastLetter = word[word.length - 1];
    var uni = lastLetter.charCodeAt(0);

    if (uni < 44032 || uni > 55203) return null;

    return (uni - 44032) % 28 != 0;
};

export const priceToString = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
