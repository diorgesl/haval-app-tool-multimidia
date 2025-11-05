import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables, streamingPlugin);

export const graphList = [
    {id: 'evConsumption', displayLabel: 'Consumo EV', dataKey: 'evConsumption' },
    {id: 'gasConsumption', displayLabel: 'Consumo Combustão', dataKey: 'gasConsumption' },
    {id: 'batteryPercentage', displayLabel: 'BATERIA %', dataKey: 'batteryPercentage' },
];


const graphController = {
    chartInstance: null,
    currentDataKey: null,
    unsubscribeFromData: null,
    isInitialized: false,

    init(canvasContext) {
        if (this.isInitialized) return;

        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: { datasets: [{
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
                    streaming: {
                        duration: 20000,
                        refresh: 1000,
                        frameRate: 30
                    }
                },
                scales: {
                    x: {
                        type: 'realtime',
                        display: false
                    },
                    y: {
                        display: false,
                        ticks: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            }
        });
        this.isInitialized = true;
    },

    switchTo(graphId) {
        if (!this.isInitialized) {
            return;
        }

        const graphInfo = graphList.find(g => g.id === graphId);
        if (!graphInfo || graphInfo.dataKey === this.currentDataKey) {
            return;
        }

        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
            this.unsubscribeFromData = null;
        }

        this.currentDataKey = graphInfo.dataKey;
        this.chartInstance.canvas.style.transition = 'opacity 0.3s ease-out';
        this.chartInstance.canvas.style.opacity = 0;

        setTimeout(() => {
            this.chartInstance.data.datasets[0].label = graphInfo.displayLabel;
            this.chartInstance.data.datasets[0].data = [];
            this.chartInstance.update({ duration: 0 });

            this.unsubscribeFromData = subscribe(this.currentDataKey, (newValue) => {
                if (this.chartInstance) {
                    this.chartInstance.data.datasets[0].data.push({
                        x: Date.now(),
                        y: newValue
                    });
                }
            });

            this.chartInstance.canvas.style.opacity = 1;
        }, 300);
    },

    cleanup() {
        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
            this.unsubscribeFromData = null;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        this.isInitialized = false;
        this.currentDataKey = null;
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

    const canvas = div({className: 'graph-chart'});
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
        if (unsubscribeFromGraphChange) {
            unsubscribeFromGraphChange();
        }
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
