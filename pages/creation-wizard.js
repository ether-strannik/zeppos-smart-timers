import hmUI from "@zos/ui";
import { replace } from "@zos/router";
import { setScrollLock } from '@zos/page';
import { getDeviceInfo } from "@zos/device";
import { selectTime } from "../components/time/selectTime";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();
const globalData = getApp()._options.globalData;

// Wizard state
let wizardState = {
    mode: 'alarm', // 'alarm' or 'timer'
    vibrationEnabled: true,
    vibrationType: 'C', // 'C' = continuous, 'N' = non-continuous
    soundEnabled: true,
    alarmEnabled: true, // For alarm ON/OFF toggle (only used for alarms)
    // For editing
    existingData: null, // {time, name, repeat}
    storageKey: null // Storage key for editing (to delete old item on save)
};

// Widget references for updating
let modeAlarmBtn = null;
let alarmEnabledLabel = null;
let alarmEnabledBtn = null;
let vibrationBtn = null;
let vibrationTypeBtn = null;
let vibrationTypeLabel = null;
let soundBtn = null;

let selectTimeVc = null;

Page({
    onInit(param) {
        console.log('Creation wizard onInit, params:', param);

        // Parse params if provided
        if (param) {
            try {
                const config = JSON.parse(param);

                // Set mode from params
                if (config.mode === 'alarm' || config.mode === 'timer') {
                    wizardState.mode = config.mode;
                }

                // If editing, populate with existing data
                if (config.editing && config.existingData) {
                    wizardState.existingData = {
                        time: config.existingData.time,
                        name: config.existingData.name,
                        repeat: config.existingData.repeat
                    };

                    // Store the storage key for deletion on save
                    wizardState.storageKey = config.storageKey || null;

                    // Populate settings from existing data
                    wizardState.vibrationEnabled = config.existingData.vibrationEnabled !== false;
                    wizardState.vibrationType = config.existingData.vibrationType || 'C';
                    wizardState.soundEnabled = config.existingData.soundEnabled !== false;
                    wizardState.alarmEnabled = config.existingData.enabled !== false; // Default to true
                }
            } catch (e) {
                console.log('Error parsing wizard params:', e);
            }
        }
    },

    build() {
        // Background
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: 0,
            y: 0,
            w: DEVICE_WIDTH,
            h: DEVICE_HEIGHT,
            color: 0x000000,
        });

        // Title
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: 60,
            w: DEVICE_WIDTH,
            h: 50,
            text: 'CREATE ALARM/TIMER',
            text_size: 28,
            align_h: hmUI.align.CENTER_H,
            color: 0xffffff,
        });

        // Mode selection label
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 60,
            y: 140,
            w: DEVICE_WIDTH - 200,
            h: 60,
            text: 'Type',
            text_size: 28,
            color: 0xffffff,
        });

        // Type selector button (toggles between Alarm/Timer)
        modeAlarmBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
            x: DEVICE_WIDTH - 160,
            y: 140,
            w: 100,
            h: 60,
            radius: 30,
            text: wizardState.mode === 'alarm' ? 'Alarm' : 'Timer',
            text_size: 20,
            normal_color: 0x00ABBD,
            press_color: 0x026E81,
            click_func: () => {
                wizardState.mode = wizardState.mode === 'alarm' ? 'timer' : 'alarm';
                updateModeButtons();
            }
        });

        let yPos = 220;

        // Alarm Status label (only for alarms)
        alarmEnabledLabel = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 60,
            y: yPos,
            w: DEVICE_WIDTH - 200,
            h: 60,
            text: 'Alarm Status',
            text_size: 28,
            color: 0xffffff,
        });

        // Alarm ON/OFF toggle (only for alarms)
        alarmEnabledBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
            x: DEVICE_WIDTH - 140,
            y: yPos,
            w: 80,
            h: 60,
            radius: 30,
            text: wizardState.alarmEnabled ? 'ON' : 'OFF',
            text_size: 20,
            normal_color: wizardState.alarmEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.alarmEnabled ? 0x026E81 : 0x590414,
            click_func: () => {
                wizardState.alarmEnabled = !wizardState.alarmEnabled;
                updateAlarmEnabledButton();
            }
        });

        // Initially hide alarm status if mode is timer
        updateAlarmStatusVisibility();

        yPos += 80;

        // Vibration label
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 60,
            y: yPos,
            w: DEVICE_WIDTH - 240,
            h: 60,
            text: 'Vibration',
            text_size: 28,
            color: 0xffffff,
        });

        // Vibration enable/disable button
        vibrationBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
            x: DEVICE_WIDTH - 180,
            y: yPos,
            w: 120,
            h: 60,
            radius: 30,
            text: wizardState.vibrationEnabled ? 'Enabled' : 'Disabled',
            text_size: 20,
            normal_color: wizardState.vibrationEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.vibrationEnabled ? 0x026E81 : 0x590414,
            click_func: () => {
                wizardState.vibrationEnabled = !wizardState.vibrationEnabled;
                updateVibrationButton();
                updateVibrationTypeVisibility();
            }
        });

        yPos += 80;

        // Vibration type label
        vibrationTypeLabel = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 60,
            y: yPos,
            w: DEVICE_WIDTH - 280,
            h: 60,
            text: 'Type',
            text_size: 28,
            color: 0xffffff,
        });

        // Vibration type selector
        const vibrationTypes = { 'C': 'Continuous', 'N': 'Non-continuous' };
        vibrationTypeBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
            x: DEVICE_WIDTH - 220,
            y: yPos,
            w: 160,
            h: 60,
            radius: 30,
            text: vibrationTypes[wizardState.vibrationType],
            text_size: 20,
            normal_color: 0x00ABBD,
            press_color: 0x026E81,
            click_func: () => {
                // Toggle between C and N
                wizardState.vibrationType = wizardState.vibrationType === 'C' ? 'N' : 'C';
                vibrationTypeBtn.setProperty(hmUI.prop.TEXT, vibrationTypes[wizardState.vibrationType]);
            }
        });

        // Initially hide vibration type if vibration is disabled
        updateVibrationTypeVisibility();

        yPos += 80;

        // Sound label
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 60,
            y: yPos,
            w: DEVICE_WIDTH - 240,
            h: 60,
            text: 'Sound',
            text_size: 28,
            color: 0xffffff,
        });

        // Sound enable/disable button
        soundBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
            x: DEVICE_WIDTH - 180,
            y: yPos,
            w: 120,
            h: 60,
            radius: 30,
            text: wizardState.soundEnabled ? 'Enabled' : 'Disabled',
            text_size: 20,
            normal_color: wizardState.soundEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.soundEnabled ? 0x026E81 : 0x590414,
            click_func: () => {
                wizardState.soundEnabled = !wizardState.soundEnabled;
                updateSoundButton();
            }
        });

        yPos += 100;

        // Next button
        hmUI.createWidget(hmUI.widget.BUTTON, {
            x: 120,
            y: yPos,
            w: 240,
            h: 70,
            radius: 12,
            text: 'NEXT',
            text_size: 28,
            normal_color: 0x008CDB,
            press_color: 0x086CB4,
            click_func: () => {
                proceedToTimeSelection();
            }
        });

        yPos += 80;

        // Bottom spacer for better scrolling
        hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: 0,
            y: yPos,
            w: 1,
            h: 60,
            color: 0x000000,
        });

        console.log('Wizard UI built successfully');
    },

    onDestroy() {
        console.log('Wizard page destroyed');
    }
});

// Update mode buttons appearance
function updateModeButtons() {
    if (modeAlarmBtn) {
        modeAlarmBtn.setProperty(hmUI.prop.TEXT, wizardState.mode === 'alarm' ? 'Alarm' : 'Timer');
    }
    // Also update alarm status visibility when switching modes
    updateAlarmStatusVisibility();
}

// Update alarm enabled button appearance
function updateAlarmEnabledButton() {
    if (alarmEnabledBtn) {
        alarmEnabledBtn.setProperty(hmUI.prop.TEXT, wizardState.alarmEnabled ? 'ON' : 'OFF');
        alarmEnabledBtn.setProperty(hmUI.prop.MORE, {
            normal_color: wizardState.alarmEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.alarmEnabled ? 0x026E81 : 0x590414
        });
    }
}

// Update alarm status visibility (only show for alarms, not timers)
function updateAlarmStatusVisibility() {
    if (alarmEnabledLabel && alarmEnabledBtn) {
        if (wizardState.mode === 'alarm') {
            // Show alarm status for alarm mode
            alarmEnabledLabel.setProperty(hmUI.prop.VISIBLE, true);
            alarmEnabledBtn.setProperty(hmUI.prop.VISIBLE, true);
        } else {
            // Hide alarm status for timer mode
            alarmEnabledLabel.setProperty(hmUI.prop.VISIBLE, false);
            alarmEnabledBtn.setProperty(hmUI.prop.VISIBLE, false);
        }
    }
}

// Update vibration button appearance
function updateVibrationButton() {
    if (vibrationBtn) {
        vibrationBtn.setProperty(hmUI.prop.TEXT, wizardState.vibrationEnabled ? 'Enabled' : 'Disabled');
        vibrationBtn.setProperty(hmUI.prop.MORE, {
            normal_color: wizardState.vibrationEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.vibrationEnabled ? 0x026E81 : 0x590414
        });
    }
}

// Update vibration type visibility
function updateVibrationTypeVisibility() {
    if (vibrationTypeLabel && vibrationTypeBtn) {
        if (wizardState.vibrationEnabled) {
            // Show vibration type selector
            vibrationTypeLabel.setProperty(hmUI.prop.VISIBLE, true);
            vibrationTypeBtn.setProperty(hmUI.prop.VISIBLE, true);
        } else {
            // Hide vibration type selector
            vibrationTypeLabel.setProperty(hmUI.prop.VISIBLE, false);
            vibrationTypeBtn.setProperty(hmUI.prop.VISIBLE, false);
        }
    }
}

// Update sound button appearance
function updateSoundButton() {
    if (soundBtn) {
        soundBtn.setProperty(hmUI.prop.TEXT, wizardState.soundEnabled ? 'Enabled' : 'Disabled');
        soundBtn.setProperty(hmUI.prop.MORE, {
            normal_color: wizardState.soundEnabled ? 0x00ABBD : 0x8C1B2F,
            press_color: wizardState.soundEnabled ? 0x026E81 : 0x590414
        });
    }
}

// Proceed to time selection with wizard config
function proceedToTimeSelection() {
    console.log('Proceeding to time selection with config:', wizardState);

    // Build wizard config
    const wizardConfig = {
        vibrationEnabled: wizardState.vibrationEnabled,
        vibrationType: wizardState.vibrationType,
        soundEnabled: wizardState.soundEnabled,
        enabled: wizardState.alarmEnabled // Include alarm enabled state
    };

    // Call selectTime with mode, existing data (if editing), wizard config, and storage key
    selectTimeVc = selectTime(wizardState.mode, wizardState.existingData, wizardConfig, wizardState.storageKey);
    setScrollLock({ lock: true });
}
