import {createStatusElement} from "./status.js";
import { stateManager, subscribe, setState } from '../../state.js';
import {createTemperatureElement} from "./temperature.js";
import {createFanElement} from "./fan.js";
import {div} from "../../utils/createElement.js";

/**
 * Cria e posiciona as labels (números) em um arco.
 * @param {HTMLElement} container Onde adicionar as labels.
 * @param {string} prefix Prefixo para o ID de cada label (ex: 'fan' ou 'temp').
 * @param {number[]} values Array de números a serem exibidos.
 * @param {number} radius Raio em pixels para posicionar os números.
 * @param {number} startAngle Ângulo inicial em graus.
 * @param {number} endAngle Ângulo final em graus.
 */
function createArcLabels(container, prefix, values, radius, startAngle, endAngle) {
  const angleStep = (endAngle - startAngle) / (values.length - 1);

  values.forEach((value, index) => {
    const angle = startAngle + (index * angleStep);
    const angleRad = angle * (Math.PI / 180); // Converte para radianos

    const label = document.createElement('div');
    label.className = 'ac-label';
    label.id = `${prefix}-label-${value}`;
    label.textContent = value;

    const x = radius * Math.cos(angleRad);
    const y = radius * Math.sin(angleRad);
    label.style.transform = `translate(${x}px, ${y}px)`;

    container.appendChild(label);
  });
}


export function createAcControlScreen() {

  var main = document.createElement('main');
  main.className = 'main-container';

  const container = document.createElement('div');
  container.className = 'ac-circle-container';

  const fanProgressRing = document.createElement('div');
  fanProgressRing.id = 'fan-progress-ring';
  fanProgressRing.className = 'progress-ring';

  const tempProgressRing = document.createElement('div');
  tempProgressRing.id = 'temp-progress-ring';
  tempProgressRing.className = 'progress-ring';

  container.appendChild(fanProgressRing);
  container.appendChild(tempProgressRing);

  const powerIcon = document.createElement('div');
  powerIcon.className = 'ac-power-icon';
  powerIcon.innerHTML = '&#9211;';
  if (stateManager.get('power') === 0) {
      powerIcon.classList.add('off');
  }

  const divider = document.createElement('div');
  divider.className = 'ac-divider-line';
  const outerRing = document.createElement('div');
  outerRing.className = 'ac-outer-ring';
  const innerRingShadow = document.createElement('div');
  innerRingShadow.className = 'ac-inner-ring-shadow';
  const innerRing = document.createElement('div');
  innerRing.className = 'ac-inner-ring';

  const labelsContainer = document.createElement('div');
  labelsContainer.className = 'ac-labels-container';
  const labelRadius = 208;
  const fanValues = [1, 2, 3, 4, 5, 6, 7];
  createArcLabels(labelsContainer, 'fan', fanValues, labelRadius - 22, -170, -10);
  const tempValues = ['HI', 25, 24, 23, 22, 21, 20, 19, 18, 17, 'LO'];
  createArcLabels(labelsContainer, 'temp', tempValues, labelRadius - 26, 10, 170);

  const temperatureElement = createTemperatureElement();
  const fanElement = createFanElement();
  const statusElement = createStatusElement();

  // Monta a tela
  container.appendChild(outerRing);
  container.appendChild(innerRingShadow);
  container.appendChild(innerRing);
  container.appendChild(divider);
  container.appendChild(powerIcon);
  container.appendChild(fanElement);
  container.appendChild(temperatureElement);
  container.appendChild(labelsContainer);
  container.appendChild(statusElement);
  main.appendChild(container);

  setTimeout(() => {
    const activeFanLabel = container.querySelector(`#fan-label-${stateManager.get('fanSpeed')}`);
    if (activeFanLabel) activeFanLabel.classList.add('active');

    const activeTempLabel = container.querySelector(`#temp-label-${stateManager.get('temperature')}`);
    if (activeTempLabel) activeTempLabel.classList.add('active');
  }, 0);

  return {
      element: main,
      onMount: () => { updateProgressRings(); }
  };

}

export function updateProgressRings() {
    const fanRing = document.getElementById('fan-progress-ring');
    const tempRing = document.getElementById('temp-progress-ring');

    const fanValues = 7;
    const currentFanIndex = stateManager.get('fan');
    const fanAngle = parseInt(currentFanIndex) * 180 / fanValues;
    if (fanRing) {
        fanRing.style.setProperty('--progress-angle', `${fanAngle}deg`);
    }

    const tempValues = 20;
    const currentTempIndex = stateManager.get('temp') - 16;
    const tempAngle = 360 - (2 * (parseFloat(currentTempIndex) * 180 / tempValues));
    if (tempRing) {
        tempRing.style.setProperty('--progress-angle', `${tempAngle}deg`);
    }
}