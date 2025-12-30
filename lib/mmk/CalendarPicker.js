/**
 * CalendarPicker - Visual calendar grid for date selection
 */

import hmUI from "@zos/ui";
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_MARGIN_X, SCREEN_MARGIN_Y } from "./UiParams";

const DAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

export class CalendarPicker {
  constructor(options = {}) {
    this.x = options.x ?? SCREEN_MARGIN_X;
    this.y = options.y ?? 0;
    this.width = options.width ?? (SCREEN_WIDTH - SCREEN_MARGIN_X * 2);
    this.onSelect = options.onSelect ?? (() => {});
    this.container = options.container ?? null; // Fixed container for API 3.0

    // Colors
    this.bgColor = options.bgColor ?? 0x222222;
    this.headerColor = options.headerColor ?? 0x00aaff;
    this.textColor = options.textColor ?? 0xffffff;
    this.weekendColor = options.weekendColor ?? 0xff6666;
    this.selectedBgColor = options.selectedBgColor ?? 0x00aaff;
    this.selectedTextColor = options.selectedTextColor ?? 0x000000;
    this.todayBgColor = options.todayBgColor ?? 0x444444;
    this.otherMonthColor = options.otherMonthColor ?? 0x666666;

    // Initial date
    const initDate = options.initialDate ?? new Date();
    this.viewYear = initDate.getFullYear();
    this.viewMonth = initDate.getMonth();
    this.selectedYear = this.viewYear;
    this.selectedMonth = this.viewMonth;
    this.selectedDay = initDate.getDate();

    // Today reference
    const today = new Date();
    this.todayYear = today.getFullYear();
    this.todayMonth = today.getMonth();
    this.todayDay = today.getDate();

    // Calculate sizes - compact for round screens
    this.cellWidth = Math.floor(this.width / 7);
    this.cellHeight = Math.floor(this.cellWidth * 0.78);
    this.headerHeight = 32;
    this.dayLabelHeight = 22;
    this.fontSize = Math.max(14, Math.floor(this.cellWidth * 0.36));

    this.widgets = [];
  }

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  getFirstDayOfMonth(year, month) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }

  render() {
    this.destroy();

    // Background to cover anything behind
    const bg = (this.container || hmUI).createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: SCREEN_WIDTH,
      h: SCREEN_HEIGHT,
      color: 0x000000
    });
    this.widgets.push(bg);

    this.renderHeader();
    this.renderDayLabels();
    this.renderDays();
  }

  renderHeader() {
    const y = this.y;

    // Previous month button
    const prevBtn = (this.container || hmUI).createWidget(hmUI.widget.BUTTON, {
      x: this.x,
      y: y,
      w: 50,
      h: this.headerHeight,
      text: "<",
      text_size: 22,
      radius: 8,
      normal_color: this.bgColor,
      press_color: 0x444444,
      click_func: () => this.prevMonth()
    });
    this.widgets.push(prevBtn);

    // Month/Year title
    const title = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
      x: this.x + 50,
      y: y,
      w: this.width - 100,
      h: this.headerHeight,
      text: `${MONTHS[this.viewMonth]} ${this.viewYear}`,
      text_size: 18,
      color: this.headerColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(title);

    // Next month button
    const nextBtn = (this.container || hmUI).createWidget(hmUI.widget.BUTTON, {
      x: this.x + this.width - 50,
      y: y,
      w: 50,
      h: this.headerHeight,
      text: ">",
      text_size: 22,
      radius: 8,
      normal_color: this.bgColor,
      press_color: 0x444444,
      click_func: () => this.nextMonth()
    });
    this.widgets.push(nextBtn);
  }

  renderDayLabels() {
    const y = this.y + this.headerHeight;

    for (let i = 0; i < 7; i++) {
      const isWeekend = i >= 5;
      const label = (this.container || hmUI).createWidget(hmUI.widget.TEXT, {
        x: this.x + i * this.cellWidth,
        y: y,
        w: this.cellWidth,
        h: this.dayLabelHeight,
        text: DAYS_SHORT[i],
        text_size: this.fontSize - 2,
        color: isWeekend ? this.weekendColor : this.textColor,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V
      });
      this.widgets.push(label);
    }
  }

  getRowsNeeded() {
    const daysInMonth = this.getDaysInMonth(this.viewYear, this.viewMonth);
    const firstDay = this.getFirstDayOfMonth(this.viewYear, this.viewMonth);
    return Math.ceil((firstDay + daysInMonth) / 7);
  }

  renderDays() {
    const startY = this.y + this.headerHeight + this.dayLabelHeight;
    const daysInMonth = this.getDaysInMonth(this.viewYear, this.viewMonth);
    const firstDay = this.getFirstDayOfMonth(this.viewYear, this.viewMonth);

    const prevMonth = this.viewMonth === 0 ? 11 : this.viewMonth - 1;
    const prevYear = this.viewMonth === 0 ? this.viewYear - 1 : this.viewYear;
    const daysInPrevMonth = this.getDaysInMonth(prevYear, prevMonth);

    let dayNum = 1;
    let nextMonthDay = 1;

    // Calculate actual rows needed (5 or 6 depending on month)
    const rowsNeeded = this.getRowsNeeded();
    for (let row = 0; row < rowsNeeded; row++) {
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        const x = this.x + col * this.cellWidth;
        const y = startY + row * this.cellHeight;

        let displayDay;
        let displayMonth = this.viewMonth;
        let displayYear = this.viewYear;
        let isOtherMonth = false;

        if (cellIndex < firstDay) {
          displayDay = daysInPrevMonth - firstDay + cellIndex + 1;
          displayMonth = prevMonth;
          displayYear = prevYear;
          isOtherMonth = true;
        } else if (dayNum <= daysInMonth) {
          displayDay = dayNum;
          dayNum++;
        } else {
          displayDay = nextMonthDay;
          displayMonth = this.viewMonth === 11 ? 0 : this.viewMonth + 1;
          displayYear = this.viewMonth === 11 ? this.viewYear + 1 : this.viewYear;
          nextMonthDay++;
          isOtherMonth = true;
        }

        this.renderDayCell(x, y, displayDay, displayMonth, displayYear, col, isOtherMonth);
      }
    }
  }

  renderDayCell(x, y, day, month, year, col, isOtherMonth) {
    const isWeekend = col >= 5;
    const isSelected = day === this.selectedDay &&
                       month === this.selectedMonth &&
                       year === this.selectedYear;
    const isToday = day === this.todayDay &&
                    month === this.todayMonth &&
                    year === this.todayYear;

    // Determine background and text colors
    let btnBgColor = 0x000000;
    let textColor = this.textColor;

    if (isSelected) {
      btnBgColor = this.selectedBgColor;
      textColor = this.selectedTextColor;
    } else if (isToday && !isOtherMonth) {
      btnBgColor = this.todayBgColor;
    }

    if (isOtherMonth) {
      textColor = this.otherMonthColor;
    } else if (isWeekend && !isSelected) {
      textColor = this.weekendColor;
    }

    // Calculate button size for rounded appearance
    const margin = 2;
    const btnSize = Math.min(this.cellWidth, this.cellHeight) - margin * 2;
    const btnX = x + (this.cellWidth - btnSize) / 2;
    const btnY = y + (this.cellHeight - btnSize) / 2;

    // Single button with rounded corners for selection highlight
    const btn = (this.container || hmUI).createWidget(hmUI.widget.BUTTON, {
      x: btnX,
      y: btnY,
      w: btnSize,
      h: btnSize,
      text: String(day),
      text_size: this.fontSize,
      color: textColor,
      radius: btnSize / 2,
      normal_color: btnBgColor,
      press_color: 0x444444,
      click_func: () => {
        this.selectedDay = day;
        this.selectedMonth = month;
        this.selectedYear = year;
        if (isOtherMonth) {
          this.viewMonth = month;
          this.viewYear = year;
        }
        this.render();
        this.onSelect(year, month, day);
      }
    });
    this.widgets.push(btn);
  }

  prevMonth() {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
    this.render();
  }

  nextMonth() {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
    this.render();
  }

  getSelected() {
    return {
      year: this.selectedYear,
      month: this.selectedMonth,
      day: this.selectedDay
    };
  }

  getSelectedDate() {
    return new Date(this.selectedYear, this.selectedMonth, this.selectedDay);
  }

  destroy() {
    for (const widget of this.widgets) {
      hmUI.deleteWidget(widget);
    }
    this.widgets = [];
  }

  getHeight() {
    return this.headerHeight + this.dayLabelHeight + (this.cellHeight * this.getRowsNeeded());
  }
}
