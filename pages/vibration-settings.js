import hmUI from "@zos/ui";
import {replace} from "@zos/router";

const globalData = getApp()._options.globalData;
const STORAGE_KEY_SNOOZE = 'snooze_duration';
const STORAGE_KEY_SORT_BY_NAME = 'sort_by_name';

const snoozeDurations = [1, 3, 5, 10, 15, 20, 30]; // Minutes

let snoozeDuration = 2; // Default to 5 minutes (index 2)
let sortByName = false; // Default to time-based sort

// Function to build the settings UI
function buildSettingsUI() {
    // Clear existing UI
    hmUI.deleteWidget(hmUI.widget.WIDGET_MORE, {});

    // Title
    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 80,
        w: 480,
        h: 50,
        text: 'Settings',
        text_size: 32,
        align_h: hmUI.align.CENTER_H,
        color: 0xffffff,
    });

    // Snooze duration label
    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 220,
        w: 480 - 200,
        h: 60,
        text: 'Snooze Duration',
        text_size: 28,
        color: 0xffffff,
    });

    // Snooze duration selector button
    const snoozeLabel = snoozeDurations[snoozeDuration] + ' min';

    hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 480 - 160,
        y: 220,
        w: 100,
        h: 60,
        radius: 30,
        text: snoozeLabel,
        text_size: 20,
        normal_color: 0x00ABBD,
        press_color: 0x026E81,
        click_func: () => {
            snoozeDuration = (snoozeDuration + 1) % snoozeDurations.length;
            globalData.localStorage.setItem(STORAGE_KEY_SNOOZE, snoozeDuration.toString());
            buildSettingsUI(); // Rebuild UI with new value
        }
    });

    // Sort by name label
    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 310,
        w: 480 - 200,
        h: 60,
        text: 'Sort by Name',
        text_size: 28,
        color: 0xffffff,
    });

    // Sort by name toggle button
    hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 480 - 140,
        y: 310,
        w: 80,
        h: 60,
        radius: 30,
        text: sortByName ? 'ON' : 'OFF',
        text_size: 20,
        normal_color: sortByName ? 0x00ABBD : 0xA1A2A6,
        press_color: sortByName ? 0x026E81 : 0xA1A2A6,
        click_func: () => {
            sortByName = !sortByName;
            globalData.localStorage.setItem(STORAGE_KEY_SORT_BY_NAME, sortByName.toString());
            buildSettingsUI(); // Rebuild UI with new toggle state
        }
    });

    // Done button
    hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 120,
        y: 420,
        w: 240,
        h: 70,
        radius: 12,
        text: 'Done',
        text_size: 24,
        normal_color: 0x008CDB,
        press_color: 0x086CB4,
        click_func: () => {
            replace({
                url: 'pages/alarm',
                params: 'skip',
            });
        }
    });

    // Bottom spacer for better scrolling
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 550,
        w: 1,
        h: 60,
        color: 0x000000,
    });
}

Page({
    build() {
        // Load saved settings
        try {
            const savedSnooze = globalData.localStorage.getItem(STORAGE_KEY_SNOOZE);
            if (savedSnooze !== null && savedSnooze !== undefined) {
                const val = parseInt(savedSnooze);
                if (val >= 0 && val < snoozeDurations.length) {
                    snoozeDuration = val;
                }
            }

            const savedSort = globalData.localStorage.getItem(STORAGE_KEY_SORT_BY_NAME);
            if (savedSort !== null && savedSort !== undefined) {
                sortByName = savedSort === 'true';
            }
        } catch (e) {
            // Error loading settings
        }

        // Build the UI
        buildSettingsUI();
    }
});
