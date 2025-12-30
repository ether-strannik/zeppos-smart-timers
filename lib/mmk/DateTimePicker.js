/**
 * DateTimePicker - Combined date and time picker screen
 */

import hmUI from "@zos/ui";
import { scrollTo } from "@zos/page";
import { CalendarPicker } from "./CalendarPicker";
import { TimePicker } from "./TimePicker";
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_MARGIN_X, SCREEN_MARGIN_Y } from "./UiParams";

export class DateTimePicker {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm ?? (() => {});
    this.onCancel = options.onCancel ?? (() => {});
    this.showTime = options.showTime ?? true;

    // Initial date/time
    const initDate = options.initialDate ?? new Date();
    this.selectedYear = initDate.getFullYear();
    this.selectedMonth = initDate.getMonth();
    this.selectedDay = initDate.getDate();
    this.selectedHour = initDate.getHours();
    this.selectedMinute = initDate.getMinutes();

    this.mode = "date";
    this.widgets = [];
    this.calendarPicker = null;
    this.timePicker = null;
    this.container = null;
  }

  start() {
    // Create fixed container for all picker widgets
    scrollTo({ y: 0 });
    this.container = hmUI.createWidget(hmUI.widget.VIEW_CONTAINER, {
      x: 0,
      y: 0,
      w: SCREEN_WIDTH,
      h: SCREEN_HEIGHT,
      scroll_enable: false,
      z_index: 10
    });

    // Background
    const bg = this.container.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: SCREEN_WIDTH,
      h: SCREEN_HEIGHT,
      color: 0x000000
    });
    this.widgets.push(bg);

    this.renderDateMode();
  }

  renderDateMode() {
    // Clean up old mode widgets (but keep container and background)
    if (this.calendarPicker) {
      this.calendarPicker.destroy();
      this.calendarPicker = null;
    }
    if (this.timePicker) {
      this.timePicker.destroy();
      this.timePicker = null;
    }
    // Clear widgets except background (widgets[0])
    for (let i = 1; i < this.widgets.length; i++) {
      hmUI.deleteWidget(this.widgets[i]);
    }
    this.widgets = this.widgets.slice(0, 1); // Keep only background

    this.mode = "date";

    // Start calendar lower for easier month navigation
    const startY = Math.max(50, SCREEN_MARGIN_Y);

    // Calendar picker
    this.calendarPicker = new CalendarPicker({
      x: SCREEN_MARGIN_X,
      y: startY,
      width: SCREEN_WIDTH - SCREEN_MARGIN_X * 2,
      initialDate: new Date(this.selectedYear, this.selectedMonth, this.selectedDay),
      container: this.container, // Use fixed container
      onSelect: (year, month, day) => {
        this.selectedYear = year;
        this.selectedMonth = month;
        this.selectedDay = day;
        // Re-render buttons after selection
        this.renderButtons();
      }
    });
    this.calendarPicker.render();

    this.renderButtons();
  }

  renderButtons() {
    // Clear old buttons (keep background)
    const bg = this.widgets[0]; // Save background
    for (let i = 1; i < this.widgets.length; i++) {
      hmUI.deleteWidget(this.widgets[i]);
    }
    this.widgets = [bg]; // Reset to just background

    const startY = Math.max(50, SCREEN_MARGIN_Y);
    const calendarBottom = startY + this.calendarPicker.getHeight();
    const btnY = calendarBottom + 6;
    const btnWidth = 100;
    const btnHeight = 36;

    // Single centered button (swipe left to cancel)
    const confirmBtn = this.container.createWidget(hmUI.widget.BUTTON, {
      x: (SCREEN_WIDTH - btnWidth) / 2,
      y: btnY,
      w: btnWidth,
      h: btnHeight,
      text: this.showTime ? "Time >" : "OK",
      text_size: 16,
      radius: 18,
      normal_color: 0x00aaff,
      press_color: 0x0088cc,
      click_func: () => {
        const sel = this.calendarPicker.getSelected();
        this.selectedYear = sel.year;
        this.selectedMonth = sel.month;
        this.selectedDay = sel.day;

        if (this.showTime) {
          this.renderTimeMode();
        } else {
          this.confirm();
        }
      }
    });
    this.widgets.push(confirmBtn);
  }

  renderTimeMode() {
    // Clean up old mode widgets (but keep container and background)
    if (this.calendarPicker) {
      this.calendarPicker.destroy();
      this.calendarPicker = null;
    }
    if (this.timePicker) {
      this.timePicker.destroy();
      this.timePicker = null;
    }
    // Clear widgets except background (widgets[0])
    for (let i = 1; i < this.widgets.length; i++) {
      hmUI.deleteWidget(this.widgets[i]);
    }
    this.widgets = this.widgets.slice(0, 1); // Keep only background

    this.mode = "time";

    // Time picker with numeric keypad (includes its own OK button)
    this.timePicker = new TimePicker({
      initialHour: this.selectedHour,
      initialMinute: this.selectedMinute,
      container: this.container, // Use fixed container
      onSelect: (hour, minute) => {
        this.selectedHour = hour;
        this.selectedMinute = minute;
      },
      onConfirm: (hour, minute) => {
        this.selectedHour = hour;
        this.selectedMinute = minute;
        this.confirm();
      }
    });
    this.timePicker.render();
  }

  confirm() {
    const date = new Date(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay,
      this.selectedHour,
      this.selectedMinute,
      0
    );
    this.destroy();
    this.onConfirm(date);
  }

  getSelectedDate() {
    return new Date(
      this.selectedYear,
      this.selectedMonth,
      this.selectedDay,
      this.selectedHour,
      this.selectedMinute,
      0
    );
  }

  destroy() {
    if (this.calendarPicker) {
      this.calendarPicker.destroy();
      this.calendarPicker = null;
    }
    if (this.timePicker) {
      this.timePicker.destroy();
      this.timePicker = null;
    }
    for (const widget of this.widgets) {
      hmUI.deleteWidget(widget);
    }
    this.widgets = [];
    if (this.container) {
      hmUI.deleteWidget(this.container);
      this.container = null;
    }
  }
}
