import { launchApp } from "@zos/router";

const globalData = getApp()._options.globalData;

AppService({
    onInit(params) {
        // Store alarm info so page can show it
        globalData.localStorage.setItem('pending_alarm', params || 'alarm');
        // Vibration and sound playback handled in alarm-popup page (app-service lifecycle too short)
        // Launch the app with alarm popup page
        launchApp({
            appId: 1056908,
            url: 'pages/alarm-popup',
            params: params || 'alarm_triggered',
        });
    },
});
