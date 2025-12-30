import {log} from "@zos/utils";
import hmUI, { event } from "@zos/ui";
import {replace} from "@zos/router";
import * as alarmMgr from "@zos/alarm";
import {setScrollLock} from '@zos/page'

import * as Styles from "zosLoader:./style.[pf].layout.js";
import {putLiveTime, putStaticAlarm} from "../components/time";
import {
    clearParam,
    getActiveId,
    getSortedKeys,
    getSortedObj,
    getTimeFromStr,
    getTT,
    parseAlarmSettings,
    showHumanTimerStr,
    showHumanTimeStr,
    sortObjectByTimeKeys,
    sortObjectByName,
    splitObjectByValue,
    splitByType
} from "../utils/utils";
import {setupAlarm} from "../components/time/selectTime";
import {ALARM_KEY, HOME_TARGET} from "../config/constants";

const {DEVICE_WIDTH, BUTTON_Y, TIMER_BTN} = Styles;

const globalData = getApp()._options.globalData;

Page({
    state: {
        activeIds: [],
    },
    onInit(param) {
        if (param === 'skip') setScrollLock({lock: false});
    },
    build() {
        putLiveTime();
        const that = this;
        const activeAlarms = alarmMgr.getAllAlarms();
        const conditionFunction = (k, v) => {
            const activeId = getActiveId(v);
            if (activeId) {
                if (activeAlarms.includes(activeId)) return activeId;
            }
        }
        const {active, notActive} = splitObjectByValue(
            globalData.localStorage.store,
            conditionFunction,
            activeAlarms
        );
        let sortActiveObj = getSortedObj(active);
        let sortNotActiveObj = getSortedObj(notActive);

        // Check sort preference
        const sortByName = globalData.localStorage.getItem('sort_by_name') === 'true';

        if (sortByName) {
            sortActiveObj = sortObjectByName(sortActiveObj);
            sortNotActiveObj = sortObjectByName(sortNotActiveObj);
        } else {
            sortActiveObj = sortObjectByTimeKeys(sortActiveObj);
            sortNotActiveObj = sortObjectByTimeKeys(sortNotActiveObj);
        }

        // Helper function to create section divider
        function createSectionDivider(title, yPos) {
            const dividerColor = 0x888888;
            const textColor = 0x888888;
            const lineY = yPos + 155; // Position lines lower, closer to items below

            // Calculate text width approximately (18px font, ~10px per char average)
            const textWidth = title.length * 10;
            const lineWidth = (DEVICE_WIDTH - textWidth - 40) / 2; // 40px total padding

            // Left line
            hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: 10,
                y: lineY,
                w: lineWidth,
                h: 2,
                color: dividerColor
            });

            // Section title (centered)
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0,
                y: yPos + 135,
                w: DEVICE_WIDTH,
                h: 30,
                text: title,
                text_size: 18,
                align_h: hmUI.align.CENTER_H,
                color: textColor
            });

            // Right line
            hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: DEVICE_WIDTH - lineWidth - 10,
                y: lineY,
                w: lineWidth,
                h: 2,
                color: dividerColor
            });
        }

        function listAlarms(alarms, fromLs = false, iiParam = 0) {
            if (alarms.length === 0) return 0

            let ii = iiParam;
            // render alarms
            alarms.forEach((alarmNumOrKey) => {
                const A_KEY = fromLs ? alarmNumOrKey : `${ALARM_KEY}${alarmNumOrKey}`;
                if (!fromLs && that.state.activeIds.includes(alarmNumOrKey)) {
                    return;
                }
                let storeVal = globalData.localStorage.getItem(A_KEY);
                let timeRaw = storeVal;
                let activeId = getActiveId(storeVal)
                if (activeId) {
                    if (!activeAlarms.includes(activeId)) {
                        storeVal = clearParam(storeVal)
                        timeRaw = storeVal
                        globalData.localStorage.setItem(A_KEY, storeVal);
                        activeId = false
                    } else {
                        that.state.activeIds.push(activeId);
                    }
                }
                if (fromLs && !timeRaw) {
                    ii -= 1
                    if (ii < 0) ii = 0
                    return;
                }
                ii += 1
                let mtt;
                let alarmTime;
                let name = '';
                let displayTime = '';
                let isCustomName = false;
                let duration = ''; // Declare at function scope
                let isAlarmType = false;
                let customName = null; // Declare at function scope for click_func access
                let repeatDaily = false; // Declare at function scope for click_func access
                try {
                    if (timeRaw) {
                        mtt = getTT(timeRaw);
                        if (mtt) {
                            name = mtt.name;
                            alarmTime = mtt.timeRaw;
                            isAlarmType = mtt.type === 'a';

                            // Parse name: format is "time|customName|R|settings" or legacy formats
                            customName = null; // Reset for each iteration
                            repeatDaily = false; // Reset for each iteration
                            let alarmEnabled = true; // Default to enabled for backward compat
                            duration = name;

                            if (name && name.includes('|')) {
                                const parts = name.split('|');
                                duration = parts[0]; // e.g., "00:05:00" or "07:00"
                                customName = parts[1]; // e.g., "Coffee" or "Wake Up" (or empty string)
                                repeatDaily = parts[2] === 'R'; // Check for repeat flag
                                isCustomName = !!customName; // Only true if customName has value

                                // Parse enabled flag from settings (field 6): E1 = enabled, E0 = disabled
                                // Settings format: V1|C|S1|E1 or V1|C|S1|E0
                                if (parts[6]) {
                                    alarmEnabled = parts[6] !== 'E0'; // E0 = disabled, anything else = enabled
                                }
                            } else {
                                // Old format or auto-generated: name is just the duration/time
                                isCustomName = false;
                            }

                            if (isAlarmType) {
                                // Alarm type: duration is HH:MM format
                                if (isCustomName) {
                                    name = customName;
                                    displayTime = duration; // Show alarm time like "07:00"
                                } else {
                                    displayTime = duration || mtt.time;
                                }
                                timeRaw = duration || mtt.time;
                            } else {
                                // Timer type: duration is HH:MM:SS format
                                if (isCustomName) {
                                    // Custom name like "Coffee" - show custom name + duration
                                    name = customName; // Use custom name for display
                                    displayTime = showHumanTimerStr(duration) || duration;
                                } else {
                                    // Auto-generated time name like "00:05:00"
                                    displayTime = showHumanTimerStr(duration) || mtt.time;
                                }
                                // Keep original behavior for backward compatibility
                                timeRaw = duration && showHumanTimerStr(duration) || mtt.time;
                            }
                        } else {
                            timeRaw = showHumanTimeStr(new Date(timeRaw * 1000));
                        }
                    }
                    // Use duration for getTimeFromStr (not name which may contain custom name)
                    const dateFromStr = mtt && !isAlarmType ? getTimeFromStr(duration || name) : null;
                    const click_func = () => {
                        if (fromLs) {
                            if (!activeId) {
                                if (isAlarmType) {
                                    // For alarms: edit instead of start
                                    // Extract settings from storage
                                    const storeVal = globalData.localStorage.getItem(alarmNumOrKey) || '';
                                    const settings = parseAlarmSettings(storeVal);

                                    // Navigate to wizard with existing data and storage key
                                    // Don't delete yet - only delete when user saves the edit
                                    replace({
                                        url: 'pages/creation-wizard',
                                        params: JSON.stringify({
                                            mode: 'alarm',
                                            editing: true,
                                            storageKey: alarmNumOrKey,
                                            existingData: {
                                                time: duration,
                                                name: customName,
                                                repeat: repeatDaily,
                                                vibrationEnabled: settings.vibrationEnabled,
                                                vibrationType: settings.vibrationType,
                                                soundEnabled: settings.soundEnabled,
                                                enabled: settings.enabled
                                            }
                                        }),
                                    });
                                } else {
                                    // For timers: clicking starts them
                                    // Extract settings from storage BEFORE starting
                                    const storeVal = globalData.localStorage.getItem(alarmNumOrKey) || '';
                                    const settings = parseAlarmSettings(storeVal);

                                    const customNameToPass = isCustomName ? name : null;
                                    const wizardConfig = {
                                        vibrationEnabled: settings.vibrationEnabled,
                                        vibrationType: settings.vibrationType,
                                        soundEnabled: settings.soundEnabled
                                    };

                                    setupAlarm(dateFromStr, alarmNumOrKey, customNameToPass, false, repeatDaily, wizardConfig, null);
                                }
                            }
                            return;
                        }

                        alarmMgr.cancel(activeId || alarmNumOrKey);

                        replace({
                            url: HOME_TARGET,
                            params: 'skip',
                        });
                    };

                    if (activeId) {
                        if (isAlarmType) {
                            // For active alarms: simple static display with delete button
                            let alarmText = isCustomName ? `${name}\n${displayTime}` : displayTime;
                            // Add repeat indicator
                            if (repeatDaily) {
                                alarmText += ' 🔁';
                            }

                            putStaticAlarm(
                                alarmText,
                                hmUI,
                                BUTTON_Y + Styles.BUTTON_LIST * ii,
                                () => {
                                    // Delete alarm
                                    globalData.localStorage.removeItem(alarmNumOrKey);
                                    alarmMgr.cancel(activeId);
                                    replace({
                                        url: HOME_TARGET,
                                        params: 'skip',
                                    });
                                },
                                () => {
                                    // Edit alarm - extract settings
                                    const storeVal = globalData.localStorage.getItem(alarmNumOrKey) || '';
                                    const settings = parseAlarmSettings(storeVal);

                                    // Cancel alarm but don't delete from storage yet
                                    // Will delete when user saves the edit
                                    alarmMgr.cancel(activeId);

                                    replace({
                                        url: 'pages/creation-wizard',
                                        params: JSON.stringify({
                                            mode: 'alarm',
                                            editing: true,
                                            storageKey: alarmNumOrKey,
                                            existingData: {
                                                time: duration,
                                                name: customName,
                                                repeat: repeatDaily,
                                                vibrationEnabled: settings.vibrationEnabled,
                                                vibrationType: settings.vibrationType,
                                                soundEnabled: settings.soundEnabled,
                                                enabled: settings.enabled
                                            }
                                        }),
                                    });
                                }
                            );
                        } else {
                            // For active timers: use putLiveTime with animation
                            let displayLabel = isCustomName ? name : null;

                            putLiveTime({
                                alarmTime,
                                dateFromStr,
                                customLabel: displayLabel,
                                isAlarm: false
                            }, hmUI, 75, BUTTON_Y + Styles.BUTTON_LIST * ii, click_func);
                        }
                    } else {
                        let text;
                        // Format: Name on top, time on bottom (separated by newline)
                        if (fromLs && isCustomName) {
                            // Custom named timer: show name on top, time on bottom
                            text = `${name}\n${displayTime}`;
                        } else if (fromLs && name) {
                            // Auto-generated timer name (time format): just show the time
                            text = displayTime || timeRaw;
                        } else {
                            // Fallback
                            text = `${fromLs ? '' : 'Alarm '}${activeId ? '' : (timeRaw || alarmNumOrKey)}`;
                        }

                        // Add disabled indicator for inactive alarms
                        if (isAlarmType && !activeId && !alarmEnabled) {
                            text = `🔕 ${text}`;
                        }

                        let txtSize = 34;
                        // Gray out disabled alarms
                        let buttonColor = TIMER_BTN.normal_color;
                        if (isAlarmType && !activeId && !alarmEnabled) {
                            buttonColor = 0xA1A2A6; // Gray color for disabled alarms
                        }

                        // For timers: add long press to edit support
                        const timerBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
                            ...TIMER_BTN,
                            text_size: txtSize,
                            normal_color: buttonColor,
                            y: BUTTON_Y + Styles.BUTTON_LIST * ii,
                            text,
                            w: fromLs ? TIMER_BTN.w / 1.3 : TIMER_BTN.w,
                            click_func: !isAlarmType && fromLs && !activeId ? undefined : click_func, // No click_func for inactive timers
                        });

                        // Add long press support for inactive timers
                        if (!isAlarmType && fromLs && !activeId) {
                            let touchStartTime = 0;
                            let isLongPress = false;

                            timerBtn.addEventListener(event.CLICK_DOWN, () => {
                                touchStartTime = Date.now();
                                isLongPress = false;
                            });

                            timerBtn.addEventListener(event.CLICK_UP, () => {
                                const touchDuration = Date.now() - touchStartTime;

                                if (touchDuration >= 500) {
                                    // Long press: Edit timer
                                    isLongPress = true;
                                    console.log('Long press detected: editing timer');

                                    // Extract settings from storage
                                    const storeVal = globalData.localStorage.getItem(alarmNumOrKey) || '';
                                    const settings = parseAlarmSettings(storeVal);

                                    // Navigate to wizard with existing data and storage key
                                    // Don't delete yet - only delete when user saves the edit
                                    replace({
                                        url: 'pages/creation-wizard',
                                        params: JSON.stringify({
                                            mode: 'timer',
                                            editing: true,
                                            storageKey: alarmNumOrKey,
                                            existingData: {
                                                time: duration,
                                                name: customName,
                                                repeat: false, // Timers don't repeat
                                                vibrationEnabled: settings.vibrationEnabled,
                                                vibrationType: settings.vibrationType,
                                                soundEnabled: settings.soundEnabled
                                            }
                                        }),
                                    });
                                } else {
                                    // Short tap: Start timer (execute original click_func)
                                    console.log('Tap detected: starting timer');
                                    click_func();
                                }
                            });
                        }
                    }
                    // Add delete/edit buttons for saved items (but not for active alarms - they use putStaticAlarm)
                    if (fromLs && !(activeId && isAlarmType)) {
                        let leftMini = 95;
                        hmUI.createWidget(hmUI.widget.BUTTON, {
                            ...TIMER_BTN,
                            ...Styles.DELETE_BTN,
                            text: '',
                            h: activeId ? TIMER_BTN.h / 2 - 5 : TIMER_BTN.h,
                            x: DEVICE_WIDTH / 2 + leftMini,
                            y: BUTTON_Y + Styles.BUTTON_LIST * ii + 5,
                            w: TIMER_BTN.w / 5,
                            click_func: () => {
                                let deleteAlarm = activeId || alarmNumOrKey;
                                globalData.localStorage.removeItem(alarmNumOrKey);

                                if (deleteAlarm) alarmMgr.cancel(deleteAlarm)

                                replace({
                                    url: HOME_TARGET,
                                    params: 'skip',
                                });
                            },
                        });
                        let offsetEdit = TIMER_BTN.h / 2 + 10;
                        activeId && hmUI.createWidget(hmUI.widget.BUTTON, {
                            ...TIMER_BTN,
                            ...Styles.EDIT_BTN,
                            h: TIMER_BTN.h / 2 - 5,
                            x: DEVICE_WIDTH / 2 + leftMini,
                            y: BUTTON_Y + Styles.BUTTON_LIST * ii + offsetEdit,
                            w: TIMER_BTN.w / 5,
                            click_func: () => {
                                alarmMgr.cancel(activeId);
                                replace({
                                    url: HOME_TARGET,
                                    params: 'skip',
                                });
                            },
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            });

            return ii
        } // end listAlarms()

        // List notification list items
        let marginTopItems = 0;
        let savedActiveAlarms = getSortedKeys(sortActiveObj);
        let savedNotActiveAlarms = getSortedKeys(sortNotActiveObj);

        if (sortByName) {
            // When sorting by name, split into ALARMS and TIMERS sections with dividers
            const activeByType = splitByType(sortActiveObj);
            const notActiveByType = splitByType(sortNotActiveObj);

            // Get sorted keys for each type
            const activeAlarmKeys = getSortedKeys(activeByType.alarms);
            const activeTimerKeys = getSortedKeys(activeByType.timers);
            const inactiveAlarmKeys = getSortedKeys(notActiveByType.alarms);
            const inactiveTimerKeys = getSortedKeys(notActiveByType.timers);

            // Render ALARMS section
            const hasAlarms = activeAlarmKeys.length > 0 || inactiveAlarmKeys.length > 0;
            if (hasAlarms) {
                createSectionDivider('ALARMS', BUTTON_Y + Styles.BUTTON_LIST * marginTopItems);
                marginTopItems += 0.4; // Smaller spacing for divider

                // Render active alarms
                if (activeAlarmKeys.length > 0) {
                    marginTopItems = listAlarms(activeAlarmKeys, true, marginTopItems);
                }
                // Render inactive alarms
                if (inactiveAlarmKeys.length > 0) {
                    marginTopItems = listAlarms(inactiveAlarmKeys, true, marginTopItems);
                }
            }

            // Render TIMERS section
            const hasTimers = activeTimerKeys.length > 0 || inactiveTimerKeys.length > 0;
            if (hasTimers) {
                createSectionDivider('TIMERS', BUTTON_Y + Styles.BUTTON_LIST * marginTopItems);
                marginTopItems += 0.4; // Smaller spacing for divider

                // Render active timers
                if (activeTimerKeys.length > 0) {
                    marginTopItems = listAlarms(activeTimerKeys, true, marginTopItems);
                }
                // Render inactive timers
                if (inactiveTimerKeys.length > 0) {
                    marginTopItems = listAlarms(inactiveTimerKeys, true, marginTopItems);
                }
            }

            // render active alarms from system (shouldn't be needed when sorted by name, but include for completeness)
            let marginTopItemsA = listAlarms(activeAlarms, false, marginTopItems);
            if (marginTopItemsA) marginTopItems = marginTopItemsA;
        } else {
            // Default behavior: render by time without sections
            // render saved active timers or countdowns
            marginTopItems = listAlarms(savedActiveAlarms, true, marginTopItems);

            // render saved not active timers or countdowns
            const marginTopItemsNA = listAlarms(savedNotActiveAlarms, true, marginTopItems);
            if (marginTopItemsNA) marginTopItems = marginTopItemsNA;

            // render active alarms
            let marginTopItemsA = listAlarms(activeAlarms, false, marginTopItems);
            if (marginTopItemsA) marginTopItems = marginTopItemsA;
        }

        const sB = {...Styles.TIMER_BTN};

        marginTopItems += 1;

        const iconButtonY = BUTTON_Y + Styles.BUTTON_LIST * marginTopItems;
        const iconButtonGap = 5;
        const iconButtonW = (DEVICE_WIDTH - iconButtonGap * 3) / 2; // Two buttons with spacing

        // Create button (left) - opens creation wizard where user chooses alarm or timer
        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...sB,
            h: TIMER_BTN.h,
            w: iconButtonW,
            x: iconButtonGap,
            text: '',
            y: iconButtonY,
            normal_color: undefined,
            press_color: undefined,
            normal_src: 'alarmIcon.png',
            press_src: 'alarmIcon.png',
            click_func: function () {
                replace({
                    url: 'pages/creation-wizard',
                    params: JSON.stringify({ mode: 'alarm' }),
                });
            },
        });

        // Settings button (right)
        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...sB,
            h: TIMER_BTN.h,
            w: iconButtonW,
            x: iconButtonGap * 2 + iconButtonW,
            text: '',
            y: iconButtonY,
            normal_color: undefined,
            press_color: undefined,
            normal_src: 'settingIcon.png',
            press_src: 'settingIcon.png',
            click_func: function () {
                replace({
                    url: 'pages/vibration-settings',
                    params: 'skip',
                });
            },
        });

        // Add bottom spacing
        marginTopItems += 1;
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: 0,
            y: BUTTON_Y + Styles.BUTTON_LIST * marginTopItems,
            w: 1,
            h: 60,
            color: 0x000000,
        });

        // Show scrollbar
        hmUI.createWidget(hmUI.widget.PAGE_SCROLLBAR, {});
    },
    onDestroy() {
        log.log("page on destroy invoke");
    },
});
