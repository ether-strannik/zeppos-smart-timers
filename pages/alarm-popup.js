import hmUI from "@zos/ui";
import { replace } from "@zos/router";
import { Vibrator, VIBRATOR_SCENE_TIMER, VIBRATOR_SCENE_NOTIFICATION } from "@zos/sensor";
import { setScrollLock } from '@zos/page';
import { getDeviceInfo } from "@zos/device";
import * as alarmMgr from "@zos/alarm";
import { create, id } from "@zos/media";
import { setWakeUpRelaunch } from '@zos/display';
import { parseAlarmSettings, buildAlarmSettingsString } from "../utils/utils";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const globalData = getApp()._options.globalData;

let alarmPlayer = null;
let vibrator = null;

Page({
    onInit(params) {
        console.log('Alarm popup page, params:', params);

        // Keep screen on during alarm to prevent timeout
        try {
            hmApp.setScreenKeep(true);
            console.log('Popup: Screen keep enabled');
        } catch (e) {
            console.log('Popup: Error enabling screen keep:', e);
        }

        // Relaunch app if screen wakes from sleep
        try {
            setWakeUpRelaunch({
                relaunch: true
            });
            console.log('Popup: Wake-up relaunch enabled');
        } catch (e) {
            console.log('Popup: Error enabling wake-up relaunch:', e);
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
                console.log('Popup: Vibration disabled for this alarm');
                return;
            }

            // Use per-alarm vibration type: C = continuous (VIBRATOR_SCENE_TIMER), N = non-continuous (VIBRATOR_SCENE_NOTIFICATION)
            const vibrationMode = settings.vibrationType === 'N' ? VIBRATOR_SCENE_NOTIFICATION : VIBRATOR_SCENE_TIMER;
            const vibrationTypeName = settings.vibrationType === 'N' ? 'VIBRATOR_SCENE_NOTIFICATION' : 'VIBRATOR_SCENE_TIMER';

            vibrator = new Vibrator();
            vibrator.start();
            vibrator.setMode(vibrationMode);
            vibrator.start();
            console.log(`Popup: Alarm vibration started (${vibrationTypeName})`);
        } catch (e) {
            console.log("Popup: Vibrator error:", e);
        }
    },
    startAlarmSound() {
        try {
            // Get alarm params and parse per-alarm settings
            const params = globalData.localStorage.getItem('pending_alarm') || '';
            const settings = parseAlarmSettings(params);

            // Check if sound is enabled for this alarm
            if (!settings.soundEnabled) {
                console.log('Popup: Alarm sound disabled for this alarm');
                return;
            }

            console.log('Popup: Starting alarm sound');
            alarmPlayer = create(id.PLAYER);

            alarmPlayer.addEventListener(alarmPlayer.event.PREPARE, function (result) {
                console.log('Popup: PREPARE event, result:', result);
                if (result) {
                    console.log('Popup: Audio prepared, starting playback');
                    alarmPlayer.start();
                } else {
                    console.log('Popup: Audio prepare failed');
                }
            });

            alarmPlayer.addEventListener(alarmPlayer.event.START, function () {
                console.log('Popup: START event - playback started');
            });

            alarmPlayer.addEventListener(alarmPlayer.event.PAUSE, function () {
                console.log('Popup: PAUSE event');
            });

            alarmPlayer.addEventListener(alarmPlayer.event.STOP, function () {
                console.log('Popup: STOP event');
            });

            alarmPlayer.addEventListener(alarmPlayer.event.COMPLETE, function () {
                console.log('Popup: COMPLETE event - looping audio');
                try {
                    // Re-prepare and restart for continuous loop
                    alarmPlayer.prepare();
                    // Note: start() is called automatically after prepare() in PREPARE event
                } catch (e) {
                    console.log('Popup: Error restarting loop:', e);
                    // Fallback: try just start() if prepare fails
                    try {
                        alarmPlayer.start();
                    } catch (e2) {
                        console.log('Popup: Fallback start also failed:', e2);
                    }
                }
            });

            alarmPlayer.addEventListener(alarmPlayer.event.ERROR, function (error) {
                console.log('Popup: ERROR event:', error);
            });

            alarmPlayer.setSource(alarmPlayer.source.FILE, { file: 'test-alarm.mp3' });
            console.log('Popup: Calling prepare()');
            alarmPlayer.prepare();
        } catch (e) {
            console.log('Popup: Sound playback error:', e);
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
            click_func: () => {
                // Get snooze duration from settings
                const savedSnooze = globalData.localStorage.getItem('snooze_duration');
                const snoozeDurations = [1, 3, 5, 10, 15, 20, 30];
                const snoozeIndex = savedSnooze !== null ? parseInt(savedSnooze) : 2;
                const snoozeMinutes = snoozeDurations[snoozeIndex] || 5;

                // Get original alarm settings to apply to snooze
                const params = globalData.localStorage.getItem('pending_alarm') || '';
                const settings = parseAlarmSettings(params);
                const settingsStr = buildAlarmSettingsString({
                    vibrationEnabled: settings.vibrationEnabled,
                    vibrationType: settings.vibrationType,
                    soundEnabled: settings.soundEnabled
                });

                // Create snooze alarm (current time + snooze duration)
                const snoozeTime = Math.floor(Date.now() / 1000) + (snoozeMinutes * 60);

                const option = {
                    url: 'app-service/index',
                    time: snoozeTime,
                    repeat_type: alarmMgr.REPEAT_ONCE,
                    param: `c_${snoozeTime}_00:${snoozeMinutes < 10 ? '0' : ''}${snoozeMinutes}:00|Snooze||${settingsStr}`,
                };

                const id = alarmMgr.set(option);
                console.log(`Snooze alarm set for ${snoozeMinutes} min, id: ${id}`);

                // Stop vibration
                if (vibrator) {
                    try {
                        vibrator.stop();
                        console.log('Popup: Snooze - stopped vibration');
                    } catch (e) {
                        console.log('Popup: Error stopping vibration:', e);
                    }
                }

                // Stop sound
                if (alarmPlayer) {
                    try {
                        alarmPlayer.stop();
                        console.log('Popup: Snooze - stopped sound');
                    } catch (e) {
                        console.log('Popup: Error stopping sound:', e);
                    }
                }

                // Go to main page
                replace({
                    url: 'pages/alarm',
                    params: 'skip',
                });
            },
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
                        console.log('Popup: Stop button - stopped vibration');
                    } catch (e) {
                        console.log('Popup: Error stopping vibration:', e);
                    }
                }

                // Stop sound
                if (alarmPlayer) {
                    try {
                        alarmPlayer.stop();
                        console.log('Popup: Stop button - stopped sound');
                    } catch (e) {
                        console.log('Popup: Error stopping sound:', e);
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
    onDestroy() {
        console.log('Alarm popup destroyed');

        // Allow screen to sleep again when alarm is dismissed
        try {
            hmApp.setScreenKeep(false);
            console.log('Popup: Screen keep disabled');
        } catch (e) {
            console.log('Popup: Error disabling screen keep:', e);
        }

        // Stop vibration when page is destroyed
        if (vibrator) {
            try {
                vibrator.stop();
                console.log('Popup: onDestroy - stopped vibration');
            } catch (e) {
                console.log('Popup: Error stopping vibration in onDestroy:', e);
            }
        }
        // Stop sound when page is destroyed
        if (alarmPlayer) {
            try {
                alarmPlayer.stop();
                console.log('Popup: onDestroy - stopped sound');
            } catch (e) {
                console.log('Popup: Error stopping sound in onDestroy:', e);
            }
        }
    },
});
