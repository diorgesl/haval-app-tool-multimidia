import { getState, setState, subscribe } from '../../state.js';
import { div, img, span } from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
import { WarpTunnelAnimation } from './warpTunnel.js';
Chart.register(...registerables, streamingPlugin);

const HISTORY_DURATION = 30000; //ms
const TIMER_HIDE_DELAY = 30000; //ms
const UI_UPDATE_INTERVAL = 100; //ms
const ACCELERATION_THRESHOLD = 10; //s (ie 100km/h in 5s = 5, 100km/h in 10s = 10)

export const graphList = [
    {
        id: 'evConsumption',
        displayLabel: 'Consumo EV',
        decimalPlaces: 1,
        secondaryDecimalPlaces: 1,
        primaryColor: '#ffffff',
        secondaryColor: '#00c3ff',
        datasets: [
            {
                label: 'Potência EV',
                dataKey: 'evPowerKw',
                unity: 'kWatts',
                yAxisID: 'y'
            },
            {
                label: 'Média',
                dataKey: 'evPowerKwAvg',
                unity: 'kWavg',
                yAxisID: 'y'
            }
        ]
    },
    {
        id: 'gasConsumption',
        displayLabel: 'Consumo Misto',
        decimalPlaces: 1,
        secondaryDecimalPlaces: 1,
        primaryColor: '#00c3ff',
        secondaryColor: '#ff5500',
        datasets: [
            {
                label: 'Consumo Elétrico',
                dataKey: 'evPowerKw',
                unity: 'kWatts',
                yAxisID: 'y'
            },
            {
                label: 'Consumo Instantâneo',
                dataKey: 'gasConsumptionSmoothed',
                unity: 'Km/L',
                yAxisID: 'y1',
                idleKey: 'gasConsumptionIdle',
                idleUnity: 'l/100km',
            }
        ]
    },
    {
        id: 'carSpeed',
        displayLabel: 'Velocidade',
        decimalPlaces: 0,
        secondaryDecimalPlaces: 1,
        primaryColor: '#00c3ff',
        secondaryColor: '#ff5500',
        datasets: [
            {
                label: 'Velocidade',
                dataKey: 'carSpeed',
                unity: 'km/h',
                yAxisID: 'y'
            },
            {
                label: 'Consumo',
                dataKey: 'gasConsumptionSmoothed',
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

    const addDataPoint = (dataKey, value) => {
        if (value === undefined || value === null) return;
        const now = Date.now();
        if (!historicalData[dataKey]) historicalData[dataKey] = [];

        historicalData[dataKey].push({ x: now, y: value });

        const DURATION = HISTORY_DURATION;
        while (historicalData[dataKey].length > 0 && now - historicalData[dataKey][0].x > DURATION) {
            historicalData[dataKey].shift();
        }
    };

    // Track all data keys mentioned in graphList
    const dataKeys = new Set();
    graphList.forEach(graph => {
        graph.datasets.forEach(dataset => {
            if (dataset.dataKey) dataKeys.add(dataset.dataKey);
            if (dataset.idleKey) dataKeys.add(dataset.idleKey);
        });
    });

    // Add other relevant keys
    dataKeys.add('evPowerFactor');
    dataKeys.add('engineRPM');

    dataKeys.forEach(dataKey => {
        if (dataKey === 'evPowerKwAvg' || dataKey === 'gasConsumptionSmoothed') return;

        subscribe(dataKey, (value) => {
            addDataPoint(dataKey, value);

            // Special handling for derived types
            if (dataKey === 'evPowerKw') {
                const evData = historicalData['evPowerKw'];
                if (evData && evData.length > 0) {
                    const sum = evData.reduce((acc, point) => acc + point.y, 0);
                    const avg = sum / evData.length;
                    setState('evPowerKwAvg', avg);
                }
            }
        });
    });

    // Subscribe to derived keys to update their history
    subscribe('evPowerKwAvg', (value) => {
        addDataPoint('evPowerKwAvg', value);
    });

    subscribe('gasConsumptionSmoothed', (value) => {
        addDataPoint('gasConsumptionSmoothed', value);
    });

    // Pulse timer for smoothing logic that depends on time/samples
    let gasConsumptionSamples = 0;
    setInterval(() => {
        const rawGas = getState('gasConsumption');
        if (rawGas > 0) {
            gasConsumptionSamples = Math.min(gasConsumptionSamples + 1, 10);
        } else {
            gasConsumptionSamples = 0;
        }

        const multiplier = gasConsumptionSamples / 10;
        const smoothedGas = rawGas * multiplier;

        // This will only trigger the 'gasConsumptionSmoothed' subscription if the value actually changes
        setState('gasConsumptionSmoothed', smoothedGas);
    }, 200);
}

startGlobalDataCollector();

const graphController = {

    colors: {
        primary: '#00c3ff',
        secondary: '#9affb5'
    },

    // Resolved colors for the current graph (updated by switchTo)
    currentPrimary: '#00c3ff',
    currentSecondary: '#9affb5',

    chartInstance: null,
    isInitialized: false,
    currentGraphId: null,
    lastCarSpeed: getState('carSpeed') || 0.0,
    warpTunnel: null,
    warpTunnelCanvas: null,
    isSpeedTimerRunning: false,
    speedTimerStartTime: 0,
    timerHideTimeoutId: null,
    last0To100Time: null,
    flashTriggered: false,

    triggerFlash(color = 'white') {
        const flashOverlay = document.querySelector('.graph-flash-overlay');
        if (!flashOverlay || this.flashTriggered) return;

        this.flashTriggered = true;
        flashOverlay.style.background = `radial-gradient(circle, white 0%, ${color} 100%)`;
        flashOverlay.classList.add('screen-flash-animation');

        const onAnimationEnd = () => {
            flashOverlay.classList.remove('screen-flash-animation');
            flashOverlay.style.background = '';
            flashOverlay.removeEventListener('animationend', onAnimationEnd);
        };
        flashOverlay.addEventListener('animationend', onAnimationEnd);
    },

    setWarpAnimation(visible) {
        if (!this.warpTunnel || !this.warpTunnelCanvas) return;

        const graphContainer = document.querySelector('.graph-screen');
        if (visible) {
            if (!this.warpTunnelCanvas.classList.contains('visible')) {
                if (graphContainer) graphContainer.classList.add('warp-active');
                this.warpTunnelCanvas.classList.add('visible');
                this.warpTunnel.start();
            }
        } else {
            if (this.warpTunnelCanvas.classList.contains('visible')) {
                this.warpTunnelCanvas.classList.remove('visible');
                setTimeout(() => {
                    if (!this.warpTunnelCanvas.classList.contains('visible')) {
                        if (graphContainer) graphContainer.classList.remove('warp-active');
                        this.warpTunnel.stop();
                    }
                }, 2000);
            }
        }
    },

    setChronometer(action) {
        const tooltip = document.getElementById('timer-tooltip');
        const valueEl = document.getElementById('timer-tooltip-value');

        switch (action) {
            case 'start':
                this.isSpeedTimerRunning = true;
                this.speedTimerStartTime = Date.now();
                this.last0To100Time = null;
                this.flashTriggered = false;
                if (this.timerHideTimeoutId) {
                    clearTimeout(this.timerHideTimeoutId);
                    this.timerHideTimeoutId = null;
                }
                if (tooltip) tooltip.classList.add('visible');
                if (valueEl) valueEl.textContent = '0.0s';
                break;

            case 'stop': // Immediate hide/reset
                this.isSpeedTimerRunning = false;
                this.flashTriggered = false;
                if (tooltip) tooltip.classList.remove('visible');
                break;

            case 'success_hold': // Start 10s timeout to hide
                this.isSpeedTimerRunning = false;
                if (!this.timerHideTimeoutId) {
                    this.timerHideTimeoutId = setTimeout(() => {
                        this.setChronometer('stop');
                        this.timerHideTimeoutId = null;
                    }, TIMER_HIDE_DELAY);
                }
                break;
        }
    },

    init(canvasContext) {
        if (this.isInitialized) return;

        this.warpTunnelCanvas = document.getElementById('warp-tunnel-canvas');
        if (this.warpTunnelCanvas) {
            this.warpTunnel = new WarpTunnelAnimation(this.warpTunnelCanvas);
        }

        this.lastCarSpeed = getState('carSpeed') || 0.0;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: {
                datasets: [
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
                        segment: {
                            borderColor: ctx => ctx.p0.parsed.y < 0 ? '#00ff88' : '#00c3ff',
                            backgroundColor: ctx => ctx.p0.parsed.y < 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 120, 255, 0.15)'
                        }
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
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                },
                scales: {
                    x: {
                        type: 'realtime',
                        display: false,
                        realtime: {
                            duration: HISTORY_DURATION,
                            refresh: 250
                        }
                    },
                    y: {
                        min: -20,
                        max: 120,
                        ticks: {
                            display: true,
                            padding: 10,
                            stepSize: 20,
                            color: 'rgba(100,172,255,0.7)',
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            color: (ctx) => (ctx.tick.value === 0 ? 'rgba(0, 195, 255, 1)' : 'rgba(0,160,255,0.3)'),
                            lineWidth: (ctx) => (ctx.tick.value === 0 ? 4 : 1),
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
                            color: 'rgba(0, 255, 187, 0.5)',
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });

        this.uiUpdateInterval = setInterval(() => {
            try {
                if (!this.isInitialized || !this.currentGraphId) return;

                const graphInfo = graphList.find(g => g.id === this.currentGraphId);
                if (!graphInfo) return;

                const primaryTooltipEl = document.querySelector('.dynamic-tooltip.primary');
                const secondaryTooltipEl = document.querySelector('.dynamic-tooltip.secondary');
                const primaryLineEl = document.querySelector('.dynamic-tooltip-line.primary');
                const secondaryLineEl = document.querySelector('.dynamic-tooltip-line.secondary');
                const speedTimerTooltip = document.getElementById('timer-tooltip');
                const speedTimerValue = document.getElementById('timer-tooltip-value');
                const LINE_OFFSET = 13;

                if (primaryTooltipEl) primaryTooltipEl.style.opacity = 0;
                if (primaryLineEl) primaryLineEl.style.opacity = 0;
                if (secondaryTooltipEl) secondaryTooltipEl.style.display = 'none';
                if (secondaryLineEl) secondaryLineEl.style.display = 'none';

                if (graphInfo.id === 'carSpeed') {
                    if (secondaryTooltipEl) secondaryTooltipEl.style.display = 'flex';
                    if (secondaryLineEl) secondaryLineEl.style.display = 'block';

                    const dataset1Info = graphInfo.datasets[0];
                    const dataset2Info = graphInfo.datasets[1];

                    const value1 = getState(dataset1Info.dataKey);
                    const value2 = getState(dataset2Info.dataKey);

                    const yAxis = this.chartInstance.scales.y;
                    const y1Axis = this.chartInstance.scales.y1;

                    if (value1 !== undefined && primaryTooltipEl && primaryLineEl) {
                        primaryTooltipEl.querySelector('.tooltip-value').textContent = value1.toFixed(dataset1Info.decimalPlaces || 1);
                        primaryTooltipEl.querySelector('.tooltip-unity').textContent = dataset1Info.unity;
                        primaryLineEl.style.top = `${yAxis.getPixelForValue(value1) + LINE_OFFSET}px`;
                        primaryLineEl.style.backgroundColor = this.currentPrimary;
                        primaryTooltipEl.style.opacity = 1;
                        primaryLineEl.style.opacity = 0.5;
                    }

                    if (value2 !== undefined && secondaryTooltipEl && secondaryLineEl) {
                        secondaryTooltipEl.querySelector('.tooltip-value').textContent = value2.toFixed(dataset2Info.decimalPlaces || 1);
                        secondaryTooltipEl.querySelector('.tooltip-unity').textContent = dataset2Info.unity;
                        secondaryTooltipEl.querySelector('.tooltip-value').style.color = this.currentSecondary;
                        secondaryTooltipEl.querySelector('.tooltip-unity').style.color = this.currentSecondary;
                        secondaryLineEl.style.top = `${yAxis.getPixelForValue(value2) + LINE_OFFSET}px`;
                        secondaryLineEl.style.backgroundColor = this.currentSecondary;
                        secondaryTooltipEl.style.opacity = 1;
                        secondaryLineEl.style.opacity = 0.5;
                    }

                    const currentSpeed = getState('carSpeed') || 0.0;
                    const drivingMode = getState('drivingMode');
                    const acceleration = parseFloat(currentSpeed - this.lastCarSpeed) * (1000 / UI_UPDATE_INTERVAL);
                    const isFastAcceleration = acceleration >= (100 / ACCELERATION_THRESHOLD);

                    // Chronometer Running Logic
                    if (this.isSpeedTimerRunning) {
                        const elapsedTime = (Date.now() - this.speedTimerStartTime) / 1000;


                        // 1. Abort Conditions
                        if (elapsedTime > 15) {
                            this.triggerFlash('red');
                            this.setWarpAnimation(false);
                            this.setChronometer('stop');
                        }

                        // 2. Success Condition
                        else if (currentSpeed >= 100) {

                            if (!this.last0To100Time) {
                                this.last0To100Time = elapsedTime.toFixed(1);
                            }
                            if (speedTimerValue) speedTimerValue.textContent = `${this.last0To100Time}s`;

                            // Trigger Flash and hold results for few secs
                            this.triggerFlash('white');
                            this.setChronometer('success_hold');
                        }

                        // 3. Reset if car has stopped
                        else if (currentSpeed === 0) {
                            this.setWarpAnimation(false);
                            this.setChronometer('stop');
                        }

                        // 4. Update Condition
                        else {
                            // Update Timer (ensure its visible)
                            if (speedTimerValue) speedTimerValue.textContent = `${elapsedTime.toFixed(1)}s`;
                            if (speedTimerTooltip && !speedTimerTooltip.classList.contains('visible')) {
                                speedTimerTooltip.classList.add('visible');
                            }

                            // Ensure warp is running if we are still accelerating
                            if (acceleration > 0) {
                                this.setWarpAnimation(true);
                                if (this.warpTunnel) this.warpTunnel.setSpeed(currentSpeed);
                            }
                        }
                    }

                    // Chronometer & Warp Tunnel Start Condition
                    const shouldWarp = this.lastCarSpeed === 0 && currentSpeed > 0 && isFastAcceleration && drivingMode === 'Sport';
                    if (shouldWarp) {
                        this.triggerFlash('orange');
                        this.setChronometer('start');
                        this.setWarpAnimation(true);
                        if (this.warpTunnel) this.warpTunnel.setSpeed(currentSpeed);
                    } else if ((currentSpeed >= 100) && (currentSpeed < this.lastCarSpeed)) {
                        this.setWarpAnimation(false);
                    }

                    this.lastCarSpeed = currentSpeed;

                } else {  // Other graphs
                    let activeValue, activeUnity, activeDatasetIndex;
                    let secValue, secUnity;

                    // makes sure warp tunnel and speed timer are hidden
                    this.setWarpAnimation(false);
                    this.setChronometer('stop');

                    if (graphInfo.id === 'gasConsumption') {
                        const evVal = getState('evPowerFactor');
                        activeValue = evVal;
                        activeUnity = graphInfo.datasets[0].unity;
                        activeDatasetIndex = 0;

                        const runningValue = getState('gasConsumptionSmoothed');
                        const idleValue = getState(graphInfo.datasets[1].idleKey);
                        if (runningValue > 0) {
                            secValue = runningValue;
                            secUnity = graphInfo.datasets[1].unity;
                            //secDatasetIndex = 1;
                        } else {
                            secValue = idleValue;
                            secUnity = graphInfo.datasets[1].idleUnity;
                            //secDatasetIndex = 1;
                        }

                    } else if (graphInfo.id === 'evConsumption') {
                        const mainDatasetInfo = graphInfo.datasets[0];
                        activeValue = getState(mainDatasetInfo.dataKey);
                        activeUnity = mainDatasetInfo.unity;
                        activeDatasetIndex = 0;

                        // Second dataset for evConsumption graph is evPowerKwAvg (rolling avg kW)
                        secValue = getState('evPowerKwAvg');
                        secUnity = graphInfo.datasets[1].unity;
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
                        primaryLineEl.style.top = `${yAxis.getPixelForValue(activeValue) + LINE_OFFSET}px`;
                        primaryLineEl.style.backgroundColor = activeDatasetIndex === 0 ? this.currentPrimary : this.currentSecondary;
                        primaryTooltipEl.style.opacity = 1;
                        primaryLineEl.style.opacity = 0.5;
                    }

                    if (secValue !== undefined && secondaryTooltipEl && secondaryLineEl) {
                        const secDatasetInfo = graphInfo.datasets[1];
                        const secAxis = (secDatasetInfo && secDatasetInfo.yAxisID === 'y1') ? this.chartInstance.scales.y1 : this.chartInstance.scales.y;

                        secondaryTooltipEl.querySelector('.tooltip-value').textContent = secValue.toFixed(graphInfo.secondaryDecimalPlaces !== undefined ? graphInfo.secondaryDecimalPlaces : (graphInfo.decimalPlaces || 0));
                        secondaryTooltipEl.querySelector('.tooltip-unity').textContent = secUnity;
                        secondaryTooltipEl.querySelector('.tooltip-value').style.color = this.currentSecondary;
                        secondaryTooltipEl.querySelector('.tooltip-unity').style.color = this.currentSecondary;
                        secondaryLineEl.style.top = `${secAxis.getPixelForValue(secValue) + LINE_OFFSET}px`;
                        secondaryLineEl.style.backgroundColor = this.currentSecondary;
                        secondaryTooltipEl.style.opacity = 1;
                        secondaryLineEl.style.opacity = 0.5;
                        secondaryTooltipEl.style.display = 'flex';
                        secondaryLineEl.style.display = 'block';
                    }
                }
                this.chartInstance.update('quiet');

                // Update Power/RPM Ring
                const powerV = getState('evPowerFactor');
                const rpmV = getState('engineRPM');

                const powerBar = document.getElementById('graph-power-bar-svg');
                const rpmBar = document.getElementById('graph-rpm-bar-svg');
                const rpmLabelHtml = document.getElementById('graph-rpm-label-html');
                const powerLabelHtml = document.getElementById('graph-power-label-html');
                const labelWrapper = document.querySelector('.graph-vertical-labels-wrapper');

                if (powerBar && rpmBar) {
                    const isRegen = powerV < 0;

                    if (isRegen) {
                        powerBar.classList.add('regen-active');
                    } else {
                        powerBar.classList.remove('regen-active');
                    }

                    const wrapAngle = (a) => ((a % 360) + 360) % 360;

                    // Scaling: Power 100 = 180 deg if positive and 90 deg if negative, RPM 7000 = 90 deg
                    const powerAngleWidth = powerV >= 0
                        ? (powerV / 100) * 180
                        : (powerV / 100) * 90;
                    const rpmAngleWidth = (rpmV / 7000) * 90;

                    const pStart = 270; // LEFT side
                    const tipAngle = wrapAngle(pStart + powerAngleWidth);

                    // Behavior: If power is negative, RPM starts at 270 (Left)
                    const GAP = 2; // Degrees gap
                    const rStart = (powerV >= 0 ? tipAngle : 270) + GAP;
                    const rEnd = wrapAngle(rStart + rpmAngleWidth);

                    const radius = 218; // Original radius
                    const cx = 250, cy = 250;
                    const getCoords = (deg) => {
                        const rad = (deg - 90) * Math.PI / 180;
                        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
                    };



                    // Draw Power Bar
                    const pS = getCoords(pStart);
                    const pE = getCoords(tipAngle);
                    const pLarge = Math.abs(powerAngleWidth) > 180 ? 1 : 0;
                    const pSweep = powerV >= 0 ? 1 : 0;

                    if (Math.abs(powerAngleWidth) > 0.1) {
                        powerBar.setAttribute("d", `M ${pS.x} ${pS.y} A ${radius} ${radius} 0 ${pLarge} ${pSweep} ${pE.x} ${pE.y}`);
                        powerBar.style.opacity = 1;
                        powerBar.setAttribute("stroke-width", "6");

                        // Sectioned bars logic: 10 segments for 100%. 
                        // Power sweep is 180 deg (68.4px per 10%), Regen sweep is 90 deg (34.2px per 10%).
                        const dash = isRegen ? 30.2 : 64.4;
                        powerBar.setAttribute("stroke-dasharray", `${dash} 4.0`);
                    } else {
                        powerBar.style.opacity = 0;
                    }

                    // Draw RPM Bar
                    const rS = getCoords(rStart);
                    const rE = getCoords(rEnd);
                    const rLarge = Math.abs(rpmAngleWidth) > 180 ? 1 : 0;

                    if (rpmV > 1) {
                        rpmBar.setAttribute("d", `M ${rS.x} ${rS.y} A ${radius} ${radius} 0 ${rLarge} 1 ${rE.x} ${rE.y}`);
                        rpmBar.style.opacity = 1;
                        rpmBar.setAttribute("stroke-width", "6");

                        // Sectioned bars logic (7 segments for 7k RPM)
                        rpmBar.setAttribute("stroke-dasharray", "44.9 4.01");
                    } else {
                        rpmBar.style.opacity = 0;
                    }

                    // Update HTML Labels
                    if (rpmLabelHtml) {
                        const rpm = (rpmV / 1000).toFixed(1);
                        rpmLabelHtml.innerHTML = `<span class="val">${rpm}</span><span class="unit">RPM</span>`;
                        rpmLabelHtml.style.opacity = rpm > 0 ? 1 : 0;
                    }
                    if (powerLabelHtml) {
                        const pwr = Math.abs(Math.round(powerV));
                        powerLabelHtml.innerHTML = `<span class="val">${pwr}</span><span class="symbol">%</span>`;
                        powerLabelHtml.style.opacity = pwr > 0 ? 1 : 0;
                        if (isRegen) powerLabelHtml.classList.add('regen');
                        else powerLabelHtml.classList.remove('regen');
                    }
                    if (labelWrapper) {
                        if (rpmV > 1) labelWrapper.classList.add('has-rpm');
                        else labelWrapper.classList.remove('has-rpm');
                    }
                }
            } catch (error) {
                console.error('Error: ', error);
            }
        }, UI_UPDATE_INTERVAL);


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
            scales.y.min = -50;
            scales.y.max = 140;
            scales.y.ticks.stepSize = 25;
            scales.y.ticks.color = this.colors.secondary + 'B3';
            scales.y1.min = -15;
            scales.y1.max = 45;
            scales.y1.ticks.stepSize = 10;
            scales.y1.ticks.color = this.colors.primary + 'B3';
        } else if (graphId === 'carSpeed') {
            scales.y.min = -72;
            scales.y.max = 200;
            scales.y.ticks.stepSize = 40;
            scales.y1.min = -22;
            scales.y1.max = 45;
            scales.y1.ticks.stepSize = 10;
            scales.y1.ticks.color = this.colors.secondary + 'B3';
        } else if (graphId === 'evConsumption') {
            scales.y.min = -100;
            scales.y.max = 140;
            scales.y.ticks.stepSize = 50;
            scales.y1.min = -100;
            scales.y1.max = 140;
            scales.y1.ticks.stepSize = 50;
        }

        // Resolve colors: per-graph overrides take priority over global defaults
        const primary = graphInfo.primaryColor || this.colors.primary;
        const secondary = graphInfo.secondaryColor || this.colors.secondary;
        this.currentPrimary = primary;
        this.currentSecondary = secondary;

        const newDatasets = [];
        const datasetColors = [primary, secondary];

        // Update axis tick colors to match the resolved palette
        scales.y.ticks.color = primary + 'B3';

        graphInfo.datasets.forEach((datasetInfo, index) => {
            if (datasetInfo.dataKey) {
                const color = datasetColors[index];
                const ds = {
                    label: datasetInfo.label,
                    data: historicalData[datasetInfo.dataKey] || [],
                    yAxisID: datasetInfo.yAxisID,
                    borderColor: color,
                    backgroundColor: color + (index === 0 ? '26' : '1A'),
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3,
                };
                if (graphId === 'evConsumption' && index === 0) {
                    ds.segment = {
                        borderColor: ctx => ctx.p0.parsed.y < 0 ? '#00ff88' : color,
                        backgroundColor: ctx => ctx.p0.parsed.y < 0 ? 'rgba(0, 255, 136, 0.15)' : color + '26'
                    };
                }
                newDatasets.push(ds);
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
        if (this.warpTunnel) {
            this.warpTunnel.stop();
        }
        if (this.timerHideTimeoutId) {
            clearTimeout(this.timerHideTimeoutId);
            this.timerHideTimeoutId = null;
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

    var main = div({ className: 'main-container' });

    const container = div({ className: 'graph-screen' });

    const graphProgressRing = div({ className: 'graph-progress-ring' });
    graphProgressRing.id = 'graph-progress-ring';
    container.appendChild(graphProgressRing);

    const graphPowerRpmRing = div({ className: 'graph-power-rpm-ring' });
    graphPowerRpmRing.id = 'graph-power-rpm-ring';
    container.appendChild(graphPowerRpmRing);

    // SVG for curved labels
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 500 500");
    svg.classList.add("graph-curved-labels");
    svg.style.position = "absolute";
    svg.style.width = "500px";
    svg.style.height = "500px";
    svg.style.top = "50%";
    svg.style.left = "50%";
    svg.style.transform = "translate(-50%, -50%)";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "10";

    const powerBar = document.createElementNS(svgNS, "path");
    powerBar.setAttribute("id", "graph-power-bar-svg");
    powerBar.setAttribute("fill", "none");
    svg.appendChild(powerBar);

    const rpmBar = document.createElementNS(svgNS, "path");
    rpmBar.setAttribute("id", "graph-rpm-bar-svg");
    rpmBar.setAttribute("fill", "none");
    svg.appendChild(rpmBar);

    container.appendChild(svg);

    // New HTML labels for vertical stacking and rotation
    const labelContainer = div({ className: 'graph-vertical-labels-wrapper' });
    const rpmLabel = div({ className: 'graph-vertical-label rpm', id: 'graph-rpm-label-html' });
    rpmLabel.innerHTML = '<span class="unit">kRPM</span><span class="val">0.0</span>';
    const powerLabel = div({ className: 'graph-vertical-label power', id: 'graph-power-label-html' });
    powerLabel.innerHTML = '<span class="val">0</span><span class="symbol">%</span>';

    labelContainer.appendChild(rpmLabel);
    labelContainer.appendChild(powerLabel);
    container.appendChild(labelContainer);

    const divider = div({ className: 'graph-selector-line' });
    const outerRing = div({ className: 'graph-outer-ring' });
    const innerBorder = div({ className: 'graph-inner-border' });
    const innerRingShadow = div({ className: 'graph-inner-ring-shadow' });
    const innerRing = div({ className: 'graph-inner-ring' });

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

    const tooltipMask = div({ className: 'graph-tooltip-mask' });
    innerRing.appendChild(tooltipMask);
    innerRing.appendChild(dynamicTooltip);
    innerRing.appendChild(secondaryTooltip);
    innerRing.appendChild(dynamicTooltipLine);
    innerRing.appendChild(secondaryTooltipLine);

    const timerTooltip = div({ className: 'timer-tooltip', id: 'timer-tooltip' });
    const timerTooltipValue = span({ className: 'timer-tooltip-value', id: 'timer-tooltip-value' });
    const timerTooltipUnity = span({ className: 'timer-tooltip-unity' });
    timerTooltip.appendChild(timerTooltipValue);
    timerTooltip.appendChild(timerTooltipUnity);
    timerTooltipValue.textContent = '--.-s';
    timerTooltipUnity.textContent = '0 - 100 km/h';

    innerRing.appendChild(timerTooltip);



    const warpCanvas = document.createElement('canvas');
    warpCanvas.id = 'warp-tunnel-canvas';
    warpCanvas.className = 'warp-tunnel-canvas';
    container.appendChild(warpCanvas);

    const canvas = document.createElement('canvas');
    canvas.className = 'graph-chart';
    canvas.id = 'graph-chart';
    innerRing.appendChild(canvas);

    container.appendChild(outerRing);
    container.appendChild(innerBorder);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);

    const flashOverlay = div({ className: 'graph-flash-overlay' });
    container.appendChild(flashOverlay);

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
