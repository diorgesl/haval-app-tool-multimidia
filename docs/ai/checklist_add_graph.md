# Checklist: Adding a New Real-Time Graph

To add a new graph to the dashboard, follow these steps.

## Prerequisites
Ensure the vehicle data is already being monitored and sent to the JS environment (see [checklist_add_constant.md](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/docs/ai/checklist_add_constant.md)).

## Step 1: Define the Graph Configuration
Add a new object to the `graphList` array.
- **File:** [graphs.js](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/cluster-widgets/air-control/src/components/graphs/graphs.js)
- **Template:**
```javascript
{
    id: 'myGraphId',
    displayLabel: 'My Graph Title',
    decimalPlaces: 1, // Number of decimals in tooltip
    datasets: [
        {
            label: 'Data 1',
            dataKey: 'primaryJsStateKey',
            unity: 'Unit',
            yAxisID: 'y' // Left axis
        },
        // Optional second dataset
        {
            label: 'Data 2',
            dataKey: 'secondaryJsStateKey',
            unity: 'Unit',
            yAxisID: 'y1' // Right axis
        }
    ]
}
```

## Step 2: Configure Axis Scales
Inside `graphController.switchTo(graphId)`, define the min/max limits for your new graph.
- **File:** [graphs.js](file:///Users/diorgera/Projetos/haval/haval-app-tool-multimidia/cluster-widgets/air-control/src/components/graphs/graphs.js) around line 600.
```javascript
else if (graphId === 'myGraphId') {
    scales.y.min = 0;
    scales.y.max = 100;
    scales.y.ticks.stepSize = 10;
    // If using y1:
    scales.y1.min = 0;
    scales.y1.max = 50;
    scales.y1.ticks.stepSize = 5;
}
```

## Step 3: Trigger the Graph View
The dashboard switches graphs based on the `currentGraph` state key.
- **Android Trigger:** Call `dispatchServiceManagerEvent(ServiceManagerEventType.GRAPH_SCREEN_NAVIGATION, "myGraphId")` in Java/Kotlin.
- **JS Strategy:** The `InstrumentProjector2.kt` maps this event to `control('currentGraph', 'myGraphId')`.

---

> [!NOTE]
> **Data Collection:** The system automatically collects data for any key defined in `graphList` every 200ms. You don't need to manually push points to the graph.
