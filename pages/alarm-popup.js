import hmUI from "@zos/ui";
import { replace } from "@zos/router";
import { Vibrator, VIBRATOR_SCENE_TIMER, VIBRATOR_SCENE_NOTIFICATION } from "@zos/sensor";
import { setScrollLock } from '@zos/page';
import { getDeviceInfo } from "@zos/device";
import * as alarmMgr from "@zos/alarm";
import { create, id } from "@zos/media";
import { setWakeUpRelaunch } from '@zos/display';
import { parseAlarmSettings, buildAlarmSettingsString } from "../utils/utils";
import { TimePicker } from "../lib/mmk/TimePicker";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const globalData = getApp()._options.globalData;

let alarmPlayer = null;
let vibrator = null;
let timePicker = null;
let isProcessing = false;

Page({
    onInit(params) {
        // Keep screen on during alarm to prevent timeout
        try {
            hmApp.setScreenKeep(true);
        } catch (e) {
            // Error enabling screen keep
        }

        // Relaunch app if screen wakes from sleep
        try {
            setWakeUpRelaunch({
                relaunch: true
            });
        } catch (e) {
            // Error enabling wake-up relaunch
        }

        // Start vibration and sound in popup instead of app-service
        this.startAlarmVibration();
        this.startAlarmSound();
    },
    startAlarmVibration() {
        try {
            // Get alarm params and parse per-alarm settings
            const params = globalData.localStorage.getItem('pending_alarm') || '';
            const settings = parseAlarmSettings(params);

            // Check if vibration is enabled for this alarm
            if (!settings.vibrationEnabled) {
                return;
            }

            // Use per-alarm vibration type: C = continuous (VIBRATOR_SCENE_TIMER), N = non-continuous (VIBRATOR_SCENE_NOTIFICATION)
            const vibrationMode = settings.vibrationType === 'N' ? VIBRATOR_SCENE_NOTIFICATION : VIBRATOR_SCENE_TIMER;

            vibrator = new Vibrator();
            vibrator.start();
            vibrator.setMode(vibrationMode);
            vibrator.start();
        } catch (e) {
            // Vibrator error
        }
    },
    startAlarmSound() {
        try {
            // Get alarm params and parse per-alarm settings
            const params = globalData.localStorage.getItem('pending_alarm') || '';
            const settings = parseAlarmSettings(params);

            // Check if sound is enabled for this alarm
            if (!settings.soundEnabled) {
                return;
            }

            alarmPlayer = create(id.PLAYER);

            alarmPlayer.addEventListener(alarmPlayer.event.PREPARE, function (result) {
                if (result) {
                    alarmPlayer.start();
                }
            });

            alarmPlayer.addEventListener(alarmPlayer.event.COMPLETE, function () {
                try {
                    // Re-prepare and restart for continuous loop
                    alarmPlayer.prepare();
                } catch (e) {
                    // Fallback: try just start() if prepare fails
                    try {
                        alarmPlayer.start();
                    } catch (e2) {
                        // Fallback start also failed
                    }
                }
            });

            alarmPlayer.setSource(alarmPlayer.source.FILE, { file: 'test-alarm.mp3' });
            alarmPlayer.prepare();
        } catch (e) {
            // Sound playback error
        }
    },
    build() {
        // Get alarm info from localStorage
        const params = globalData.localStorage.getItem('pending_alarm') || 'Alarm';
        globalData.localStorage.removeItem('pending_alarm');

        // Parse alarm/timer name
        // Format: [type]_[timestamp]_[name] where type is 'a' (alarm), 't' (timer), or 'c' (countdown)
        // Name format: "HH:MM|customName|R" for alarms, "HH:MM:SS|customName" for timers
        let alarmName = "Alarm";
        if (params) {
            const match = params.match(/[atc]_\d+_(.*?)(?:_=|$)/);
            if (match) {
                const namePart = match[1];
                const parts = namePart.split('|');
                // parts[0] = duration/time, parts[1] = custom name, parts[2] = R (repeat)
                if (parts[1]) {
                    // Has custom name
                    alarmName = parts[1];
                } else if (params.startsWith('a_')) {
                    alarmName = "Alarm";
                } else {
                    alarmName = "Timer";
                }
            } else if (params !== 'alarm' && params !== 'alarm_triggered') {
                // Fallback for test params
                alarmName = params.startsWith('t_') || params.startsWith('c_') ? "Timer" : params;
            }
        }

        // Background
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: 0,
            y: 0,
            w: DEVICE_WIDTH,
            h: DEVICE_HEIGHT,
            color: 0x000000,
        });

        // Alarm title
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: DEVICE_HEIGHT / 4,
            w: DEVICE_WIDTH,
            h: 60,
            text: alarmName,
            text_size: 42,
            align_h: hmUI.align.CENTER_H,
            color: 0xffffff,
        });

        // Time's up text
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: DEVICE_HEIGHT / 4 + 70,
            w: DEVICE_WIDTH,
            h: 40,
            text: "Time's up!",
            text_size: 28,
            align_h: hmUI.align.CENTER_H,
            color: 0xaaaaaa,
        });

        const buttonGap = 40;
        const buttonW = (DEVICE_WIDTH - buttonGap * 3) / 2;
        const buttonY = DEVICE_HEIGHT - 200;

        // Snooze button (left)
        hmUI.createWidget(hmUI.widget.BUTTON, {
            x: buttonGap,
            y: buttonY,
            w: buttonW,
            h: 80,
            radius: 40,
            normal_color: 0xF29325,
            press_color: 0xD94F04,
            text: 'SNOOZE',
            text_size: 28,
            click_func: () => this.snooze(),
        });

        // Stop button (right)
        hmUI.createWidget(hmUI.widget.BUTTON, {
            x: buttonGap * 2 + buttonW,
            y: buttonY,
            w: buttonW,
            h: 80,
            radius: 40,
            normal_color: 0x8C1B2F,
            press_color: 0x590414,
            text: 'STOP',
            text_size: 32,
            click_func: () => {
                // Stop vibration
                if (vibrator) {
                    try {
                        vibrator.stop();
                    } catch (e) {
                        // Error stopping vibration
                    }
                }

                // Stop sound
                if (alarmPlayer) {
                    try {
                        alarmPlayer.stop();
                    } catch (e) {
                        // Error stopping sound
                    }
                }

                // Go to main page
                replace({
                    url: 'pages/alarm',
                    params: 'skip',
                });
            },
        });

        setScrollLock({ lock: true });
    },
    snooze() {
        if (isProcessing) return;

        // Stop alerts while picking duration
        if (vibrator) {
            try { vibrator.stop(); } catch (e) {}
        }
        if (alarmPlayer) {
            try { alarmPlayer.stop(); } catch (e) {}
        }

        // Get default snooze duration from settings
        const savedSnooze = globalData.localStorage.getItem('snooze_duration');
        const snoozeDurations = [1, 3, 5, 10, 15, 20, 30];
        const snoozeIndex = savedSnooze !== null ? parseInt(savedSnooze) : 2;
        const defaultMinutes = snoozeDurations[snoozeIndex] || 5;
        const defaultHour = Math.floor(defaultMinutes / 60);
        const defaultMin = defaultMinutes % 60;

        // Store selected duration
        this.snoozeHour = defaultHour;
        this.snoozeMinute = defaultMin;

        // Show TimePicker overlay
        timePicker = new TimePicker({
            initialHour: defaultHour,
            initialMinute: defaultMin,
            onSelect: (hour, minute) => {
                this.snoozeHour = hour;
                this.snoozeMinute = minute;
            },
            onConfirm: () => {
                this.createSnoozeAlarm();
            }
        });

        timePicker.render();
    },
    createSnoozeAlarm() {
        if (isProcessing) return;
        isProcessing = true;

        const totalMinutes = (this.snoozeHour * 60) + this.snoozeMinute;

        if (totalMinutes === 0) {
            hmUI.showToast({ text: 'Select a duration' });
            isProcessing = false;
            return;
        }

        // Get original alarm settings
        const params = globalData.localStorage.getItem('pending_alarm') || '';
        const settings = parseAlarmSettings(params);
        const settingsStr = buildAlarmSettingsString({
            vibrationEnabled: settings.vibrationEnabled,
            vibrationType: settings.vibrationType,
            soundEnabled: settings.soundEnabled
        });

        // Create snooze alarm
        const snoozeTime = Math.floor(Date.now() / 1000) + (totalMinutes * 60);

        const option = {
            url: 'app-service/index',
            time: snoozeTime,
            repeat_type: alarmMgr.REPEAT_ONCE,
            param: `c_${snoozeTime}_00:${totalMinutes < 10 ? '0' : ''}${totalMinutes}:00|Snooze||${settingsStr}`,
        };

        alarmMgr.set(option);

        // Show confirmation toast
        const hoursText = this.snoozeHour > 0 ? `${this.snoozeHour}h ` : '';
        const minutesText = this.snoozeMinute > 0 ? `${this.snoozeMinute}m` : '';
        hmUI.showToast({ text: `Snoozed ${hoursText}${minutesText}` });

        // Cleanup and exit
        if (timePicker) {
            timePicker.destroy();
            timePicker = null;
        }

        replace({
            url: 'pages/alarm',
            params: 'skip',
        });
    },
    onDestroy() {
        // Reset processing guard for next use
        isProcessing = false;

        // Clean up TimePicker if shown
        if (timePicker) {
            try {
                timePicker.destroy();
                timePicker = null;
            } catch (e) {}
        }

        // Allow screen to sleep again when alarm is dismissed
        try {
            hmApp.setScreenKeep(false);
        } catch (e) {
            // Error disabling screen keep
        }

        // Stop vibration when page is destroyed
        if (vibrator) {
            try {
                vibrator.stop();
            } catch (e) {
                // Error stopping vibration
            }
        }
        // Stop sound when page is destroyed
        if (alarmPlayer) {
            try {
                alarmPlayer.stop();
            } catch (e) {
                // Error stopping sound
            }
        }
    },
});
