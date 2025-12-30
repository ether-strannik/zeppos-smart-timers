# ZeppOS Smart Timers

Advanced timer and alarm application for ZeppOS smartwatches with custom vibrations, 
sound alerts, and intuitive time input.

## Credits & Development History

**Originally forked from:** [albertincx/zeppos-my-timers](https://github.com/albertincx/zeppos-my-timers)

This project started as a fork of albertincx's timer app, but has undergone 
extensive development and transformation:

**Major changes from original:**
- Complete alarm system with scheduling, snooze, and sound
- Upgraded from ZeppOS API 3.0 to API 4.2
- Custom vibration and sound configuration per alarm/timer
- Native keyboard integration replacing custom implementation
- Redesigned UI with icon-based controls
- Screen wake management and lifecycle handling
- Per-alarm/timer settings architecture

After these extensive modifications, this has become a substantially different 
application while retaining the original "timer app" concept as its foundation.

Thank you to albertincx for creating the original project that made this possible!

## License

GPL v3.0 - See LICENSE file

---

## Build Instructions

### Prerequisites
- NodeJS
- [ZeppOS CLI Tools](https://docs.zepp.com/docs/guides/tools/cli/)

### Installation

Clone this project:
```bash
git clone https://github.com/ether-strannik/zeppos-smart-timers.git
cd zeppos-smart-timers
```

Install dependencies:
```bash
npm install
```

### Deploy to Watch

First time setup:
```bash
zeus login    # Links to your Zepp developer account
```

Deploy:
```bash
zeus preview  # Generates QR code in terminal
```

In Zepp app → [Developer Mode](https://docs.zepp.com/docs/guides/tools/zepp-app/) → Scan → scan the QR code to install.

Alternatively, use Bridge mode for real-time deployment without QR scanning.

### Build Package

Create distributable `.zab` file:
```bash
zeus build
```

Output in `dist/` folder.