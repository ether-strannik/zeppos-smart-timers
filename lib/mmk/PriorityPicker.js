/**
 * PriorityPicker - Grid-based priority selector (0-9)
 *
 * Layout:
 *     Priority: 5
 *      (Medium)
 *
 *    1   2   3
 *    4   5   6
 *    7   8   9
 *        0
 *       OK
 *
 * Priority meanings:
 * - 0: None (white)
 * - 1-4: High (red)
 * - 5: Medium (yellow)
 * - 6-9: Low (blue)
 */

import hmUI from "@zos/ui";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "./UiParams";

export class PriorityPicker {
  constructor(options = {}) {
    this.onConfirm = options.onConfirm ?? (() => {});
    this.onCancel = options.onCancel ?? (() => {});
    this.priority = options.initialPriority ?? 0;

    // Colors for priority levels
    this.highColor = 0xff4444;    // Red
    this.mediumColor = 0xffaa00;  // Yellow/Orange
    this.lowColor = 0x4488ff;     // Blue
    this.noneColor = 0xaaaaaa;    // Gray

    this.btnColor = 0x333333;
    this.btnPressColor = 0x555555;
    this.activeColor = 0x00aaff;

    this.widgets = [];
  }

  getPriorityColor(priority) {
    if (priority >= 1 && priority <= 4) return this.highColor;
    if (priority === 5) return this.mediumColor;
    if (priority >= 6 && priority <= 9) return this.lowColor;
    return this.noneColor;
  }

  getPriorityLabel(priority) {
    if (priority >= 1 && priority <= 4) return "High";
    if (priority === 5) return "Medium";
    if (priority >= 6 && priority <= 9) return "Low";
    return "None";
  }

  render() {
    this.destroy();

    const centerX = SCREEN_WIDTH / 2;
    const startY = 35;

    // Create fixed container
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

    // Priority display
    this.renderPriorityDisplay(centerX, startY);

    // Number grid
    const gridY = startY + 90;
    const gridHeight = this.renderGrid(centerX, gridY);

    // OK button
    const okY = gridY + gridHeight + 10;
    this.renderOkButton(centerX, okY);
  }

  renderPriorityDisplay(centerX, y) {
    // "Priority:" label
    const label = this.container.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y,
      w: SCREEN_WIDTH,
      h: 30,
      text: "Priority:",
      text_size: 24,
      color: 0xaaaaaa,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(label);

    // Priority value (large)
    this.valueText = this.container.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y + 28,
      w: SCREEN_WIDTH,
      h: 45,
      text: String(this.priority),
      text_size: 48,
      color: this.getPriorityColor(this.priority),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.valueText);

    // Priority label (High/Medium/Low/None)
    this.labelText = this.container.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: y + 68,
      w: SCREEN_WIDTH,
      h: 24,
      text: "(" + this.getPriorityLabel(this.priority) + ")",
      text_size: 20,
      color: this.getPriorityColor(this.priority),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V
    });
    this.widgets.push(this.labelText);
  }

  renderGrid(centerX, startY) {
    const btnSize = 68;
    const gap = 3;
    const rowWidth = btnSize * 3 + gap * 2;
    const startX = centerX - rowWidth / 2;

    // Row 1: 1, 2, 3
    this.createGridButton(startX, startY, btnSize, 1);
    this.createGridButton(startX + btnSize + gap, startY, btnSize, 2);
    this.createGridButton(startX + (btnSize + gap) * 2, startY, btnSize, 3);

    // Row 2: 4, 5, 6
    const row2Y = startY + btnSize + gap;
    this.createGridButton(startX, row2Y, btnSize, 4);
    this.createGridButton(startX + btnSize + gap, row2Y, btnSize, 5);
    this.createGridButton(startX + (btnSize + gap) * 2, row2Y, btnSize, 6);

    // Row 3: 7, 8, 9
    const row3Y = startY + (btnSize + gap) * 2;
    this.createGridButton(startX, row3Y, btnSize, 7);
    this.createGridButton(startX + btnSize + gap, row3Y, btnSize, 8);
    this.createGridButton(startX + (btnSize + gap) * 2, row3Y, btnSize, 9);

    // Row 4: 0 (centered)
    const row4Y = startY + (btnSize + gap) * 3;
    this.createGridButton(startX + btnSize + gap, row4Y, btnSize, 0);

    // Return total height
    return (btnSize * 4) + (gap * 3);
  }

  createGridButton(x, y, size, value) {
    const color = this.getPriorityColor(value);
    const btn = this.container.createWidget(hmUI.widget.BUTTON, {
      x: x,
      y: y,
      w: size,
      h: size,
      radius: 8,
      text: String(value),
      text_size: 32,
      color: color,
      normal_color: this.btnColor,
      press_color: this.btnPressColor,
      click_func: () => this.selectPriority(value)
    });
    this.widgets.push(btn);
  }

  renderOkButton(centerX, y) {
    const btnWidth = 80;
    const btnHeight = 36;
    const okBtn = this.container.createWidget(hmUI.widget.BUTTON, {
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

  selectPriority(value) {
    this.priority = value;
    this.updateDisplay();
  }

  updateDisplay() {
    const color = this.getPriorityColor(this.priority);
    this.valueText.setProperty(hmUI.prop.TEXT, String(this.priority));
    this.valueText.setProperty(hmUI.prop.COLOR, color);
    this.labelText.setProperty(hmUI.prop.TEXT, "(" + this.getPriorityLabel(this.priority) + ")");
    this.labelText.setProperty(hmUI.prop.COLOR, color);
  }

  confirm() {
    this.onConfirm(this.priority);
  }

  cancel() {
    this.onCancel();
  }

  destroy() {
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
