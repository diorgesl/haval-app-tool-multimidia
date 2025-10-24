import {getState as get, setState, subscribe} from './state.js';
import {createMainMenu} from './components/mainMenu.js';
import {createAcControlScreen, updateProgressRings} from "./components/aircon/mainAcControl.js";
import {prepareGameScreen, startGame, stopGame} from "./components/doom/doom.js";


const appContainer = document.getElementById('app');
let currentComponent = null;

const doom = prepareGameScreen();
document.body.append(doom);

function render() {
    const screen = get('screen');

    if (currentComponent && currentComponent.cleanup) {
        currentComponent.cleanup();
    }

    if (appContainer && appContainer.innerHTML) {
        appContainer.innerHTML = ''; // Limpa o DOM de forma simples
    }

    if (screen === 'main_menu') {
        stopGame();
        currentComponent = createMainMenu();
    } else if (screen === 'ac_control') {
        currentComponent = createAcControlScreen();
        stopGame();
    } else if (screen === 'doom') {
        currentComponent = "";
        startGame();
    }

    if (currentComponent) {
        appContainer.appendChild(currentComponent);
        if (screen === 'ac_control') updateProgressRings();
    }
}

// Start rendering and subscribe to listen for screen changes thus triggering new render

subscribe('screen', render);
subscribe('espStatus', render);
subscribe('drivingMode', render);
subscribe('steerMode', render);
subscribe('regenMode', render);
subscribe('evMode', render);
render();

/**********************************************************
  Functions used by Kotlin code to perform js interaction
***********************************************************/

// SubScreen selection
window.showScreen = function(screenName) {
    setState('screen', screenName);
};

// Main Menu item focus
window.focus = function(item) {
    const screen = get('screen');
    if (screen === 'main_menu') {
        // Se estamos no menu, 'area' é um ID de item de menu.
        setState('focusedMenuItem', item);
    } else {
        // Se estamos no AC, 'area' é um item de foco do AC.
        setState('focusArea', item);
    }
};

// AC and other screen controls
window.control = function(key, value) {
    setState(key, value);
};

// Clean up for better memory management
window.cleanup = function() {
    if (currentComponent && currentComponent.cleanup) {
        currentComponent.cleanup();
    }
};
