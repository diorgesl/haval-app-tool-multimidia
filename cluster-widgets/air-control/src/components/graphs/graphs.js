import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables, streamingPlugin);

export const graphList = [
     {
         id: 'evConsumption',
         displayLabel: 'Consumo EV',
         decimalPlaces: 0,
         datasets: [
             {
                 label: 'Consumo EV',
                 dataKey: 'evConsumption',
                 unity: '% de Energia',
                 yAxisID: 'y'
             },
             { label: null, dataKey: null, yAxisID: 'y1' }
         ]
     },
     {
         id: 'gasConsumption',
         displayLabel: 'Consumo Combustão',
         decimalPlaces: 1,
         datasets: [
             {
                 label: 'Consumo Instantâneo',
                 dataKey: 'gasConsumption',
                 unity: 'km/L',
                 yAxisID: 'y'
             },
             {
                 label: 'Consumo em Idle',
                 dataKey: 'gasConsumptionIdle',
                 unity: 'l/min',
                 yAxisID: 'y1'
             }
         ]
     },
     {
         id: 'carSpeed',
         displayLabel: 'Velocidade',
         decimalPlaces: 0,
         datasets: [
             {
                 label: 'Velocidade',
                 dataKey: 'carSpeed',
                 unity: 'km/h',
                 yAxisID: 'y'
             },
             {
                 label: 'Consumo',
                 dataKey: 'gasConsumption',
                 unity: 'km/L',
                 yAxisID: 'y'
             }
         ]
     },
];

const historicalData = {};

function initializeGlobalDataStore() {
    graphList.forEach(graph => {
        graph.datasets.forEach(dataset => {
            if (dataset.dataKey) {
                historicalData[dataset.dataKey] = [];
            }
        });
    });
}

function startGlobalDataCollector() {
    initializeGlobalDataStore();

    setInterval(() => {
        const now = Date.now();
        const DURATION = 20000;

        for (const dataKey in historicalData) {
            const value = getState(dataKey);
            if (value !== undefined) {
                historicalData[dataKey].push({ x: now, y: value });

                const firstPoint = historicalData[dataKey][0];
                if (firstPoint && now - firstPoint.x > DURATION) {
                    historicalData[dataKey].shift();
                }
            }
        }
    }, 200);
}

startGlobalDataCollector();

const graphController = {
    chartInstance: null,
    isInitialized: false,
    currentGraphId: null,

    init(canvasContext) {
        if (this.isInitialized) return;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: { datasets: [
            {
                label: '',
                backgroundColor: 'rgba(0, 120, 255, 0.15)',
                borderColor: '#00c3ff',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.3,
                shadowColor: 'rgba(0, 195, 255, 0.5)',
                shadowBlur: 10,
            },
            {
                label: '',
                backgroundColor: 'rgba(0, 120, 255, 0.15)',
                borderColor: '#00c3ff',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.3,
                shadowColor: 'rgba(0, 195, 255, 0.5)',
                shadowBlur: 10,
            }]},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    //streaming: {
                    //    duration: 20000,
                    //    refresh: 500,
                    //    frameRate: 30
                    //},
                },
                scales: {
                    x: {
                        type: 'realtime',
                        display: false
                    },
                    y: {
                        min: -20,
                        max: 120,
                        ticks: {
                            display: true,
                            padding: 10,
                            //align: 'start',
                            stepSize: 20,
                            color: 'rgba(100,172,255,0.7)',
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            color: 'rgba(0,160,255,0.3)',
                            zeroLineColor: 'rgba(100, 172, 255, 0.8)',
                            zeroLineWidth: 3
                        },
                    },
                    y1: {
                        id: 'y1',
                        position: 'right',
                        min: 0,
                        max: 200,
                        ticks: {
                            display: true,
                            padding: 10,
                            align: 'start',
                            stepSize: 2,
                            color: 'rgba(255, 160, 100, 0.5)',
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });

        this.uiUpdateInterval = setInterval(() => {
            if (!this.isInitialized || !this.currentGraphId) return;

            const graphInfo = graphList.find(g => g.id === this.currentGraphId);
            if (!graphInfo) return;

            const primaryTooltipEl = document.querySelector('.dynamic-tooltip.primary');
            const secondaryTooltipEl = document.querySelector('.dynamic-tooltip.secondary');
            const primaryLineEl = document.querySelector('.dynamic-tooltip-line.primary');
            const secondaryLineEl = document.querySelector('.dynamic-tooltip-line.secondary');

            const OFFSET = 13.2;
            primaryTooltipEl.style.opacity = 0;
            primaryLineEl.style.opacity = 0;
            secondaryTooltipEl.style.display = 'none';
            secondaryLineEl.style.display = 'none';

            if (graphInfo.id === 'carSpeed') {
                secondaryTooltipEl.style.display = 'flex';
                secondaryLineEl.style.display = 'block';

                const dataset1Info = graphInfo.datasets[0];
                const dataset2Info = graphInfo.datasets[1];

                const value1 = getState(dataset1Info.dataKey);
                const value2 = getState(dataset2Info.dataKey);

                const yAxis = this.chartInstance.scales.y;

                if (value1 !== undefined) {
                    primaryTooltipEl.querySelector('.tooltip-value').textContent = value1.toFixed(dataset1Info.decimalPlaces || 0);
                    primaryTooltipEl.querySelector('.tooltip-unity').textContent = dataset1Info.unity;
                    primaryLineEl.style.top = `${yAxis.getPixelForValue(value1) + OFFSET}px`;
                    primaryLineEl.style.backgroundColor = '#00c3ff';
                    primaryTooltipEl.style.opacity = 1;
                    primaryLineEl.style.opacity = 1;
                }

                if (value2 !== undefined) {
                    secondaryTooltipEl.querySelector('.tooltip-value').textContent = value2.toFixed(dataset2Info.decimalPlaces || 0);
                    secondaryTooltipEl.querySelector('.tooltip-unity').textContent = dataset2Info.unity;
                    secondaryLineEl.style.top = `${yAxis.getPixelForValue(value2) + OFFSET}px`;
                    secondaryLineEl.style.backgroundColor = '#ffA064';
                    secondaryTooltipEl.style.opacity = 1;
                    secondaryLineEl.style.opacity = 1;
                }

            } else {
                let activeValue, activeUnity, activeDatasetIndex;

                if (graphInfo.id === 'gasConsumption') {
                    const runningValue = getState(graphInfo.datasets[0].dataKey);
                    const idleValue = getState(graphInfo.datasets[1].dataKey);
                    if (runningValue > 0) {
                        activeValue = runningValue;
                        activeUnity = graphInfo.datasets[0].unity;
                        activeDatasetIndex = 0;
                    } else {
                        activeValue = idleValue;
                        activeUnity = graphInfo.datasets[1].unity;
                        activeDatasetIndex = 1;
                    }
                } else {
                    const mainDatasetInfo = graphInfo.datasets[0];
                    activeValue = getState(mainDatasetInfo.dataKey);
                    activeUnity = mainDatasetInfo.unity;
                    activeDatasetIndex = 0;
                }

                if (activeValue !== undefined) {
                    const yAxis = activeDatasetIndex === 0 ? this.chartInstance.scales.y : this.chartInstance.scales.y1;
                    primaryTooltipEl.querySelector('.tooltip-value').textContent = activeValue.toFixed(graphInfo.decimalPlaces || 0);
                    primaryTooltipEl.querySelector('.tooltip-unity').textContent = activeUnity;
                    primaryLineEl.style.top = `${yAxis.getPixelForValue(activeValue) + OFFSET}px`;
                    primaryLineEl.style.backgroundColor = activeDatasetIndex === 0 ? '#00c3ff' : '#ffA064';
                    primaryTooltipEl.style.opacity = 1;
                    primaryLineEl.style.opacity = 1;
                }
            }
            this.chartInstance.update('quiet');
        }, 100);


        this.isInitialized = true;
    },

    switchTo(graphId) {
        if (!this.isInitialized) {
            return;
        }

        const graphInfo = graphList.find(g => g.id === graphId);
        if (!graphInfo) return;

        const scales = this.chartInstance.options.scales;
        const hasSecondaryAxis = graphInfo.datasets[1] && graphInfo.datasets[1].dataKey;
        scales.y1.display = hasSecondaryAxis;

        const bulletContainer = document.querySelector('.graph-bullet-container');
        const tooltipLines = document.querySelectorAll('.dynamic-tooltip-line');
        if (bulletContainer && tooltipLines.length > 0) {
            if (hasSecondaryAxis) {
                bulletContainer.classList.add('position-left');
                bulletContainer.classList.remove('position-right');
                tooltipLines.forEach(line => line.style.width = '80%');

            } else {
                bulletContainer.classList.add('position-right');
                bulletContainer.classList.remove('position-left');
                tooltipLines.forEach(line => line.style.width = '95%');
            }
        }


        if (graphId === 'gasConsumption') {
            scales.y.min = -15;
            scales.y.max = 45;
            scales.y.ticks.stepSize = 10;
            scales.y.ticks.color = 'rgba(0, 195, 255, 0.7)';
            scales.y1.min = -5;
            scales.y1.max = 15;
            scales.y1.ticks.stepSize = 3;
            scales.y1.ticks.color = 'rgba(255, 160, 100, 0.7)';
        } else if (graphId === 'carSpeed') {
            scales.y.min = -50;
            scales.y.max = 200;
            scales.y.ticks.stepSize = 40;
            scales.y1.min = -15;
            scales.y1.max = 45;
            scales.y1.ticks.stepSize = 10;
            scales.y1.ticks.color = 'rgba(255, 160, 100, 0.7)';
        } else if (graphId === 'evConsumption') {
            scales.y.min = -125;
            scales.y.max = 115;
            scales.y.ticks.stepSize = 25;
        }

        const newDatasets = [];
        const datasetColors = ['#00c3ff', '#ffA064'];

        graphInfo.datasets.forEach((datasetInfo, index) => {
            if (datasetInfo.dataKey) {
                newDatasets.push({
                    label: datasetInfo.label,
                    data: historicalData[datasetInfo.dataKey] || [],
                    yAxisID: datasetInfo.yAxisID,
                    borderColor: datasetColors[index],
                    backgroundColor: index === 0 ? 'rgba(0, 120, 255, 0.15)' : 'rgba(255, 160, 100, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3,
                });
            }
        });

        this.chartInstance.data.datasets = newDatasets;

        const tooltipEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip');
        if (tooltipEl) tooltipEl.style.opacity = 0;

        this.currentGraphId = graphId;
        this.chartInstance.update({ duration: 400 });
    },

    cleanup() {
        if (this.uiUpdateInterval) {
            clearInterval(this.uiUpdateInterval);
            this.uiUpdateInterval = null;
        }
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.isInitialized = false;
        this.currentGraphId = null;
    }

};

export function createGraphScreen() {

    var main = div({className: 'main-container'});

    const container = div({className: 'graph-screen'});

    const graphProgressRing = div({className: 'graph-progress-ring'});
    graphProgressRing.id = 'graph-progress-ring';
    container.appendChild(graphProgressRing);

    const divider = div({className: 'graph-selector-line'});
    const outerRing = div({className: 'graph-outer-ring'});
    const innerRingShadow = div({className: 'graph-inner-ring-shadow'});
    const innerRing = div({className: 'graph-inner-ring'});

    const dynamicTooltip = div({ className: 'dynamic-tooltip primary' });
    const tooltipValue = span({ className: 'tooltip-value' });
    const tooltipUnity = span({ className: 'tooltip-unity' });
    dynamicTooltip.appendChild(tooltipValue);
    dynamicTooltip.appendChild(tooltipUnity);

    const secondaryTooltip = div({ className: 'dynamic-tooltip secondary' });
    const secondaryTooltipValue = span({ className: 'tooltip-value' });
    const secondaryTooltipUnity = span({ className: 'tooltip-unity' });
    secondaryTooltip.appendChild(secondaryTooltipValue);
    secondaryTooltip.appendChild(secondaryTooltipUnity);

    const dynamicTooltipLine = div({ className: 'dynamic-tooltip-line primary' });
    const secondaryTooltipLine = div({ className: 'dynamic-tooltip-line secondary' });

    innerRing.appendChild(dynamicTooltip);
    innerRing.appendChild(secondaryTooltip);
    innerRing.appendChild(dynamicTooltipLine);
    innerRing.appendChild(secondaryTooltipLine);

    const canvas = document.createElement('canvas');
    canvas.className = 'graph-chart';
    canvas.id = 'graph-chart';
    innerRing.appendChild(canvas);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    const bulletContainer = div({ className: 'graph-bullet-container' });
    const bulletElements = {};

    graphList.forEach((itemData) => {
        const bulletEl = div({
            id: `bullet-${itemData.id}`,
            className: 'graph-bullet',
            'data-id': itemData.id
        });
        bulletContainer.appendChild(bulletEl);
        bulletElements[itemData.id] = bulletEl;
    });

    container.appendChild(bulletContainer);

    const graphTitleLabel = div({ className: 'graph-title-label' });
    container.appendChild(graphTitleLabel);

    setTimeout(() => {
        const ctx = document.getElementById('graph-chart');
        if (ctx) {
            graphController.init(ctx);
            graphController.switchTo(getState('currentGraph'));
        }

        subscribe('currentGraph', (newGraphId) => {
            graphController.switchTo(newGraphId);
            updateFocus(newGraphId);
        });

        updateFocus(getState('currentGraph'));

    }, 0);

   main.cleanup = () => {
        graphController.cleanup();
    };

    const updateFocus = (currentGraphId) => {
        Object.values(bulletElements).forEach(bullet => {
            if (bullet.dataset.id === currentGraphId) {
                bullet.classList.add('active');
            } else {
                bullet.classList.remove('active');
            }
        });

        const currentItem = graphList.find(item => item.id === currentGraphId);
        if (currentItem) {
            var currentLabel = currentItem.displayLabel;
        }
        graphTitleLabel.textContent = currentLabel;
    };

    return main;
}
