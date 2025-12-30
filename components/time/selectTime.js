import hmUI from "@zos/ui";
import { createKeyboard, deleteKeyboard, inputType } from "@zos/ui";
import {
    buildAlarmSettingsString,
    clearParam,
    DEVICE_HEIGHT,
    DEVICE_WIDTH,
    getAlarmTime,
    getTimeStr,
    showTimeVal
} from "../../utils/utils";
import * as alarmMgr from "@zos/alarm";

import {replace, back} from "@zos/router";
import {TimePicker} from "../../lib/mmk/TimePicker";  // Custom time picker - KEEPING THIS

import {ALARM_KEY, ALARM_TARGET, HOME_TARGET} from "../../config/constants";

let dateTime = new Date();
const globalData = getApp()._options.globalData;

let changedHour;
let changedMin;
let changedSec;

// Global state
let pendingTimerData = null;
let settingsVc = null;
let wizardConfiguration = null; // Module-level storage for wizard config
let activeKeyboard = null; // Track active keyboard instance
let editingStorageKey = null; // Storage key for editing (to delete old item on save)

let alarmObj = {
    url: ALARM_TARGET,
    store: true,
    repeat_type: alarmMgr.REPEAT_ONCE,
    repeat_period: 1,
    repeat_duration: 1,
    week_days: 0,
    start_time: 0,
    end_time: 0,
};

export function setupAlarm(dTime, mode = false, customName = null, isAlarmRestart = false, repeatDaily = false, wizardConfig = null, storageKey = null) {
    if (!dTime) return;

    try {
        const isTimer = mode === 'timer';
        const isAlarm = mode === 'alarm';
        const isCreateTimer = mode === true || isTimer;
        const isStartTimer = typeof mode === 'string' && !isTimer && !isAlarm;
        const isRestartAlarm = isAlarmRestart === true;

        let timeStr, name;

        // Build settings string using wizard config
        const settingsStr = buildAlarmSettingsString(wizardConfig);

        if (isAlarm || isRestartAlarm) {
            // For alarms: store absolute time (HH:MM) with optional repeat setting
            timeStr = `${showTimeVal(dTime.getHours())}:${showTimeVal(dTime.getMinutes())}`;
            // Format: "HH:MM|customName|repeat|settings"
            if (customName) {
                name = repeatDaily ? `${timeStr}|${customName}|R|${settingsStr}` : `${timeStr}|${customName}||${settingsStr}`;
            } else {
                name = repeatDaily ? `${timeStr}||R|${settingsStr}` : `${timeStr}|||${settingsStr}`;
            }
            // For alarms, time is absolute
            alarmObj.time = Math.floor(dTime.getTime() / 1000);
            // Set repeat type based on setting
            alarmObj.repeat_type = repeatDaily ? alarmMgr.REPEAT_DAY : alarmMgr.REPEAT_ONCE;
        } else {
            // For timers: store duration
            const durationStr = getTimeStr(dTime);
            name = customName ? `${durationStr}|${customName}||${settingsStr}` : `${durationStr}|||${settingsStr}`;
            // For timers, calculate time from duration
            alarmObj.time = getAlarmTime(dTime);
        }

        console.log(`setupAlarm - mode: ${mode}, isAlarmRestart: ${isAlarmRestart}, timeStr: ${timeStr || 'N/A'}, customName: ${customName}, name: ${name}`);
        console.log(`setupAlarm - dTime: ${dTime.toString()}`);
        console.log(`setupAlarm - alarmObj.time (timestamp): ${alarmObj.time}`);
        console.log(`setupAlarm - alarm Date: ${new Date(alarmObj.time * 1000).toString()}`);
        let paramVal = `${(isAlarm || isRestartAlarm) ? 'a_' : (isTimer ? 't_' : 'c_')}${alarmObj.time}${name ? `_${name}` : ''}`;
        console.log(`setupAlarm - paramVal: ${paramVal}`);
        alarmObj.param = paramVal;

        let STORE_KEY = `${ALARM_KEY}${name}`;
        if (isStartTimer || (typeof mode === 'string' && !isTimer && !isAlarm)) STORE_KEY = mode

        const exists = globalData.localStorage.getItem(STORE_KEY);
        let id;

        // Alarms: always activate when created or restarted
        // Timers: only save to storage, don't activate until clicked
        const isCreatingNewTimer = isTimer && !isRestartAlarm;
        const isCreatingNewAlarm = isAlarm;
        const isRestarting = isStartTimer || isRestartAlarm;

        if (isCreatingNewTimer && !isRestarting) {
            // Creating new timer: just save to storage, don't activate
            id = -1;
            if (exists) {
                // Already exists, don't save again
                paramVal = '';
            }
        } else if (isCreatingNewAlarm) {
            // Creating new alarm: check if it should be enabled
            const alarmEnabled = wizardConfig?.enabled !== false; // Default to true for backward compat

            if (exists) {
                // Already exists, don't save again
                paramVal = '';
                id = -1;
            } else if (!alarmEnabled) {
                // Alarm disabled: don't activate, just save to storage
                id = -1;
                console.log('Creating disabled alarm preset (not activating)');
            } else {
                // Alarm enabled: activate it
                id = alarmMgr.set(alarmObj);
            }
        } else if (isRestarting) {
            // Restarting: activate it
            id = alarmMgr.set(alarmObj);
        } else {
            // Old behavior for backward compatibility
            id = alarmMgr.set(alarmObj);
        }

        if (id === 0) {
            // cant setup
            console.log('cant setup id, something wrong');
        } else {
            // If editing (storageKey provided), delete the old item first
            if (storageKey) {
                console.log('Editing mode: deleting old storage key:', storageKey);
                globalData.localStorage.removeItem(storageKey);
            }

            // save to localStorage
            if (paramVal) {
                // Add alarm ID if we activated it (id > 0)
                // For disabled alarms or inactive timers (id === -1), save with empty activeId
                if (id > 0) {
                    paramVal = clearParam(paramVal) + `_=${id}=`;
                } else {
                    // id === -1: inactive timer or disabled alarm
                    paramVal = clearParam(paramVal) + `_==`;
                }
                globalData.localStorage.setItem(STORE_KEY, paramVal);
            }

            replace({
                url: HOME_TARGET,
                params: 'skip',
            });
        }
    } catch (e) {
        console.log(e);
    }
}

function hideDialog(vc) {
    hmUI.deleteWidget(vc), (vc = null);
    hmUI.redraw();
}

function showAlarmSettings(dTime, mode, customName, previousVc, currentRepeat = false, wizardConfig = null) {
    hideDialog(previousVc);

    settingsVc = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        scroll_enable: 0,
    });

    // Background
    settingsVc.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        color: 0x000000,
    });

    let repeatDaily = currentRepeat;

    // Title
    settingsVc.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 60,
        w: DEVICE_WIDTH,
        h: 50,
        text: 'Alarm Settings',
        text_size: 32,
        align_h: hmUI.align.CENTER_H,
        color: 0xffffff,
    });

    // Repeat Daily label
    settingsVc.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 150,
        w: DEVICE_WIDTH - 200,
        h: 60,
        text: 'Repeat Daily',
        text_size: 28,
        color: 0xffffff,
    });

    // Toggle switch
    settingsVc.createWidget(hmUI.widget.BUTTON, {
        x: DEVICE_WIDTH - 140,
        y: 150,
        w: 80,
        h: 60,
        radius: 30,
        normal_color: repeatDaily ? 0x00ABBD : 0xA1A2A6,
        press_color: repeatDaily ? 0x026E81 : 0xA1A2A6,
        text: repeatDaily ? 'ON' : 'OFF',
        text_size: 20,
        click_func: () => {
            hideDialog(settingsVc);
            showAlarmSettings(dTime, mode, customName, null, !repeatDaily);
        }
    });

    // Confirm button
    settingsVc.createWidget(hmUI.widget.BUTTON, {
        x: DEVICE_WIDTH / 4,
        y: DEVICE_HEIGHT - 160,
        w: DEVICE_WIDTH / 2,
        h: 80,
        radius: 16,
        normal_color: 0x008CDB,
        press_color: 0x086CB4,
        text: 'DONE',
        text_size: 28,
        click_func: () => {
            hideDialog(settingsVc);
            settingsVc = null;
            setupAlarm(dTime, mode, customName, false, repeatDaily, wizardConfig, editingStorageKey);
        }
    });

    return settingsVc;
}

function showNameInput(dTime, timer, previousVc, existingData = null) {
    hideDialog(previousVc);

    // Store pending data including existing data for editing and wizard config
    pendingTimerData = { dTime, timer, existingData, wizardConfig: wizardConfiguration };

    // Get pre-fill text if editing
    const initialText = (existingData && existingData.name) ? existingData.name : "";

    // Create native system keyboard with CHAR input (T9 + voice + emoji)
    activeKeyboard = createKeyboard({
        inputType: inputType.CHAR,
        text: initialText,
        onComplete: (keyboardWidget, result) => {
            console.log("Keyboard confirmed:", result.data);

            // Clean up keyboard first
            try {
                deleteKeyboard();
                activeKeyboard = null;
            } catch (e) {
                console.log("Error deleting keyboard:", e);
            }

            if (pendingTimerData) {
                const isAlarm = pendingTimerData.timer === 'alarm';
                const customName = (result.data && result.data.trim()) ? result.data.trim() : null;

                if (isAlarm) {
                    // For alarms: show settings screen
                    // Use existing repeat setting if editing, otherwise default to false
                    const existingRepeat = pendingTimerData.existingData?.repeat || false;
                    showAlarmSettings(pendingTimerData.dTime, pendingTimerData.timer, customName, null, existingRepeat, pendingTimerData.wizardConfig);
                } else {
                    // For timers: directly create
                    setupAlarm(pendingTimerData.dTime, pendingTimerData.timer, customName, false, false, pendingTimerData.wizardConfig, editingStorageKey);
                }
                pendingTimerData = null;
            }

            // Reset state
            changedHour = undefined;
            changedMin = undefined;
            changedSec = undefined;
        },
        onCancel: () => {
            console.log("Keyboard cancelled - navigating back without saving");

            // Clean up keyboard
            try {
                deleteKeyboard();
                activeKeyboard = null;
            } catch (e) {
                console.log("Error deleting keyboard on cancel:", e);
            }

            // User cancelled - clear pending data without saving
            pendingTimerData = null;
            editingStorageKey = null;

            // Reset state
            changedHour = undefined;
            changedMin = undefined;
            changedSec = undefined;

            // Navigate back to main alarm screen without saving
            replace({
                url: HOME_TARGET,
                params: 'skip',
            });
        }
    });

    console.log("Native keyboard created with initial text:", initialText);
}

export function selectTime(mode = 'timer', existingData = null, wizardConfig = null, storageKey = null) {
    // Store wizard config and storage key in module-level variables
    wizardConfiguration = wizardConfig;
    editingStorageKey = storageKey;

    // Native keyboard is created on-demand in showNameInput() - no initialization needed

    let vc = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        scroll_enable: 0,
    });

    // Reset state
    changedHour = false;
    changedMin = false;
    changedSec = false;

    const isAlarm = mode === 'alarm';

    // Default initial values
    const now = new Date();
    let initHour = isAlarm ? now.getHours() : 0;
    let initMinute = isAlarm ? now.getMinutes() : 5;

    // If editing existing alarm, use its time
    if (existingData && existingData.time) {
        const timeParts = existingData.time.split(':');
        initHour = parseInt(timeParts[0]) || 0;
        initMinute = parseInt(timeParts[1]) || 0;
    }

    // Create TimePicker
    const timePicker = new TimePicker({
        container: vc,
        initialHour: initHour,
        initialMinute: initMinute,
        onConfirm: (hour, minute) => {
            if (isAlarm) {
                // For alarms: set to today's date at specified time
                dateTime = new Date();
                dateTime.setHours(hour, minute, 0, 0);

                // If time has passed today, schedule for tomorrow
                if (dateTime.getTime() <= new Date().getTime()) {
                    dateTime.setDate(dateTime.getDate() + 1);
                }
            } else {
                // For timers: duration-based (hours:minutes from now)
                dateTime = new Date();
                dateTime.setHours(hour, minute, 0, 0);
            }

            console.log(`TimePicker selected: ${hour}h ${minute}m (mode: ${mode})`);
            console.log(`dateTime after set: ${dateTime.toString()}`);

            changedHour = hour > 0;
            changedMin = minute > 0;
            changedSec = false;

            // Show name input keyboard
            showNameInput(dateTime, mode, vc, existingData);
        }
    });

    timePicker.render();

    return vc;
} // end selectTime
