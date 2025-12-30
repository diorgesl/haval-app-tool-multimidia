# System Architecture & AI Agent Guide

## Overview
This project (`haval-app-tool-multimidia`) is an Android application designed to interface with vehicle systems (likely GWM Haval) and project a custom dashboard. The dashboard UI is implemented as a **web application** (HTML/CSS/JS) running inside the Android app (likely via WebView).

## Key Components

### 1. Android Host (`app/`)
*   **Package:** `br.com.redesurftank.havalshisuku`
*   **Role:** Acts as the bridge between vehicle hardware/services and the visual dashboard.
*   **Key Managers:**
    *   `ProjectorManager.java`: Manages physical displays and orchestrates the projection of the dashboard.
    *   `ServiceManager.java`: The core data hub. Connects to vehicle services (Binder/Shizuku), fetches data, and notifies listeners.
*   **Integration:**
    *   Loads built HTML assets from `app/src/main/res/raw` (specifically `R.raw.app` which comes from `cluster-widgets/air-control/`).
    *   Pushes data to the JS environment by calling global functions on the `window` object.

### 2. Dashboard Widget (`cluster-widgets/air-control/`)
*   **Tech Stack:** Vanilla JS, Parcel (bundler), Chart.js (graphs).
*   **Structure:** Single Page Application (SPA).
*   **Entry Points:**
    *   `src/main.js`: Main logic, routing, and Android bridge API.
    *   `src/state.js`: Centralized reactive state store.
    *   `app-light.html` / `app-night.html`: Themed entry HTML files.

## Interface: Android <-> JavaScript

The Android app controls the dashboard via a specific global API exposed in `src/main.js`:

| Function | Parameters | Description |
| :--- | :--- | :--- |
| `window.showScreen(screenName)` | `screenName` (string) | Navigates to a specific screen (e.g., `'main_menu'`, `'aircon'`, `'graph'`). |
| `window.control(key, value)` | `key` (string), `value` (any) | Updates a value in the central state store (e.g., `temp`, `carSpeed`, `fan`). |
| `window.focus(item)` | `item` (string) | Highlights a UI element (used for rotary/d-pad navigation). |
| `window.cleanup()` | None | Triggers cleanup logic for the current component. |

## Data Flow & Integration Guide

### 1. Source (Vehicle -> Android)
*   **`ServiceManager.java`**: Connects to the vehicle's `IntelligentVehicleControlService`.
*   **`CarConstants.java`**: Defines the mapping between internal string keys (e.g., `"car.basic.vehicle_speed"`) and the vehicle properties.
*   **Data Fetching**: `ServiceManager` polls or listens for changes. When data changes, it broadcasts an update to listeners.

### 2. Bridge (Android -> WebView)
*   **`InstrumentProjector2.kt`**: The main dashboard projector.
*   **Listener**: Implements a listener for `ServiceManager` updates.
*   **Translation**: Inside `addDataChangedListener`, it maps `CarConstants` keys to JavaScript keys.
    *   *Example:* `CarConstants.CAR_BASIC_VEHICLE_SPEED` -> Calls `evaluateJsIfReady(webView, "control('carSpeed', $value)")`.
*   **Enum Mapping**: Converts numeric constants to readable strings (e.g., Drive Mode `0` -> `'Normal'`, `1` -> `'Sport'`) using helpers in `MainMenu.java`.

### 3. Consumption (JavaScript)
*   **`src/main.js`**: Exposes `window.control(key, value)`.
*   **`src/state.js`**: `control()` calls `setState(key, value)`. Components subscribe to these state changes to update the UI reactively.

---

## How to Add a New Monitored Constant

To display a new piece of vehicle data on the dashboard:

### Step 1: Android - Define & Monitor
1.  **Check `CarConstants.java`**: Ensure the property string (e.g., `"car.basic.battery_voltage"`) is defined. Add it if missing.
2.  **Update `ServiceManager.java`**: Add the new constant to `DEFAULT_KEYS` array to ensure `ServiceManager` subscribes to it at startup.

### Step 2: Android - Bridge to JS
1.  **Edit `InstrumentProjector2.kt`**:
    *   Locate the `addDataChangedListener` callback.
    *   Add a new `CarConstants` case to the `when` block.
    *   Call `evaluateJsIfReady(webView, "control('YOUR_JS_KEY', $value)")`.
    *   *Note:* Perform any necessary data conversion (Float -> Int, Enum -> String) here.
    *   **Initial State**: Also add this logic to `updateValuesWebView()` to ensure the value is sent immediately when the dashboard loads.

### Step 3: JavaScript - Handle State
1.  **Edit `cluster-widgets/air-control/src/state.js`**:
    *   Add `'YOUR_JS_KEY': defaultValue` to the `stateManager` initialization object.
2.  **Edit UI Components**:
    *   Use `getState('YOUR_JS_KEY')` or `subscribe('YOUR_JS_KEY', callback)` in your component files (e.g., `graphs.js` or `mainMenu.js`) to display the data.

## Graphs & Visualizations Pattern

The project uses `Chart.js` with `chartjs-plugin-streaming` to render real-time graphs. The logic is centralized in `cluster-widgets/air-control/src/components/graphs/graphs.js`.

### Architecture
1.  **`graphList` Configuration**: Defines available graphs. Each entry specifies:
    *   `id`: Unique identifier (must match `src/state.js` keys usually).
    *   `displayLabel`: Title shown on screen.
    *   `datasets`: Array of 1 or 2 datasets mapping a `dataKey` (from state) to an axis (`y` or `y1`).
2.  **Data Collection**: `startGlobalDataCollector` runs every 200ms. It reads the current value from the central `stateManager` for every key defined in `graphList` and pushes it to a `historicalData` buffer (keeps last 30s).
3.  **Rendering**: `graphController` manages a single `Chart` instance. When switching graphs (`switchTo`), it updates the chart's datasets to point to the correct buffer in `historicalData` and reconfigures the scales.

### How to Add a New Graph

**1. Prepare Data (Prerequisite)**
Ensure your data is available in `src/state.js` (see "How to Add a New Monitored Constant").

**2. Update Configuration (`graphs.js`)**
Add a new object to the `graphList` array:
```javascript
{
    id: 'myNewGraph',
    displayLabel: 'My Graph Title',
    decimalPlaces: 1,
    datasets: [
        {
            label: 'Primary Data',
            dataKey: 'myStateKey1', // Must match state.js
            unity: 'V', // Unit
            yAxisID: 'y'
        },
        // Optional secondary dataset
        {
            label: 'Secondary Data',
            dataKey: 'myStateKey2',
            unity: 'A',
            yAxisID: 'y1'
        }
    ]
}
```

**3. Configure Scales (`graphs.js`)**
In `graphController.switchTo(graphId)`, add a condition to set the axis limits for your new graph:
```javascript
if (graphId === 'myNewGraph') {
    scales.y.min = 0;
    scales.y.max = 100;
    scales.y.ticks.stepSize = 10;
    // Configure y1 if you have a secondary axis
}
```

**4. Triggering**
The graph will be selectable via the `currentGraph` state. Ensure the Android app or JS logic can set `setState('currentGraph', 'myNewGraph')`.

## Developer Workflow
1.  **Edit Dashboard:** Modify files in `cluster-widgets/air-control/`.
2.  **Build Web:** Run build scripts (likely `npm run build` or similar in `cluster-widgets`) to bundle assets.
3.  **Sync:** The build process copies artifacts to `app/src/main/res/raw/`.
4.  **Build Android:** Compile the Android app to see changes on the device/emulator.

## Local Development (Web)

To preview and develop the dashboard UI in a browser without needing the Android app:

1.  **Navigate to the widget directory:**
    ```bash
    cd cluster-widgets/air-control
    ```
2.  **Install dependencies:**
    ```bash
    npm install  # or bun install
    ```
3.  **Run the development server:**
    *   **Night Mode (Default):** `npm run dev` (Accessible at `http://localhost:1234`)
    *   **Light Mode:** `npm run dev:light`
    *   **With Debug Controls:** `npm run dev-controls` (Includes UI buttons to simulate car data)

**Note:** When running locally, `src/testing-utils.js` is automatically loaded in development mode. It simulates vehicle data (speed, consumption, etc.) so you can see animations and graphs working in real-time.
