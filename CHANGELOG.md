# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Custom timer naming with QWERTY keyboard input
- TimePicker numeric keypad for intuitive time selection (HH:MM format)
- Alarm feature with time-based scheduling
- Static display component for active alarms
- Configurable vibration settings for alarms and timers
- Alarm repeat settings for daily recurrence
- Continuous vibration support using custom vibration modes
- Dedicated alarm popup page with full-screen display
- App launch on alarm trigger with automatic screen wake
- Snooze feature with configurable duration (1, 3, 5, 10, 15, 20, 30 minutes)
- SNOOZE button on alarm popup (alongside STOP button)
- Sort by Name option in settings (alphabetical sorting)
- Alarm sound playback with looping support using @zos/media API
- Alarm sound enable/disable toggle in settings
- Vibration enable/disable toggle in settings
- TEST SOUND button for testing audio playback
- TEST VIBRATION button for testing vibration modes
- Vibration test page with all API 2.0+ and API 3.6+ vibration types
- Creation wizard with per-alarm/timer settings (vibration, vibration type, sound)
- Per-alarm/timer settings stored with each alarm (not global)
- Alarm ON/OFF toggle in creation wizard (save alarm presets without activating them)
- Visual indicators for disabled alarms (🔕 icon and gray color)
- Native system keyboard with voice input support (API 4.2)
- T9 multi-tap text input for alarm/timer names
- Voice-to-text input for hands-free naming
- Native emoji picker for alarm/timer names
- Long press to edit timers (500ms threshold)
- Screen wake lock to keep alarm active even when screen turns off
- Wake-up relaunch to restore alarm if screen wakes from sleep
- Section dividers for ALARMS and TIMERS when sorting by name

### Changed

- **MAJOR: Upgrade to ZeppOS API 4.2** (from API 3.0/4.0)
- **MAJOR: Replace custom ScreenBoard keyboard with native SYSTEM_KEYBOARD** (API 4.2 feature)
- Replace WIDGET_PICKER with custom TimePicker numeric keypad
- Replace text buttons with icon buttons for cleaner UI
- Replace notification system with direct app launch and vibration control
- Simplify vibration settings to single alarm selector (removed separate timer option)
- Remove "Time:" prefix from clock display (now shows just "20:35")
- Improve alarm/timer name parsing in popup to handle custom labels
- Rename "Vibration Settings" to "Settings"
- Improve alarm popup layout (move text and buttons higher for better visibility)
- Move vibration and sound playback to alarm popup page (from app-service for longer lifecycle)
- Hardcode VIBRATOR_SCENE_TIMER for reliable continuous vibration
- Remove vibration mode selector from settings (keep only enable/disable toggle)
- Reorganize settings screen order: Vibration, Alarm Sound, Snooze Duration, Sort by Name
- Move vibration/sound settings from global to per-alarm/timer configuration
- Settings page now only contains global settings (snooze duration, sort by name)
- Non-continuous vibration now uses VIBRATOR_SCENE_NOTIFICATION (two short pulses) instead of VIBRATOR_SCENE_STRONG_REMINDER
- Text input now uses professional native keyboard UI consistent with system apps
- Keyboard input modes: T9, voice, emoji, numbers, symbols (all built-in)
- Alarm storage format now includes enabled flag (E1/E0) for ON/OFF state
- Timer interaction: tap to start, long press (500ms) to edit
- Alarm sound now loops continuously with improved re-prepare logic for gapless playback
- Screen stays on during alarm (hmApp.setScreenKeep) to prevent timeout dismissal
- Sort by Name now groups alarms and timers into separate sections with visual dividers

### Fixed

- Fix timer duration display and running state
- Fix custom name preservation when starting timer
- Fix timer name display and text sizing
- Fix alarm behavior and display
- Fix alarm popup text positioning by using getDeviceInfo for dimensions
- Fix alarm being dismissed when screen times out (app now stays active with screen off)
- Fix timer/alarm deletion when canceling edit (now preserves original on swipe back)
- Fix alarm editing to preserve custom name and repeat daily settings
- Fix alarm sound cutting off after 1-3 seconds (moved playback to page context)
- Fix vibration cutting off prematurely (moved to page context with longer lifecycle)
- Fix per-alarm settings not preserved when starting saved timers
- Fix snooze not inheriting original alarm's vibration and sound settings

### Removed

- Remove countdown functionality (consolidated with timer feature)
- Remove custom ScreenBoard keyboard implementation (replaced with native SYSTEM_KEYBOARD)
- Remove ScreenBoard.js, ScreenBoardSetup.js, and ScreenBoardData/* (archived)
- Remove custom QWERTY, T9, and T14 keyboard rendering plugins
- Remove DeviceParams keyboard configuration

---
