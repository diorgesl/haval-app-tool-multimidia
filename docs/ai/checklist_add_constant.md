# Checklist: Adding a New Monitored Vehicle Constant

Follow these steps to add a new piece of vehicle data to the dashboard.

## Phase 1: Android (Data Source & Bridge)

### 1. Check/Add Constant in `CarConstants.java`
Ensure the property string is defined in the `CarConstants` enum.
- **File:** [CarConstants.java](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/app/src/main/java/br/com/redesurftank/havalshisuku/models/CarConstants.java)
- **Action:** Add it if missing (e.g., `MY_NEW_CONSTANT("car.category.key")`).

### 2. Subscribe in `ServiceManager.java`
Add the constant to the `DEFAULT_KEYS` array to ensure the app receives updates from the vehicle.
- **File:** [ServiceManager.java](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/app/src/main/java/br/com/redesurftank/havalshisuku/managers/ServiceManager.java)
- **Action:** Add `CarConstants.MY_NEW_CONSTANT` to the `DEFAULT_KEYS` static array.

### 3. Implement Bridge in `InstrumentProjector2.kt`
You must handle both real-time updates and the initial state when the WebView loads.
- **File:** [InstrumentProjector2.kt](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/app/src/main/java/br/com/redesurftank/havalshisuku/projectors/InstrumentProjector2.kt)

#### A. Real-time updates:
Add a case to the `when (key)` block inside `addDataChangedListener`:
```kotlin
CarConstants.MY_NEW_CONSTANT.value -> {
    evaluateJsIfReady(webView, "control('jsKeyName', $value)")
}
```

#### B. Initial state:
Add the logic to `updateValuesWebView()` to sync the value immediately on load:
```kotlin
val myValue = ServiceManager.getInstance().getData(CarConstants.MY_NEW_CONSTANT.value)
evaluateJsIfReady(webView, "control('jsKeyName', $myValue)")
```

## Phase 2: JavaScript (Data Consumption)

### 4. Register State in `state.js`
Add the new key to the central state management.
- **File:** [state.js](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/cluster-widgets/air-control/src/state.js)
- **Action:** Add `'jsKeyName': defaultValue` (e.g., `0` or `null`) to the `stateManager` initialization object.

### 5. Update UI Components
Use the data in your JS files.
- **File:** (e.g., `mainMenu.js`, `graphs.js`)
- **Action:** Use `getState('jsKeyName')` to read or `subscribe('jsKeyName', (val) => { ... })` for reactive updates.

---

> [!TIP]
> **Data Conversion:** Perform heavy conversions (like Enum to String labels) in Android using helpers like `MainMenu.DrivingModeOptions.getLabel(value)` before calling `control()`. Keep the JS side simple.
