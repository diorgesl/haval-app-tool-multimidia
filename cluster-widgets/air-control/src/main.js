import {getState as get, setState, subscribe} from './state.js';
import {createMainMenu} from './components/mainMenu.js';
import {createAcControlScreen, updateProgressRings as updateProgressRingsAC} from "./components/aircon/mainAcControl.js";
import {createRegenScreen, updateProgressRings as updateProgressRingsRegen } from "./components/regen/regenControl.js";
import {prepareGameScreen, startGame, stopGame} from "./components/doom/doom.js";
import {createGraphScreen } from "./components/graphs/graphs.js";

const appContainer = document.getElementById('app');
let currentComponent = null;

// ## Tests to run Doom on the cluster screen (On Hold for the moment as need to fix JSDOS imports)
//const doom = prepareGameScreen();
//document.body.append(doom);

function render() {
    const screen = get('screen');

    if (currentComponent && currentComponent.cleanup) {
        currentComponent.cleanup();
    }

    if (appContainer && appContainer.innerHTML) {
        appContainer.innerHTML = '';
    }

    //stopGame(); future use to test the doom game

    if (screen === 'main_menu') {
        currentComponent = createMainMenu();
    } else if (screen === 'aircon') {
        currentComponent = createAcControlScreen();
    } else if (screen === 'regen') {
        currentComponent = createRegenScreen();
    } else if (screen === 'graph') {
        currentComponent = createGraphScreen();
    }

//  future use to test the game
/*    } else if (screen === 'doom') {
        currentComponent = "";
        startGame();
      }
*/
    if (currentComponent) {
        appContainer.appendChild(currentComponent);
        if (screen === 'aircon') {
            updateProgressRingsAC();
        }
        if (screen === 'regen') {
            updateProgressRingsRegen();
        }
    }
}

subscribe('screen', render);
subscribe('espStatus', render);
subscribe('drivingMode', render);
subscribe('steerMode', render);
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
        setState('focusedMenuItem', item);
    } else if (screen === 'aircon') {
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
