# ZeppOS Smart Timers

Advanced timer and alarm application for ZeppOS smartwatches with custom vibrations, sound alerts, and intuitive time input.

## Credits

**Built on the foundation of:** [albertincx/zeppos-my-timers](https://github.com/albertincx/zeppos-my-timers)

Timer and alarm app for ZeppOS, substantially expanded from the original timer concept by albertincx.

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