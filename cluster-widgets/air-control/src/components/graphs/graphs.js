import {getState, subscribe} from '../../state.js';
import {div, img, span} from '../../utils/createElement.js';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-streaming';
//import 'chartjs-adapter-moment';


export const graphList = [
    {id: 'evConsumption', displayLabel: 'Consumo EV', dataKey: 'evConsumption' },
    {id: 'gasConsumption', displayLabel: 'Consumo Combustão', dataKey: 'gasConsumption' },
    {id: 'batteryPercentage', displayLabel: 'BATERIA %', dataKey: 'batteryPercentage' },
];


const graphController = {
    chartInstance: null,
    currentDataKey: null,
    unsubscribeFromData: null,

    init(canvasContext) {
        this.chartInstance = new Chart(canvasContext, {
            type: 'line',
            data: { datasets: [{
                label: '', // Dynamic Title
                backgroundColor: 'rgba(0, 120, 255, 0.15)',
                borderColor: '#00c3ff',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                shadowColor: 'rgba(0, 195, 255, 0.5)',
                shadowBlur: 10,
            }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                tooltips: { enabled: false },
                scales: {
                    xAxes: [{ type: 'realtime', display: false }],
                    yAxes: [{ display: false, ticks: { beginAtZero: true, max: 100 } }]
                },
                plugins: {
                    streaming: { duration: 20000, refresh: 1000, frameRate: 30 }
                }
            }
        });
    },

    switchTo(graphId) {
        const graphInfo = graphList.find(g => g.id === graphId);
        if (!graphInfo || graphInfo.dataKey === this.currentDataKey) {
            return;
        }

        this.chartInstance.canvas.style.transition = 'opacity 0.3s ease-out';
        this.chartInstance.canvas.style.opacity = 0;

        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
        }

        this.currentDataKey = graphInfo.dataKey;

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
    }
};

export function createGraphScreen() {

    var main = document.createElement('main');
    main.className = 'main-container';

    const container = document.createElement('div');
    container.className = 'graph-screen';

    const graphProgressRing = document.createElement('div');
    graphProgressRing.id = 'graph-progress-ring';
    graphProgressRing.className = 'graph-progress-ring';
    container.appendChild(graphProgressRing);

    const divider = document.createElement('div');
    divider.className = 'graph-selector-line';
    const outerRing = document.createElement('div');
    outerRing.className = 'graph-outer-ring';
    const innerRingShadow = document.createElement('div');
    innerRingShadow.className = 'graph-inner-ring-shadow';
    const innerRing = document.createElement('div');
    innerRing.className = 'graph-inner-ring';

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
        bulletElements[itemData.id] = bulletEl; // Guarda a referência
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
