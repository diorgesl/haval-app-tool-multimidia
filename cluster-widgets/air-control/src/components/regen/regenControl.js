import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';


export const regenItems = [
    {id: 'Alta', displayLabel: 'ALTA'},
    {id: 'Media', displayLabel: 'MEDIA'},
    {id: 'Normal', displayLabel: 'NORMAL'},
];

const regenChartController = {
    chartInstance: null,
    isInitialized: false,
    watchdogTimer: null,
    unsubscribeFromData: null,

    init(canvasContext) {
        if (this.isInitialized) return;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Regen Power',
                    backgroundColor: 'rgba(0, 120, 255, 0.1)',
                    borderColor: 'rgba(0, 195, 255, 0.3)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    streaming: {
                        duration: 30000,
                        refresh: 1000,
                    }
                },
                scales: {
                    x: { type: 'realtime', display: false },
                    y: { display: false, ticks: { beginAtZero: true, max: 100 } }
                }
            }
        });

        this.isInitialized = true;
        this.startDataSubscription();
    },

    startDataSubscription() {
        if (!this.isInitialized || this.unsubscribeFromData) return;

        this.unsubscribeFromData = subscribe('lastRegenValue', (newValue) => {
            if (this.chartInstance) {
                this.resetWatchdog();
                this.chartInstance.data.datasets[0].data.push({
                    x: Date.now(),
                    y: newValue
                });
            }
        });
        this.resetWatchdog();
    },

    injectZeroDataPoint() {
        if (this.isInitialized && this.chartInstance) {
            this.chartInstance.data.datasets[0].data.push({ x: Date.now(), y: 0 });
        }
    },

    resetWatchdog() {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = setTimeout(this.injectZeroDataPoint.bind(this), 1500);
    },

    cleanup() {
        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
            this.unsubscribeFromData = null;
        }
        if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }
        if(this.chartInstance) {
            this.chartInstance.destroy(); // Libera a memória do Chart.js
        }
        this.isInitialized = false;
        this.chartInstance = null;
    }
};

export function createRegenScreen() {

    var main = document.createElement('main');
    main.className = 'main-container';

    const container = document.createElement('div');
    container.className = 'regen-screen';

    const regenProgressRing = document.createElement('div');
    regenProgressRing.id = 'regen-progress-ring';
    regenProgressRing.className = 'regen-progress-ring';
    container.appendChild(regenProgressRing);

    const divider = document.createElement('div');
    divider.className = 'regen-selector-line';
    const outerRing = document.createElement('div');
    outerRing.className = 'regen-outer-ring';
    const innerRingShadow = document.createElement('div');
    innerRingShadow.className = 'regen-inner-ring-shadow';
    const innerRing = document.createElement('div');
    innerRing.className = 'regen-inner-ring';

    const canvas = document.createElement('canvas');
    canvas.className = 'regen-chart';
    canvas.id = 'regen-chart';
    innerRing.appendChild(canvas);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);
    const regenStatus = getState('regenMode');
    const itemElements = {};

    regenItems.forEach((itemData, index) => {
        const isFocused = itemData.id === regenStatus;

        const itemEl = div({
            id: itemData.id,
            className: `regen-item ${isFocused ? 'focused' : ''}`,
            'data-index': index,
            children: [
                span({
                    className: 'regen-label',
                    children: [itemData.displayLabel]
                })
            ]
        });

        container.appendChild(itemEl);
        itemElements[itemData.id] = itemEl;
    });

    container.appendChild(divider);

    setTimeout(() => {
        const ctx = document.getElementById('regen-chart');
        if (ctx) {
            regenChartController.init(ctx);
        }
    }, 0);

    const updateFocus = (regenStatus) => {
        Object.values(itemElements).forEach(el => {
            if (el.id === regenStatus) {
                el.classList.add('focused');
            } else {
                el.classList.remove('focused');
            }
        });
        updateProgressRings();
    };

    updateFocus(regenStatus);

    const unsubscribe = subscribe('regenMode', updateFocus);

    main.cleanup = () => {
        unsubscribe();
    };


    return main;
}


export function updateProgressRings() {
    const regenRing = document.getElementById('regen-progress-ring');

    var position = 0;
    const regenMode = getState('regenMode');
    regenItems.forEach((itemData, index) => {
        if (itemData.id === regenMode) {
            position = 3 - index;
        }
    });

    if (regenRing) {
        regenRing.style.setProperty('--regen-segment-active-level', position);
    }

}