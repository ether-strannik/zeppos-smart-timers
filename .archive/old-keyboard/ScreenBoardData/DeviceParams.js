import { getDeviceInfo } from "@zos/device";
import { deviceName, deviceClass } from "../DeviceIdentifier";

const DeviceInfo = getDeviceInfo();

let profile;
switch(deviceName) {
  case "Mi Band 7":
    profile = {
      rowHeight: 56,
      titleHeight: 60,
      screenHeight: 140,
      fontSize: 18,
      buttonFontSize: 24,
      layouts: ["t9"]
    };
    break;
  case "Band 7":
    profile = {
      rowHeight: 48,
      titleHeight: 32,
      screenHeight: 100,
      fontSize: 18,
      buttonFontSize: 24,
      layouts: ["t9"]
    };
    break;
  case "GTR mini":
    profile = {
      rowHeight: 48,
      titleHeight: 32,
      screenHeight: 100,
      fontSize: 18,
      buttonFontSize: 24,
      circle: true,
      layouts: ["t14"]
    };
    break;
  default:
    profile = {
      rowHeight: 48,
      titleHeight: 48,
      screenHeight: DeviceInfo.height - 48 * 4 - 32 - 64,
      fontSize: 18,
      buttonFontSize: 24,
      circle: deviceClass === "circle",
      layouts: ["qwerty", "t14", "t9"]
    };
    break;
}

export default profile;
