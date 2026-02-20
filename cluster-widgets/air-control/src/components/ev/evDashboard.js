import { getState, subscribe } from '../../state.js';
import { div, span } from '../../utils/createElement.js';

function getBatteryColor(percent) {
    if (percent > 60) return '#4CAF50';
    if (percent > 30) return '#FF9800';
    return '#F44336';
}

function getDriveStateLabel(state) {
    const map = {
        'ev': '🔋 Elétrico',
        'ice': '⛽ Combustão',
        'hybrid': '⚡ Híbrido',
        'regen': '♻️ Regenerando'
    };
    return map[state] || '⚡ ' + state;
}

function getDriveStateClass(state) {
    return 'ev-drive-state-' + (state || 'hybrid');
}

export function createEvDashScreen() {
    const main = div({ className: 'main-container' });
    const container = div({ className: 'ev-screen' });

    const outerRing = div({ className: 'ev-outer-ring' });
    const innerRingShadow = div({ className: 'ev-inner-ring-shadow' });
    const innerRing = div({ className: 'ev-inner-ring' });

    // Battery progress ring
    const batteryRing = div({ id: 'ev-battery-ring', className: 'ev-battery-ring' });
    container.appendChild(batteryRing);

    // Drive state indicator (top)
    const driveState = getState('energyDriveState') || 'hybrid';
    const driveStateEl = div({
        id: 'ev-drive-state',
        className: `ev-drive-state ${getDriveStateClass(driveState)}`,
        children: [span({ children: [getDriveStateLabel(driveState)] })]
    });
    innerRing.appendChild(driveStateEl);

    // Battery percentage text
    const batteryPercent = getState('batteryPercent');
    const batteryText = div({
        id: 'ev-battery-text',
        className: 'ev-battery-text',
        children: [
            span({ className: 'ev-battery-value', children: [String(Math.round(batteryPercent))] }),
            span({ className: 'ev-battery-unit', children: ['%'] })
        ]
    });
    innerRing.appendChild(batteryText);

    // Voltage display
    const voltageDisplay = div({
        id: 'ev-voltage',
        className: 'ev-voltage',
        children: [
            span({ className: 'ev-voltage-value', children: [String(getState('batteryVoltage').toFixed(1))] }),
            span({ className: 'ev-voltage-unit', children: ['V'] })
        ]
    });
    innerRing.appendChild(voltageDisplay);

    // Energy stats panel (center-bottom area)
    const statsPanel = div({ id: 'ev-stats-panel', className: 'ev-stats-panel' });

    // EV consumption vs Fuel consumption bars
    const evConsume = getState('cycleEnergyConsume') || 0;
    const fuelConsume = getState('cycleFuelConsume') || 0;
    const total = evConsume + fuelConsume || 1;

    const barsContainer = div({ className: 'ev-bars-container' });

    // EV bar
    const evBar = div({
        className: 'ev-bar-row', children: [
            span({ className: 'ev-bar-label ev-color', children: ['⚡ EV'] }),
            div({
                className: 'ev-bar-track', children: [
                    div({ id: 'ev-bar-fill-ev', className: 'ev-bar-fill ev-fill', style: `width: ${(evConsume / total * 100).toFixed(0)}%` })
                ]
            }),
            span({ id: 'ev-bar-pct-ev', className: 'ev-bar-pct', children: [`${(evConsume / total * 100).toFixed(0)}%`] })
        ]
    });

    // Fuel bar
    const fuelBar = div({
        className: 'ev-bar-row', children: [
            span({ className: 'ev-bar-label fuel-color', children: ['⛽ ICE'] }),
            div({
                className: 'ev-bar-track', children: [
                    div({ id: 'ev-bar-fill-fuel', className: 'ev-bar-fill fuel-fill', style: `width: ${(fuelConsume / total * 100).toFixed(0)}%` })
                ]
            }),
            span({ id: 'ev-bar-pct-fuel', className: 'ev-bar-pct', children: [`${(fuelConsume / total * 100).toFixed(0)}%`] })
        ]
    });

    barsContainer.appendChild(evBar);
    barsContainer.appendChild(fuelBar);
    statsPanel.appendChild(barsContainer);

    // Recovery info
    const recoveryEl = div({
        id: 'ev-recovery',
        className: 'ev-recovery',
        children: [
            span({ className: 'ev-recovery-label', children: ['♻️ Regeneração'] }),
            span({ id: 'ev-recovery-value', className: 'ev-recovery-value', children: [String(getState('energyRecovery') || 0)] }),
            span({ className: 'ev-recovery-unit', children: ['kWh'] })
        ]
    });
    statsPanel.appendChild(recoveryEl);

    // EV and Fuel range
    const rangeEl = div({
        id: 'ev-range-display',
        className: 'ev-range-display',
        children: [
            div({
                className: 'ev-range-item ev-range-ev', children: [
                    span({ className: 'ev-range-icon', children: ['🔋'] }),
                    span({ id: 'ev-range-ev-val', className: 'ev-range-value', children: [String(getState('evRangeKm') || 0)] }),
                    span({ className: 'ev-range-unit', children: ['km'] })
                ]
            }),
            div({
                className: 'ev-range-item ev-range-fuel', children: [
                    span({ className: 'ev-range-icon', children: ['⛽'] }),
                    span({ id: 'ev-range-fuel-val', className: 'ev-range-value', children: [String(getState('fuelRangeKm') || 0)] }),
                    span({ className: 'ev-range-unit', children: ['km'] })
                ]
            })
        ]
    });
    statsPanel.appendChild(rangeEl);

    innerRing.appendChild(statsPanel);

    // Charging indicator
    const chargingEl = div({
        id: 'ev-charging',
        className: `ev-charging ${getState('chargingState') > 0 ? 'active' : ''}`,
        children: [span({ children: ['🔌 Carregando'] })]
    });
    innerRing.appendChild(chargingEl);

    container.appendChild(outerRing);
    container.appendChild(innerRingShadow);
    container.appendChild(innerRing);
    main.appendChild(container);

    // Update battery ring
    function updateBatteryRing(percent) {
        const ring = document.getElementById('ev-battery-ring');
        if (ring) {
            const angle = (percent / 100) * 360;
            const color = getBatteryColor(percent);
            ring.style.setProperty('--battery-angle', `${angle}deg`);
            ring.style.setProperty('--battery-color', color);
        }
    }

    function updateBars() {
        const ev = getState('cycleEnergyConsume') || 0;
        const fuel = getState('cycleFuelConsume') || 0;
        const t = ev + fuel || 1;
        const evPct = (ev / t * 100).toFixed(0);
        const fuelPct = (fuel / t * 100).toFixed(0);

        const evFill = document.getElementById('ev-bar-fill-ev');
        const fuelFill = document.getElementById('ev-bar-fill-fuel');
        const evPctEl = document.getElementById('ev-bar-pct-ev');
        const fuelPctEl = document.getElementById('ev-bar-pct-fuel');

        if (evFill) evFill.style.width = evPct + '%';
        if (fuelFill) fuelFill.style.width = fuelPct + '%';
        if (evPctEl) evPctEl.textContent = evPct + '%';
        if (fuelPctEl) fuelPctEl.textContent = fuelPct + '%';
    }

    updateBatteryRing(batteryPercent);

    const subscriptions = [];

    subscriptions.push(subscribe('batteryPercent', (val) => {
        const textEl = document.getElementById('ev-battery-text');
        if (textEl) {
            textEl.innerHTML = '';
            textEl.appendChild(span({ className: 'ev-battery-value', children: [String(Math.round(val))] }));
            textEl.appendChild(span({ className: 'ev-battery-unit', children: ['%'] }));
        }
        updateBatteryRing(val);
    }));

    subscriptions.push(subscribe('batteryVoltage', (val) => {
        const el = document.getElementById('ev-voltage');
        if (el) {
            el.innerHTML = '';
            el.appendChild(span({ className: 'ev-voltage-value', children: [String(Number(val).toFixed(1))] }));
            el.appendChild(span({ className: 'ev-voltage-unit', children: ['V'] }));
        }
    }));

    subscriptions.push(subscribe('energyDriveState', (val) => {
        const el = document.getElementById('ev-drive-state');
        if (el) {
            el.className = `ev-drive-state ${getDriveStateClass(val)}`;
            el.innerHTML = '';
            el.appendChild(span({ children: [getDriveStateLabel(val)] }));
        }
    }));

    subscriptions.push(subscribe('cycleEnergyConsume', () => updateBars()));
    subscriptions.push(subscribe('cycleFuelConsume', () => updateBars()));

    subscriptions.push(subscribe('energyRecovery', (val) => {
        const el = document.getElementById('ev-recovery-value');
        if (el) el.textContent = String(Number(val).toFixed(1));
    }));

    subscriptions.push(subscribe('evRangeKm', (val) => {
        const el = document.getElementById('ev-range-ev-val');
        if (el) el.textContent = String(val);
    }));

    subscriptions.push(subscribe('fuelRangeKm', (val) => {
        const el = document.getElementById('ev-range-fuel-val');
        if (el) el.textContent = String(val);
    }));

    subscriptions.push(subscribe('chargingState', (val) => {
        const el = document.getElementById('ev-charging');
        if (el) {
            if (val > 0) el.classList.add('active');
            else el.classList.remove('active');
        }
    }));

    main.cleanup = () => {
        subscriptions.forEach(unsub => unsub());
    };

    return {
        element: main,
        onMount: () => { updateBatteryRing(getState('batteryPercent')); }
    };
}
