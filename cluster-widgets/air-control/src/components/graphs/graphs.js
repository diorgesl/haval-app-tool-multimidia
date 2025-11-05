import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';

import { Chart, registerables } from 'chart.js';
import streamingPlugin from 'chartjs-plugin-streaming';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables, streamingPlugin);

export const graphList = [
    {id: 'evConsumption', displayLabel: 'Consumo EV', dataKey: 'evConsumption', unity: '%' },
    {id: 'gasConsumption', displayLabel: 'Consumo Combustão', dataKey: 'gasConsumption', unity: '%'  },
    {id: 'batteryPercentage', displayLabel: 'BATERIA %', dataKey: 'batteryPercentage', unity: '%'  },
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
                    },
                },
                scales: {
                    x: {
                        type: 'realtime',
                        display: false
                    },
                    y: {
                        display: true,
                        min: 0,
                        max: 100,
                        ticks: {
                            padding: 10,
                            color: 'rgba(100,172,255,0.7)',
                            callback: function(value, index, ticks) { return value >= 40 && value <= 60 ? value : ''; },
                        },
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            drawTicks: false,
                            color: 'rgba(0,160,255,0.1)',
                        },
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

                const tooltipEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip');
                const lineEl = this.chartInstance.canvas.parentNode.querySelector('.dynamic-tooltip-line'); // <-- NOVO
                if (tooltipEl && lineEl) {
                    const newYpos = Math.min(350,450 - (newValue * 450/100));
                    if (newYpos) {
                        tooltipEl.textContent = Math.round(newValue)  + " " + graphInfo.unity;;
                        tooltipEl.style.top = `${newYpos}px`;
                        tooltipEl.style.opacity = 1;

                        lineEl.style.top = `${newYpos - 20}px`;
                        lineEl.style.opacity = 1;
                    }
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

    const dynamicTooltip = div({ className: 'dynamic-tooltip' });
    innerRing.appendChild(dynamicTooltip);
    const dynamicTooltipLine = div({ className: 'dynamic-tooltip-line' });
    innerRing.appendChild(dynamicTooltipLine);

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
