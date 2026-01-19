import { stateManager, subscribe } from '../../state.js';
import { div, img, span } from '../../utils/createElement.js';
import { updateProgressRings } from './mainAcControl.js'

const ionColor = {
    0: '#60a5fa', // on air
    1: '#018786', // on ion
    2: '#FFFFFF', // fan only
}
// Fan icon SVG as data URL
var fanIconSvg = (ion) => 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="' + ionColor[ion] + '" d="M352 96C352 113.7 366.3 128 384 128L424 128C437.3 128 448 138.7 448 152C448 165.3 437.3 176 424 176L96 176C78.3 176 64 190.3 64 208C64 225.7 78.3 240 96 240L424 240C472.6 240 512 200.6 512 152C512 103.4 472.6 64 424 64L384 64C366.3 64 352 78.3 352 96zM416 448C416 465.7 430.3 480 448 480L480 480C533 480 576 437 576 384C576 331 533 288 480 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L96 352L480 352C497.7 352 512 366.3 512 384C512 401.7 497.7 416 480 416L448 416C430.3 416 416 430.3 416 448zM192 576L232 576C280.6 576 320 536.6 320 488C320 439.4 280.6 400 232 400L96 400C78.3 400 64 414.3 64 432C64 449.7 78.3 464 96 464L232 464C245.3 464 256 474.7 256 488C256 501.3 245.3 512 232 512L192 512C174.3 512 160 526.3 160 544C160 561.7 174.3 576 192 576z"/></svg>');

const getFanIconColor = () => {
    const powerState = stateManager.get('power');
    const aionState = stateManager.get('aion');

    if (powerState === 0) {
        return 2;
    }

    return aionState;
}

function getTempDisplayValue(temp) {
    if (temp == 16) return 'Low';
    if (temp == 32) return 'High';
    return temp + '°C';
}

export function createImpulseAutoElement() {

    const impulse_auto_container = div({
        className: 'impulse-auto-container',
    });

    const speedText = span({
        className: 'impulse-auto-value-display text-center',
        children: [
            stateManager.get('fan'),
        ],
    });
    const icon = img({
        src: fanIconSvg(getFanIconColor()),
        className: 'w-32 h-32',
    });

    var fan = div({
        className: 'impulse-auto-ac-fan',
        children: [
            div({
                className: 'text-white flex-row-center',
                style: 'gap: 15px;',
                children: [
                    div({
                        className: 'text-24 font-bold flex-row-center w-60',
                        children: [
                            icon,
                            speedText,
                        ],
                    }),
                    div({
                        className: 'text-20 text-gray',
                        children: [
                            'Fan',
                        ],
                    }),
                ],
            }),
        ],
    });

    var tempDisplay = div({
        className: 'impulse-auto-value-display font-bold',
        children: [
            getTempDisplayValue(stateManager.get('temp')),
        ],
    });

    var temp = div({
        className: 'impulse-auto-ac-temp',
        children: [
            div({
                className: 'text-white flex-row-center',
                style: 'gap: 15px;',
                children: [
                    div({
                        className: 'text-20 text-gray',
                        children: [
                            'Temp',
                        ],
                    }),
                    tempDisplay
                ],
            }),
        ]
    });

    impulse_auto_container.appendChild(fan);
    impulse_auto_container.appendChild(temp);

    const dividerTop = div({
        className: 'impulse-auto-divider-top',
    });
    impulse_auto_container.appendChild(dividerTop);

    const dividerBottom = div({
        className: 'impulse-auto-divider-bottom',
    });
    impulse_auto_container.appendChild(dividerBottom);

    var impulseAutoIconElement = span({
        children: ['IMPULSE AUTO']
    });
    var impulseAutoContainer = div({
        className: `impulse-auto-icon-container ${stateManager.get('impulseauto') === 1 ? '' : 'hidden'}`,
        children: [
            impulseAutoIconElement
        ],
    });
    impulse_auto_container.appendChild(impulseAutoContainer);

    var unsubscribeFan = subscribe('fan', function (newFanSpeed) {
        speedText.textContent = newFanSpeed;
    });

    var unsubsscribeAion = subscribe('aion', function () {
        icon.src = fanIconSvg(getFanIconColor());
    });
    var unsubsscribePower = subscribe('power', function () {
        icon.src = fanIconSvg(getFanIconColor());
    });

    var unsubscribeTemp = subscribe('temp', function (newTemp) {
        tempDisplay.textContent = getTempDisplayValue(newTemp);
    });

    var unsubscribeImpulseAuto = subscribe('impulseauto', function (newImpulseAuto) {
        if (newImpulseAuto == 1) {
            impulseAutoContainer.classList.remove('hidden');
        } else {
            impulseAutoContainer.classList.add('hidden');
        }
    });

    impulse_auto_container.cleanup = function () {
        unsubscribeFan();
        unsubsscribeAion();
        unsubsscribePower();
        unsubscribeTemp();
        unsubscribeImpulseAuto();
    };

    return impulse_auto_container;
}
