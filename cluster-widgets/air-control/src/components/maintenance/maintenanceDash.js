import { getState, subscribe } from '../../state.js';
import { div, span } from '../../utils/createElement.js';

function getAlertStatus(value) {
    return value > 0 ? 'active' : 'inactive';
}

export function createMaintenanceScreen() {
    const main = div({ className: 'main-container' });
    const container = div({ className: 'maint-screen' });

    const outerRing = div({ className: 'maint-outer-ring' });
    const innerRingShadow = div({ className: 'maint-inner-ring-shadow' });
    const innerRing = div({ className: 'maint-inner-ring' });

    // Title
    const title = div({
        className: 'maint-title',
        children: [span({ children: ['MANUTENÇÃO'] })]
    });
    innerRing.appendChild(title);

    // Maintenance progress ring
    const progressRing = div({ id: 'maint-progress-ring', className: 'maint-progress-ring' });
    container.appendChild(progressRing);

    // Remaining KM display
    const maintKm = getState('maintenanceKm') || 12000;
    const kmDisplay = div({
        id: 'maint-km-display',
        className: 'maint-km-display',
        children: [
            span({ className: 'maint-km-value', children: [String(maintKm)] }),
            span({ className: 'maint-km-unit', children: ['km restantes'] })
        ]
    });
    innerRing.appendChild(kmDisplay);

    // Odometer section
    const totalOdo = getState('totalOdometer') || 0;
    const tripOdo = getState('tripOdometer') || 0;
    const odoSection = div({
        id: 'maint-odo',
        className: 'maint-odo',
        children: [
            div({
                className: 'maint-odo-row', children: [
                    span({ className: 'maint-odo-label', children: ['🛣 Total:'] }),
                    span({ id: 'maint-odo-total', className: 'maint-odo-value', children: [String(totalOdo) + ' km'] })
                ]
            }),
            div({
                className: 'maint-odo-row', children: [
                    span({ className: 'maint-odo-label', children: ['📍 Viagem:'] }),
                    span({ id: 'maint-odo-trip', className: 'maint-odo-value', children: [String(tripOdo) + ' km'] })
                ]
            })
        ]
    });
    innerRing.appendChild(odoSection);

    // Alert grid
    const alertGrid = div({ id: 'maint-alerts', className: 'maint-alert-grid' });

    const alerts = [
        { id: 'alert-oil', icon: '🛢️', label: 'Óleo', key: 'oilWarning' },
        { id: 'alert-engine', icon: '⚙️', label: 'Motor', key: 'engineService' },
        { id: 'alert-coolant', icon: '🌡', label: 'Arref.', key: 'coolantWarning' },
        { id: 'alert-maint', icon: '🔧', label: 'Revisão', key: 'maintenanceWarning' }
    ];

    alerts.forEach(a => {
        const status = getAlertStatus(getState(a.key));
        const alertEl = div({
            id: a.id,
            className: `maint-alert ${status}`,
            children: [
                span({ className: 'maint-alert-icon', children: [a.icon] }),
                span({ className: 'maint-alert-label', children: [a.label] })
            ]
        });
        alertGrid.appendChild(alertEl);
    });
    innerRing.appendChild(alertGrid);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    // Update progress ring
    function updateProgressRing(km) {
        const ring = document.getElementById('maint-progress-ring');
        if (ring) {
            const maxKm = 12000;
            const remaining = Math.max(0, km);
            const pct = Math.min(1, remaining / maxKm);
            const angle = pct * 360;
            const color = pct > 0.3 ? '#4CAF50' : pct > 0.1 ? '#FF9800' : '#F44336';
            ring.style.setProperty('--maint-angle', `${angle}deg`);
            ring.style.setProperty('--maint-color', color);
        }
    }

    updateProgressRing(maintKm);

    const subscriptions = [];

    subscriptions.push(subscribe('maintenanceKm', (val) => {
        const el = document.getElementById('maint-km-display');
        if (el) {
            el.innerHTML = '';
            el.appendChild(span({ className: 'maint-km-value', children: [String(val)] }));
            el.appendChild(span({ className: 'maint-km-unit', children: ['km restantes'] }));
        }
        updateProgressRing(val);
    }));

    subscriptions.push(subscribe('totalOdometer', (val) => {
        const el = document.getElementById('maint-odo-total');
        if (el) el.textContent = String(val) + ' km';
    }));

    subscriptions.push(subscribe('tripOdometer', (val) => {
        const el = document.getElementById('maint-odo-trip');
        if (el) el.textContent = String(Math.round(val * 10) / 10) + ' km';
    }));

    // Alert subscriptions
    alerts.forEach(a => {
        subscriptions.push(subscribe(a.key, (val) => {
            const el = document.getElementById(a.id);
            if (el) {
                el.className = `maint-alert ${getAlertStatus(val)}`;
            }
        }));
    });

    main.cleanup = () => {
        subscriptions.forEach(unsub => unsub());
    };

    return {
        element: main,
        onMount: () => { updateProgressRing(getState('maintenanceKm') || 12000); }
    };
}
