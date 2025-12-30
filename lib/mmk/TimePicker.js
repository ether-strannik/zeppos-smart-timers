/**
 * TimePicker - Numeric keypad style time picker
 *
 * Layout:
 *     HH : MM
 *   1   2   3
 *   4   5   6
 *   7   8   9
 *  :00  0  :30
 *       OK
 */

import hmUI from "@zos/ui";
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_MARGIN_X } from "./UiParams";

export class TimePicker {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm ?? (() => {});
    this.onSelect = options.onSelect ?? (() => {});
    this.container = options.container ?? null; // Fixed container for API 3.0

    // Initial time
    const initHour = options.initialHour ?? 12;
    const initMinute = options.initialMinute ?? 0;

    // Input state: "HH:MM" as string, cursor position
    this.digits = [
      Math.floor(initHour / 10),
      initHour % 10,
      Math.floor(initMinute / 10),
      initMinute % 10
    ];
    this.cursorPos = 0; // 0-3: which digit we're editing

    // Colors
    this.activeColor = 0x00aaff;
    this.inactiveColor = 0xaaaaaa;
    this.btnColor = 0x333333;
    this.btnPressColor = 0x555555;

    this.widgets = [];
  }

  render() {
    this.destroy();

    const centerX = SCREEN_WIDTH / 2;

    // Start position
    const startY = 45;

    // Background
    const bg = (this.container || hmUI).createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: SCREEN_WIDTH,
      h: SCREEN_HEIGHT,
      color: 0x000000
    });
    this.widgets.push(bg);

    // Time display: HH:MM
    this.renderTimeDisplay(centerX, startY);

    // Numeric keypad
    const keypadY = startY + 55;
    const keypadHeight = this.renderKeypad(centerX, keypadY);

    // OK button at bottom (after keypad)
    const okY = keypadY + keypadHeight + 8;
    this.renderOkButton(centerX, okY);
  }

  renderTimeDisplay(centerX, y) {
    const digitWidth = 52;
    const colonWidth = 30;
    const fontSize = 64;
    const height = 65;
    const totalWidth = digitWidth * 4 + colonWidth;
    const startX = centerX - totalWidth / 2;

    // Hour digit 1
    this.hourDigit1 = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: startX,
      y: y,
      w: digitWidth,
      h: height,
      text: String(this.digits[0]),
      text_size: fontSize,
      color: this.cursorPos === 0 ? this.activeColor : this.inactiveColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.hourDigit1);

    // Hour digit 2
    this.hourDigit2 = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: startX + digitWidth,
      y: y,
      w: digitWidth,
      h: height,
      text: String(this.digits[1]),
      text_size: fontSize,
      color: this.cursorPos === 1 ? this.activeColor : this.inactiveColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.hourDigit2);

    // Colon
    const colon = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: startX + digitWidth * 2,
      y: y,
      w: colonWidth,
      h: height,
      text: ":",
      text_size: fontSize,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(colon);

    // Minute digit 1
    this.minDigit1 = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: startX + digitWidth * 2 + colonWidth,
      y: y,
      w: digitWidth,
      h: height,
      text: String(this.digits[2]),
      text_size: fontSize,
      color: this.cursorPos === 2 ? this.activeColor : this.inactiveColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.minDigit1);

    // Minute digit 2
    this.minDigit2 = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: startX + digitWidth * 3 + colonWidth,
      y: y,
      w: digitWidth,
      h: height,
      text: String(this.digits[3]),
      text_size: fontSize,
      color: this.cursorPos === 3 ? this.activeColor : this.inactiveColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.minDigit2);
  }

  renderKeypad(centerX, startY) {
    const btnSize = 68;
    const gap = 3;
    const rowWidth = btnSize * 3 + gap * 2;
    const startX = centerX - rowWidth / 2;

    // Row 1: 1, 2, 3
    this.createKeypadButton(startX, startY, btnSize, "1", () => this.inputDigit(1));
    this.createKeypadButton(startX + btnSize + gap, startY, btnSize, "2", () => this.inputDigit(2));
    this.createKeypadButton(startX + (btnSize + gap) * 2, startY, btnSize, "3", () => this.inputDigit(3));

    // Row 2: 4, 5, 6
    const row2Y = startY + btnSize + gap;
    this.createKeypadButton(startX, row2Y, btnSize, "4", () => this.inputDigit(4));
    this.createKeypadButton(startX + btnSize + gap, row2Y, btnSize, "5", () => this.inputDigit(5));
    this.createKeypadButton(startX + (btnSize + gap) * 2, row2Y, btnSize, "6", () => this.inputDigit(6));

    // Row 3: 7, 8, 9
    const row3Y = startY + (btnSize + gap) * 2;
    this.createKeypadButton(startX, row3Y, btnSize, "7", () => this.inputDigit(7));
    this.createKeypadButton(startX + btnSize + gap, row3Y, btnSize, "8", () => this.inputDigit(8));
    this.createKeypadButton(startX + (btnSize + gap) * 2, row3Y, btnSize, "9", () => this.inputDigit(9));

    // Row 4: :00, 0, :30
    const row4Y = startY + (btnSize + gap) * 3;
    this.createKeypadButton(startX, row4Y, btnSize, ":00", () => this.setMinutes(0), 24);
    this.createKeypadButton(startX + btnSize + gap, row4Y, btnSize, "0", () => this.inputDigit(0));
    this.createKeypadButton(startX + (btnSize + gap) * 2, row4Y, btnSize, ":30", () => this.setMinutes(30), 24);

    // Return total height: 4 rows of buttons + 3 gaps
    return (btnSize * 4) + (gap * 3);
  }

  createKeypadButton(x, y, size, text, callback, fontSize = 32) {
    const btn = (this.container || hmUI).createWidget(hmUI.widget.BUTTON, {
      x: x,
      y: y,
      w: size,
      h: size,
      radius: 8,
      text: text,
      text_size: fontSize,
      normal_color: this.btnColor,
      press_color: this.btnPressColor,
      click_func: callback
    });
    this.widgets.push(btn);
  }

  renderOkButton(centerX, y) {
    const btnWidth = 80;
    const btnHeight = 36;
    const okBtn = (this.container || hmUI).createWidget(hmUI.widget.BUTTON, {
      x: centerX - btnWidth / 2,
      y: y,
      w: btnWidth,
      h: btnHeight,
      radius: 18,
      text: "OK",
      text_size: 18,
      normal_color: this.activeColor,
      press_color: 0x0088cc,
      click_func: () => this.confirm()
    });
    this.widgets.push(okBtn);
  }

  inputDigit(digit) {
    // Validate based on position
    if (this.cursorPos === 0) {
      // First hour digit: 0-2
      if (digit <= 2) {
        this.digits[0] = digit;
        this.cursorPos = 1;
      }
    } else if (this.cursorPos === 1) {
      // Second hour digit: 0-9, but max 23
      if (this.digits[0] === 2 && digit > 3) {
        // Invalid, ignore
      } else {
        this.digits[1] = digit;
        this.cursorPos = 2;
      }
    } else if (this.cursorPos === 2) {
      // First minute digit: 0-5
      if (digit <= 5) {
        this.digits[2] = digit;
        this.cursorPos = 3;
      }
    } else if (this.cursorPos === 3) {
      // Second minute digit: 0-9
      this.digits[3] = digit;
      this.cursorPos = 0; // Wrap around
    }

    this.updateDisplay();
    this.notifyChange();
  }

  setMinutes(minutes) {
    this.digits[2] = Math.floor(minutes / 10);
    this.digits[3] = minutes % 10;
    this.cursorPos = 0;
    this.updateDisplay();
    this.notifyChange();
  }

  updateDisplay() {
    this.hourDigit1.setProperty(hmUI.prop.TEXT, String(this.digits[0]));
    this.hourDigit2.setProperty(hmUI.prop.TEXT, String(this.digits[1]));
    this.minDigit1.setProperty(hmUI.prop.TEXT, String(this.digits[2]));
    this.minDigit2.setProperty(hmUI.prop.TEXT, String(this.digits[3]));

    // Update colors based on cursor
    this.hourDigit1.setProperty(hmUI.prop.COLOR, this.cursorPos === 0 ? this.activeColor : this.inactiveColor);
    this.hourDigit2.setProperty(hmUI.prop.COLOR, this.cursorPos === 1 ? this.activeColor : this.inactiveColor);
    this.minDigit1.setProperty(hmUI.prop.COLOR, this.cursorPos === 2 ? this.activeColor : this.inactiveColor);
    this.minDigit2.setProperty(hmUI.prop.COLOR, this.cursorPos === 3 ? this.activeColor : this.inactiveColor);
  }

  notifyChange() {
    const hour = this.digits[0] * 10 + this.digits[1];
    const minute = this.digits[2] * 10 + this.digits[3];
    this.onSelect(hour, minute);
  }

  confirm() {
    const hour = this.digits[0] * 10 + this.digits[1];
    const minute = this.digits[2] * 10 + this.digits[3];
    this.onConfirm(hour, minute);
  }

  getSelected() {
    return {
      hour: this.digits[0] * 10 + this.digits[1],
      minute: this.digits[2] * 10 + this.digits[3]
    };
  }

  destroy() {
    for (const widget of this.widgets) {
      hmUI.deleteWidget(widget);
    }
    this.widgets = [];
  }

  getHeight() {
    return 280;
  }
}
