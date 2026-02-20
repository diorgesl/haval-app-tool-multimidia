import { getState, subscribe } from '../../state.js';
import { div, span } from '../../utils/createElement.js';

const iconLocked = '🔒';
const iconUnlocked = '🔓';

export function createVehicleScreen() {
    const main = div({ className: 'main-container' });
    const container = div({ className: 'vehicle-screen' });

    const outerRing = div({ className: 'vehicle-outer-ring' });
    const innerRingShadow = div({ className: 'vehicle-inner-ring-shadow' });
    const innerRing = div({ className: 'vehicle-inner-ring' });

    // Lock status
    const lockStatus = div({
        id: 'vehicle-lock-status',
        className: 'vehicle-lock-status',
        children: [
            span({ className: 'vehicle-lock-icon', children: [getState('doorLock') === 'locked' ? iconLocked : iconUnlocked] }),
            span({ className: 'vehicle-lock-text', children: [getState('doorLock') === 'locked' ? 'TRAVADO' : 'DESTRAVADO'] })
        ]
    });
    innerRing.appendChild(lockStatus);

    // Car body (top-down view using CSS)
    const carBody = div({ className: 'vehicle-car-body' });

    // Doors
    const doors = {
        FL: div({ id: 'door-fl', className: `vehicle-door door-fl ${getState('doorFL') === 'open' ? 'open' : ''}` }),
        FR: div({ id: 'door-fr', className: `vehicle-door door-fr ${getState('doorFR') === 'open' ? 'open' : ''}` }),
        RL: div({ id: 'door-rl', className: `vehicle-door door-rl ${getState('doorRL') === 'open' ? 'open' : ''}` }),
        RR: div({ id: 'door-rr', className: `vehicle-door door-rr ${getState('doorRR') === 'open' ? 'open' : ''}` })
    };

    Object.values(doors).forEach(d => carBody.appendChild(d));

    // Windows indicators
    const windowRow = div({ className: 'vehicle-window-row' });
    const windowPositions = ['FL', 'FR', 'RL', 'RR'];
    const windowElements = {};
    windowPositions.forEach(pos => {
        const stateKey = `window${pos}`;
        const isOpen = getState(stateKey) === 'open';
        const el = div({
            id: `window-${pos.toLowerCase()}`,
            className: `vehicle-window-indicator ${isOpen ? 'open' : 'closed'}`,
            children: [span({ children: [pos] })]
        });
        windowElements[pos] = el;
        windowRow.appendChild(el);
    });

    // Sunroof indicator
    const sunroofEl = div({
        id: 'vehicle-sunroof',
        className: `vehicle-sunroof ${getState('sunroof') === 'open' ? 'open' : 'closed'}`,
        children: [span({ children: ['☀'] })]
    });
    carBody.appendChild(sunroofEl);

    innerRing.appendChild(carBody);
    innerRing.appendChild(windowRow);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    // Subscriptions
    const subscriptions = [];

    // Door subscriptions
    ['FL', 'FR', 'RL', 'RR'].forEach(pos => {
        subscriptions.push(subscribe(`door${pos}`, (val) => {
            const doorEl = document.getElementById(`door-${pos.toLowerCase()}`);
            if (doorEl) {
                if (val === 'open') doorEl.classList.add('open');
                else doorEl.classList.remove('open');
            }
        }));
    });

    // Window subscriptions
    ['FL', 'FR', 'RL', 'RR'].forEach(pos => {
        subscriptions.push(subscribe(`window${pos}`, (val) => {
            const winEl = document.getElementById(`window-${pos.toLowerCase()}`);
            if (winEl) {
                if (val === 'open') { winEl.classList.add('open'); winEl.classList.remove('closed'); }
                else { winEl.classList.remove('open'); winEl.classList.add('closed'); }
            }
        }));
    });

    // Sunroof subscription
    subscriptions.push(subscribe('sunroof', (val) => {
        const el = document.getElementById('vehicle-sunroof');
        if (el) {
            if (val === 'open') { el.classList.add('open'); el.classList.remove('closed'); }
            else { el.classList.remove('open'); el.classList.add('closed'); }
        }
    }));

    // Lock subscription
    subscriptions.push(subscribe('doorLock', (val) => {
        const lockEl = document.getElementById('vehicle-lock-status');
        if (lockEl) {
            lockEl.innerHTML = '';
            lockEl.append(
                ...div({
                    children: [
                        span({ className: 'vehicle-lock-icon', children: [val === 'locked' ? iconLocked : iconUnlocked] }),
                        span({ className: 'vehicle-lock-text', children: [val === 'locked' ? 'TRAVADO' : 'DESTRAVADO'] })
                    ]
                }).childNodes
            );
        }
    }));

    main.cleanup = () => {
        subscriptions.forEach(unsub => unsub());
    };

    return main;
}
