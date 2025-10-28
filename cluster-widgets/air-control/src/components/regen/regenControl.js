import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';


export const regenItems = [
    {id: 'Alta', displayLabel: 'ALTA'},
    {id: 'Media', displayLabel: 'MEDIA'},
    {id: 'Normal', displayLabel: 'NORMAL'},
];

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
    setupRegenChart();

    const unsubscribe = subscribe('regenMode', updateFocus);

    main.cleanup = () => {
        unsubscribe();
    };

    return main;
}

export function setupRegenChart() {
    const ctx = document.getElementById('regen-chart');
    if (!ctx) {
        console.error("Elemento canvas #regen-chart não encontrado!");
        return;
    }

    const regenChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Regen Power',
                backgroundColor: 'rgba(0, 120, 255, 0.1)',
                borderColor: 'rgba(0, 195, 255, 0.3)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                shadowColor: 'rgba(0, 195, 255, 0.4)',
                shadowBlur: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: { display: false },
            tooltips: { enabled: false },
            scales: {
                xAxes: [{
                    type: 'realtime',
                    display: false
                }],
                yAxes: [{
                    display: false,
                    ticks: { beginAtZero: true, max: 100 }
                }]
            },
            plugins: {
                streaming: {
                    duration: 30000,
                    refresh: 1000,
                    delay: 200,
                }
            }
        }
    });

    let watchdogTimer = null;

    const injectZeroDataPoint = () => {
        if (regenChartInstance) {
            regenChartInstance.data.datasets[0].data.push({
                x: Date.now(),
                y: 0
            });
            resetWatchdog();
        }
    };

    const resetWatchdog = () => {
        if (watchdogTimer) {
            clearTimeout(watchdogTimer);
        }
        watchdogTimer = setTimeout(injectZeroDataPoint, 1000);
    };

    subscribe('lastRegenValue', (newValue) => {
        resetWatchdog();

        if (regenChartInstance) {
            regenChartInstance.data.datasets[0].data.push({
                x: Date.now(),
                y: newValue
            });
        }
    });

    resetWatchdog();
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