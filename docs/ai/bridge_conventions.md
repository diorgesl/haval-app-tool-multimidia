# Reference: Android-JS Bridge Conventions

This document defines the communication protocol between the Android Host and the Web Dashboard.

## Android -> JavaScript (`InstrumentProjector2.kt`)

The Android app interacts with the WebView using `evaluateJavascript`.

| JS Function | Parameters | Purpose |
| :--- | :--- | :--- |
| `control(key, value)` | `key: string`, `value: any` | Updates a state value. Triggers UI reactivity. |
| `showScreen(name)` | `name: string` | Navigates to a specific screen (e.g., `'aircon'`, `'graph'`). |
| `focus(itemId)` | `itemId: string` | Highlights an item for rotary/steering wheel navigation. |
| `cleanup()` | none | Called before destroying/changing components. |

### Data Type Conventions
- **Booleans:** Passed as `true`/`false`.
- **Numbers:** Passed as `Int` or `Float`. Values are often rounded in Android before sending (e.g., `value.roundToInt()`).
- **Enums:** Converted to **String Labels** in Android (e.g., `0` -> `"Normal"`) using helpers in `MainMenu.java` or `RegenScreen.java`.

## State Keys (`state.js`)

State keys are the "source of truth" for the UI. Common keys include:

- `carSpeed`: Vehicle speed in km/h.
- `temp`: HVAC set temperature.
- `fan`: HVAC fan speed.
- `currentGraph`: ID of the graph currently being displayed.
- `outside_temp`: Ambient temperature.

---

## JavaScript -> Android
Currently, the communication is primarily one-way (Android pushing to JS). If JS-to-Android communication is added, it should use a `JavascriptInterface` named `AndroidBridge`.

> [!WARNING]
> Always use `evaluateJsIfReady()` in `InstrumentProjector2.kt` to ensure commands are queued if the WebView hasn't finished loading.
