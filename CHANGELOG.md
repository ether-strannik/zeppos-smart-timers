# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-30

First major release. Timer and alarm app for ZeppOS, substantially expanded from the original timer concept by [albertincx/zeppos-my-timers](https://github.com/albertincx/zeppos-my-timers).

### Added

- **Alarm system** with time-based scheduling and daily repeat option
- **Alarm popup page** with full-screen display, SNOOZE and STOP buttons
- **Snooze feature** with configurable duration (1, 3, 5, 10, 15, 20, 30 minutes)
- **Per-alarm/timer settings** for vibration (on/off, continuous/pulse) and sound (on/off)
- **Creation wizard** for configuring alarm/timer before saving
- **Alarm ON/OFF toggle** to save alarm presets without activating them
- **Native system keyboard** (API 4.2) with T9, voice input, emoji picker
- **Custom naming** for alarms and timers
- **Sort by name** option with section dividers for alarms and timers
- **Sort by category** (alarms vs timers) as default view
- **TimePicker numeric keypad** for intuitive time selection
- **Alarm sound playback** with continuous looping
- **Screen wake lock** to keep alarm active during screen timeout
- **Long press to edit** timers (500ms threshold)
- **Visual indicators** for disabled alarms (gray color, muted icon)

### Changed (from original zeppos-my-timers)

- Upgraded to ZeppOS API 4.2 (from API 3.0)
- Replaced WIDGET_PICKER with custom TimePicker numeric keypad
- Replaced text buttons with icon-based UI
- Timer interaction: tap to start, long press to edit
- Replaced system notification-based alerts with dedicated alarm popup page

### Removed (from original zeppos-my-timers)

- Countdown feature (consolidated with timer)
