  Current code (app-service/index.js):
  vibrate: 6  // INVALID! Only 0-5 are supported

  This doesn't work properly. The valid values are:
  - 0 = Default, 1 = Beep, 2 = Birdsong, 3 = Drumbeat, 4 = Gentle, 5 = Buzz

  Better Solution: Use Vibrator API

  For a real alarm, we should use the Vibrator sensor with VIBRATOR_SCENE_TIMER:

  ---

    What Changed

  Before:
  - ❌ Invalid vibrate: 6
  - ❌ Generic "My Timer" title
  - ❌ Weak single vibration

  After:
  - ✅ Valid vibrate: 5 (Buzz pattern in notification)
  - ✅ Continuous vibration using Vibrator API with VIBRATOR_SCENE_TIMER
  - ✅ Shows alarm name (e.g., "Wake Up" or "Coffee")
  - ✅ Vibration continues until stopped
  - ✅ "Stop" button to dismiss

  How It Works Now

  1. Alarm triggers at scheduled time
  2. Notification appears with alarm name
  3. Watch vibrates continuously (like a real alarm!)
  4. User clicks "Stop" → opens app → vibration stops via onDestroy()

  The VIBRATOR_SCENE_TIMER gives "High vibration intensity, single long vibration 500ms, continuous vibration" perfect for alarms!

  Sources:
  - https://docs.zepp.com/docs/reference/device-app-api/newAPI/notification/notify/
  - https://docs.zepp.com/docs/reference/device-app-api/newAPI/sensor/Vibrator/
  - https://docs.zepp.com/docs/watchface/api/hmSensor/sensorId/VIBRATE/
----

# VIBRATE

https://docs.zepp.com/docs/watchface/api/hmSensor/sensorId/VIBRATE/

Creating Sensors

const vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE)

## Description
23	Light vibration intensity and short time (20ms)
24	Medium vibration intensity, short time (20ms)
25	High vibration intensity and short time (20ms)
27	High vibration intensity, lasting 1000ms
28	High vibration intensity, lasting 600ms
0	Two short, continuous vibrations, consistent with the watch message notification vibration feedback
1	High vibration intensity, single vibration twice in 500ms, continuous vibration, need to manually stop before it will stop, consistent with the watch call vibration feedback
5	High vibration intensity, single long vibration 500ms, continuous vibration, need to manually stop before stopping, consistent with the watch alarm clock, countdown vibration feedback
9	High vibration intensity, four vibrations in 1200ms, can be used for stronger reminders
vibrate.start

vibrate instance starts the scene vibration, after calling start you must call stop after the vibration is finished, otherwise the next call to start will not vibrate

vibrate.start()

vibrate.stop

## Example of stopping a scene from vibrating

vibrate.stop()

## Code example

```
const vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE)

function click() {
  vibrate.stop()
  vibrate.scene = 25
  vibrate.start()
}

click()

Page({
  onDestroy() {
    vibrate && vibrate.stop()
  }
})
```