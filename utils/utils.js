import {Time} from "@zos/sensor";
import {getDeviceInfo} from "@zos/device";
import {ACTIVE_REGEXP, ALARM_KEY, CLEAR_KEY, COUNTDOWN_KEY} from "../config/constants";

const timeSensor = new Time();
export const {height: DEVICE_HEIGHT, width: DEVICE_WIDTH} = getDeviceInfo();

export const showTimeVal = (v) => v >= 10 ? v : '0' + v

export const getTimeStr = (timeObj) => {
    return `${showTimeVal(timeObj.getHours())}:${showTimeVal(timeObj.getMinutes())}:${showTimeVal(timeObj.getSeconds())}`
}

export const getTimerStr = (v, end = '') => {
    let s = ''
    if (v) {
        s = parseInt(v) || s
    }

    return `${s}${s ? end : ''}`
}

export const showHumanTimerStr = (name) => {
    let names = name.split(':');
    if (names.length === 3) {
        let h = getTimerStr(names[0], 'h ');
        let m = getTimerStr(names[1], 'm ');
        let s = getTimerStr(names[2], 's');

        return `${h}${m}${s}`;
    }
}

export const showHumanTimeStr = (timeObj, endStr = false) => {
    let h = timeObj.getHours();
    let m = timeObj.getMinutes();
    let s = timeObj.getSeconds();
    let hs = showTimeVal(h);
    let ms = showTimeVal(m);
    let ss = showTimeVal(s);
    let sepH = ':';
    let sepM = ':';
    let endS = '';
    if (endStr) {
        sepH = 'h '
        sepM = 'm '
        endS = 's '
    }
    if (!h) hs = sepH = '';
    if (!m) ms = sepM = '';
    if (!s && !endS) {
        ss = sepM = '';
    }

    return `${hs}${sepH}${ms}${sepM}${ss}${endS}`
}

// get time from "00:00:00" string
export const getTimeFromStr = (name) => {
    const now = new Date();

    const names = name.replace(ACTIVE_REGEXP, '').split(':');

    if (names.length === 3) {
        now.setHours(...names);
        return now;
    }
}

export const getTT = (tt) => {
    const mtt = `${tt}`.match(/([cta])_([0-9]+)_(.*?)$/);
    let name, type;
    if (mtt) {
        type = mtt[1]; // 'c', 't', or 'a'
        tt = mtt[2];
        name = mtt[3].replace(ACTIVE_REGEXP, ''); // Remove _=ID= suffix

        return {time: getTimeStr(new Date(tt * 1000)), timeRaw: tt, name, type};
    }
}

export function getSensorTime() {
    return new Date(timeSensor.getTime());
}

export const getAlarmTime = (dTime) => {
    let cTime = getSensorTime();
    let h = dTime.getHours();
    let m = dTime.getMinutes();
    let s = dTime.getSeconds();
    cTime.setHours(cTime.getHours() + h, cTime.getMinutes() + m, cTime.getSeconds() + s,);

    return Math.floor(cTime.getTime() / 1000);
}

export function getCurrentTime() {
    let cTime = getSensorTime();
    cTime.setHours(timeSensor.getHours(), timeSensor.getMinutes(), timeSensor.getSeconds())

    return cTime
}

export function clearParam(s) {
    return `${s}`.replace(new RegExp(ACTIVE_REGEXP, 'g'), '');
}

export const getActiveId = (val) => {
    let activeId = val && val.match(ACTIVE_REGEXP);
    if (activeId) {
        return +activeId[2]
    }
}

export function sortObjectByTimeKeys(obj) {
    return Object.keys(obj)
        .sort((a1, b1) => {
            const a = a1.replace(CLEAR_KEY, '')
            const b = b1.replace(CLEAR_KEY, '')
            const timeA = a.split(':').map(Number);
            const timeB = b.split(':').map(Number);
            for (let i = 0; i < 3; i++) {
                if (timeA[i] !== timeB[i]) return timeA[i] - timeB[i];
            }

            return 0;
        })
        .reduce((sortedObj, key) => {
            sortedObj[key] = obj[key];
            return sortedObj;
        }, {});
}

export function sortObjectByName(obj) {
    return Object.keys(obj)
        .sort((keyA, keyB) => {
            const itemA = obj[keyA];
            const itemB = obj[keyB];
            const valueA = itemA.value || itemA;
            const valueB = itemB.value || itemB;

            // Extract name from value string (format: type_timestamp_name)
            const getNameFromValue = (val) => {
                if (!val || typeof val !== 'string') return '';
                const match = val.match(/[atc]_\d+_(.*?)(?:_=|$)/);
                if (match) {
                    const namePart = match[1];
                    const parts = namePart.split('|');
                    // parts[1] is custom name, parts[0] is time/duration
                    return (parts[1] || parts[0] || '').toLowerCase();
                }
                return '';
            };

            const nameA = getNameFromValue(valueA);
            const nameB = getNameFromValue(valueB);

            return nameA.localeCompare(nameB);
        })
        .reduce((sortedObj, key) => {
            sortedObj[key] = obj[key];
            return sortedObj;
        }, {});
}

export function splitByType(obj) {
    const alarms = {};
    const timers = {};

    Object.keys(obj).forEach(key => {
        const value = obj[key].value || obj[key];
        // Check if it's an alarm (a_) or timer (t_/c_)
        if (value && typeof value === 'string' && value.startsWith('a_')) {
            alarms[key] = obj[key];
        } else {
            timers[key] = obj[key];
        }
    });

    return { alarms, timers };
}

export function splitObjectByValue(obj, condition) {
    return Object.entries(obj).reduce(
        (result, [key, value]) => {
            const activeId = condition(key, value);
            if (typeof activeId === "number") {
                if (activeId === -1) {
                    // skip
                } else {
                    result.active[key] = value;
                }
            } else {
                result.notActive[key] = value;
            }
            return result;
        },
        {active: {}, notActive: {}}
    );
}

export const getSortedKeys = (sortObj) => {
    let savedAlarms = []
    let sKeys = Object.keys(sortObj);
    for (let sk = 0; sk < sKeys.length; sk += 1) {
        let sKey = sKeys[sk];
        if (sKey && (sortObj[sKey].key.match(ALARM_KEY) || sortObj[sKey].key.match(COUNTDOWN_KEY))) {
            savedAlarms.push(sortObj[sKey].key);
        }
    }
    return savedAlarms;
}

export const getSortedObj = (obj) => {
    let sortObj = {};
    const sKeys = Object.keys(obj);
    for (let sk = 0; sk < sKeys.length; sk += 1) {
        let sKey = sKeys[sk];
        if (sKey && (
            `${sKey}`.match(ALARM_KEY)
            || `${sKey}`.match(COUNTDOWN_KEY)
        )
        ) {
            let v = obj[sKey];
            sortObj[sKey] = {
                key: sKey,
                value: v,
            };
        }
    }
    return sortObj
}

/**
 * Parse alarm settings from param string
 * Format: [type]_[timestamp]_[time|name|repeat|vibration|vibrationType|sound|enabled]_=[activeId]=
 *
 * @param {string} paramString - Full param string (e.g., "a_1735401600_07:00|Wake Up|R|V1|C|S1|E1_=123=")
 * @returns {object} Settings object with vibrationEnabled, vibrationType, soundEnabled, enabled
 *
 * Examples:
 *   "a_1735401600_07:00|Wake Up|R|V1|C|S1|E1" → {vibrationEnabled: true, vibrationType: 'C', soundEnabled: true, enabled: true}
 *   "a_1735401600_07:00|Wake Up|R|V1|C|S1|E0" → {vibrationEnabled: true, vibrationType: 'C', soundEnabled: true, enabled: false}
 *   "a_1735401600_07:00|Wake Up|R" → {vibrationEnabled: true, vibrationType: 'C', soundEnabled: true, enabled: true} (backward compat)
 */
export function parseAlarmSettings(paramString) {
    try {
        // Match the param format: [type]_[timestamp]_[data]
        const match = paramString.match(/[atc]_\d+_(.*?)(?:_=|$)/);
        if (!match) {
            // Fallback to defaults
            return {
                vibrationEnabled: true,
                vibrationType: 'C',
                soundEnabled: true,
                enabled: true
            };
        }

        const parts = match[1].split('|');

        // Field 3: Vibration enabled (V1 = on, V0 = off)
        // Field 4: Vibration type (C = continuous, N = non-continuous)
        // Field 5: Sound enabled (S1 = on, S0 = off)
        // Field 6: Alarm enabled (E1 = on, E0 = off) - for alarm presets

        return {
            vibrationEnabled: parts[3] === 'V0' ? false : true, // Default to true if missing
            vibrationType: parts[4] || 'C', // Default to continuous
            soundEnabled: parts[5] === 'S0' ? false : true, // Default to true if missing
            enabled: parts[6] === 'E0' ? false : true // Default to true if missing (backward compat)
        };
    } catch (e) {
        // Return defaults on error
        return {
            vibrationEnabled: true,
            vibrationType: 'C',
            soundEnabled: true,
            enabled: true
        };
    }
}

/**
 * Build settings string for alarm/timer param
 *
 * @param {object} wizardConfig - Configuration object {vibrationEnabled, vibrationType, soundEnabled, enabled}
 * @returns {string} Settings string (e.g., "V1|C|S1|E1")
 *
 * Examples:
 *   {vibrationEnabled: true, vibrationType: 'C', soundEnabled: true, enabled: true} → "V1|C|S1|E1"
 *   {vibrationEnabled: false, vibrationType: 'N', soundEnabled: true, enabled: false} → "V0|N|S1|E0"
 *   null → "V1|C|S1|E1" (defaults)
 */
export function buildAlarmSettingsString(wizardConfig) {
    // Use defaults if no config provided
    const vibrationEnabled = wizardConfig?.vibrationEnabled !== false; // Default to true
    const vibrationType = wizardConfig?.vibrationType || 'C'; // Default to continuous
    const soundEnabled = wizardConfig?.soundEnabled !== false; // Default to true
    const enabled = wizardConfig?.enabled !== false; // Default to true

    const vibration = vibrationEnabled ? 'V1' : 'V0';
    const sound = soundEnabled ? 'S1' : 'S0';
    const enabledFlag = enabled ? 'E1' : 'E0';

    return `${vibration}|${vibrationType}|${sound}|${enabledFlag}`;
}
