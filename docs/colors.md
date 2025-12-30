● Colors in the app are set using hexadecimal format with the prefix 0x. The format is 0xRRGGBB where:
  - RR = Red component (00-FF)
  - GG = Green component (00-FF)
  - BB = Blue component (00-FF)

  Current Color Scheme:

  Primary Colors:

  - #008CDB - Blue (DONE button, main actions)
  - #086CB4 - Darker blue (pressed state)

  Alarm Popup:

  - #F29325 - Orange (SNOOZE button)
  - #D94F04 - Darker orange (pressed)
  - #8C1B2F - Red (STOP button)
  - #590414 - Darker red (pressed)

  UI Elements:

  - #00ABBD - Green (ON states, active alarms)
  - #026E81 - Darker green (pressed)
  - #8C1B2F - Red (OFF states, disabled)
  - #590414 - Darker red (pressed)
  - #A1A2A6 - Dark gray (disabled alarms, inactive elements)    

  Text & Backgrounds:

  - 0xffffff - White (text)
  - 0xaaaaaa - Light gray (secondary text)
  - 0x888888 - Medium gray (section dividers)
  - 0x000000 - Black (backgrounds)

  Section Dividers (recently added):

  - 0x888888 - Lines and text

  Example:

  normal_color: 0x409EFF  // Blue button
  press_color: 0x3388dd   // Darker blue when pressed