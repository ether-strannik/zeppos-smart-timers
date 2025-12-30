import { getDeviceInfo } from "@zos/device";
import hmUI from "@zos/ui";
import * as timer from "@zos/timer";
import { back, launchApp } from "@zos/router";
import { setScrollMode } from "@zos/page";
import { onGesture, GESTURE_UP, GESTURE_DOWN, GESTURE_LEFT, GESTURE_RIGHT } from "@zos/interaction";

const info = getDeviceInfo();
const _events = {}
const _evMapping = {
	"up": GESTURE_UP,
	"left": GESTURE_LEFT,
	"right": GESTURE_RIGHT,
	"down": GESTURE_DOWN,
}

export class AppGesture {
	/**
	 * Register this instance. Must be called in onInit
	 */
	static init() {
		onGesture({
			callback: (event) => {
				const handler = _events[event];
				if (handler) {
					return handler();
				}
				return false;
			}
		});
	}

	/**
	 * Add event listener, ex. AppGesture.on("left", () => {...})
	 */
	static on(event, action) {
		_events[_evMapping[event]] = action;
	}

	static withHighLoadBackWorkaround() {
		AppGesture.on("right", () => {
			setScrollMode({ mode: 0 });
			hmUI.createWidget(hmUI.widget.FILL_RECT, {
				x: 0,
				y: 0,
				w: info.width,
				h: info.height,
				color: 0x0
			});
			timer.createTimer(350, 0, () => back());
			return true;
		})
	}

	/**
	 * Reload page after two swipes in selected direction
	 */
	static withYellowWorkaround(event, startReq) {
		let lastSwipe = 0;
		let count = 0;
		AppGesture.on(event, () => {
			if(Date.now() - lastSwipe > 1000)
				count = 1;

			if(count == 3) {
				console.log("Reloading with params", startReq);
				launchApp(startReq);
				return;
			}

			count++;
			lastSwipe = Date.now();
			return true;
		});
	}
}