import { getState, subscribe } from '../../state.js';
import { div, span } from '../../utils/createElement.js';

function getTireColor(pressure) {
    if (pressure >= 2.0) return 'ok';
    if (pressure >= 1.8) return 'warning';
    return 'critical';
}

function createTireIndicator(id, label, pressure) {
    return div({
        id: `tpms-${id}`,
        className: `tpms-tire ${getTireColor(pressure)}`,
        children: [
            span({ className: 'tpms-tire-label', children: [label] }),
            span({ className: 'tpms-tire-value', children: [pressure.toFixed(1)] }),
            span({ className: 'tpms-tire-unit', children: ['bar'] })
        ]
    });
}

export function createTpmsScreen() {
    const main = div({ className: 'main-container' });
    const container = div({ className: 'tpms-screen' });

    const outerRing = div({ className: 'tpms-outer-ring' });
    const innerRingShadow = div({ className: 'tpms-inner-ring-shadow' });
    const innerRing = div({ className: 'tpms-inner-ring' });

    // Title
    const title = div({
        className: 'tpms-title',
        children: [span({ children: ['TPMS'] })]
    });
    innerRing.appendChild(title);

    // Car outline
    const carOutline = div({ className: 'tpms-car-outline' });
    innerRing.appendChild(carOutline);

    // Tire indicators
    const tireFL = createTireIndicator('fl', 'DE', getState('tpmsFL'));
    const tireFR = createTireIndicator('fr', 'DD', getState('tpmsFR'));
    const tireRL = createTireIndicator('rl', 'TE', getState('tpmsRL'));
    const tireRR = createTireIndicator('rr', 'TD', getState('tpmsRR'));

    const frontRow = div({ className: 'tpms-row tpms-front', children: [tireFL, tireFR] });
    const rearRow = div({ className: 'tpms-row tpms-rear', children: [tireRL, tireRR] });

    innerRing.appendChild(frontRow);
    innerRing.appendChild(rearRow);

    // Warning indicator
    const warningEl = div({
        id: 'tpms-warning',
        className: `tpms-warning ${getState('tpmsWarning') > 0 ? 'active' : ''}`,
        children: [span({ children: ['⚠ Verificar pressão dos pneus'] })]
    });
    innerRing.appendChild(warningEl);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    const subscriptions = [];

    function updateTire(id, val) {
        const el = document.getElementById(`tpms-${id}`);
        if (el) {
            el.className = `tpms-tire ${getTireColor(val)}`;
            const valueEl = el.querySelector('.tpms-tire-value');
            if (valueEl) valueEl.textContent = Number(val).toFixed(1);
        }
    }

    subscriptions.push(subscribe('tpmsFL', (val) => updateTire('fl', val)));
    subscriptions.push(subscribe('tpmsFR', (val) => updateTire('fr', val)));
    subscriptions.push(subscribe('tpmsRL', (val) => updateTire('rl', val)));
    subscriptions.push(subscribe('tpmsRR', (val) => updateTire('rr', val)));

    subscriptions.push(subscribe('tpmsWarning', (val) => {
        const el = document.getElementById('tpms-warning');
        if (el) {
            if (val > 0) el.classList.add('active');
            else el.classList.remove('active');
        }
    }));

    main.cleanup = () => {
        subscriptions.forEach(unsub => unsub());
    };

    return main;
}
