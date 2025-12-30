import * as hmUI from "@zos/ui";
import {getDeviceInfo} from "@zos/device";
import {Time} from "@zos/sensor";

import * as Styles from "zosLoader:../../pages/style.[pf].layout.js";

import {getTimeStr, showHumanTimeStr} from "../../utils/utils";

export const {TIMER_BTN} = Styles
export const {width: DEVICE_WIDTH} = getDeviceInfo()
const timeSensor = new Time();

let animTimers = {};

// Simple static display for alarms
export function putStaticAlarm(alarmText, vc, y, deleteFunc, editFunc) {
    const tW = Math.floor(TIMER_BTN.w / 1.3);

    // Main alarm display rectangle
    vc.createWidget(hmUI.widget.BUTTON, {
        ...TIMER_BTN,
        y: y,
        w: tW,
        text_size: 32,
        normal_color: TIMER_BTN.normal_color,
        press_color: TIMER_BTN.normal_color,
        text: alarmText,
        click_func: editFunc || (() => {}), // Click to edit alarm
    });

    // Delete button (trashcan)
    let leftMini = 95;
    vc.createWidget(hmUI.widget.BUTTON, {
        ...TIMER_BTN,
        ...Styles.DELETE_BTN,
        text: '',
        h: TIMER_BTN.h,
        x: DEVICE_WIDTH / 2 + leftMini,
        y: y + 5,
        w: TIMER_BTN.w / 5,
        click_func: deleteFunc,
    });
}

function countdown(targetDate, {minusTime, isAlarm}) {
    let percent = 100;
    const now = new Date().getTime();
    const targetTime = targetDate.getTime();
    const timeLeft = targetTime - now;

    if (timeLeft < 0) return {text: 'Finished'};

    const tmp = targetDate
    let startDate = targetTime;
    let endDate = 0;

    if (!isAlarm && minusTime) {
        // For timers, calculate progress bar using duration
        tmp.setHours(
            tmp.getHours() + minusTime.getHours(),
            tmp.getMinutes() + minusTime.getMinutes(),
            tmp.getSeconds() + minusTime.getSeconds(),
        );
        endDate = tmp.getTime();

        const total = endDate - startDate;
        const current = now - startDate;
        percent = Math.abs((current / total) * 100);
    } else if (isAlarm) {
        // For alarms, progress bar shows time until alarm (max 24 hours)
        const maxTime = 24 * 60 * 60 * 1000; // 24 hours
        percent = Math.min(100, ((maxTime - timeLeft) / maxTime) * 100);
    }

    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const text = showHumanTimeStr({
        getHours() {
            return hours
        },
        getMinutes() {
            return minutes
        },
        getSeconds() {
            return seconds
        }
    }, true)

    return {text, percent};
}

export function putLiveTime(name = 'main', vc = hmUI, x, y, click_func) {
    let minusTime, customLabel = null, isAlarm = false;
    if (typeof name === 'object') {
        minusTime = name.dateFromStr;
        customLabel = name.customLabel; // Custom name like "Coffee"
        isAlarm = name.isAlarm || false;
        name = name.alarmTime;
    }
    if (!animTimers[name]) {
        animTimers[name] = {
            timerCount: 0,
            animTimer: null,
            minusTime,
            isAlarm
        };
    }

    const isNotMain = name !== "main";

    function createWid() {
        let text, t, percent;
        if (isNotMain) {
            t = new Date(name * 1000);

            if (animTimers[name].isAlarm) {
                // For alarms: show target time only
                const targetTime = showHumanTimeStr(t, false);
                const obj = countdown(t, animTimers[name]);
                percent = obj.percent || 100;

                if (customLabel) {
                    text = `${customLabel}\n${targetTime}`;
                } else {
                    text = `Alarm\n${targetTime}`;
                }
            } else {
                // For timers: show countdown only
                const obj = countdown(t, animTimers[name])
                text = obj.text;
                percent = obj.percent || 100;
                if (customLabel) {
                    // Custom named timer: show custom name + time (like "Coffee\n05:30")
                    text = `${customLabel}\n${text}`
                }
            }
        } else {
            text = getTimeStr(timeSensor)
        }
        if (isNotMain) {
            let txtSize = 32;
            const tW = Math.floor(TIMER_BTN.w / 1.3)

            const btn = vc.createWidget(hmUI.widget.BUTTON, {
                ...TIMER_BTN,
                y: y || 40,
                w: tW,
                text_size: txtSize,
                press_color: 0x086CB4,
                normal_color: 0x008CDB,
                text,
                click_func,
            });

            animTimers[name].rect = vc.createWidget(hmUI.widget.FILL_RECT, {
                ...TIMER_BTN,
                y,
                w: (tW / 100) * percent,
                text_size: txtSize,
                align_h: hmUI.align.CENTER_H,
                color: 0xffffff,
                alpha: 60,
            })

            return btn;
        }

        return vc.createWidget(hmUI.widget.TEXT, {
            x: x || 0,
            y: y || 60,
            w: isNotMain ? DEVICE_WIDTH / 2 : DEVICE_WIDTH,
            h: 60,
            text_size: isNotMain ? 38 : 38,
            align_h: hmUI.align.CENTER_H,
            color: 0xffffff,
            text,
        });
    }

    function timerCB() {
        animTimers[name].timerCount = animTimers[name].timerCount + 1;
        if (animTimers[name].timerCount === 15) {
            animTimers[name].timerCount = 1;
        }
        hmUI.deleteWidget(animTimers[name].rect), (animTimers[name].rect = null);
        hmUI.deleteWidget(animTimers[name].wid), (animTimers[name].wid = null);
        animTimers[name].wid = createWid()
    }

    function animStart() {
        if (animTimers[name].animTimer === null) {
            animTimers[name].wid = createWid()
            animTimers[name].animTimer = setInterval(timerCB, 1000);
        }
    }

    animStart();
}
