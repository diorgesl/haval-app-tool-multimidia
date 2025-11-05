import { setState, stateManager } from './state.js';
import { menuItems } from './components/mainMenu.js';

console.log("✅ Ambiente de teste local (Live Server) carregado.");
console.log("   - Setas (↑/↓/←/→) para navegar/ajustar.");
console.log("   - 'Enter' para selecionar/alternar foco.");
console.log("   - 'Backspace' para voltar ao menu.");

const focusableAreas = {
  main_menu: menuItems.map(item => item.id),
  ac_control: ['fan', 'temp', 'power']
};


document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const currentState = stateManager.getState();
  const currentScreen = currentState.screen;

  if (e.key === 'Backspace') {
      if (currentScreen !== 'main_menu') {
          console.log("[AÇÃO] Voltando para o menu principal...");
          window.showScreen('main_menu');
      }
      return;
  }

  if (currentScreen === 'main_menu') {
      const menuItems = focusableAreas.main_menu;
      const currentIndex = menuItems.indexOf(currentState.focusedMenuItem);

      if (e.key === 'ArrowUp') {
          const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
          window.focus(menuItems[prevIndex]);
      } else if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % menuItems.length;
          window.focus(menuItems[nextIndex]);
      } else if (e.key === 'Enter') {
          console.log(`[AÇÃO] 'Enter' pressionado no menu: ${currentState.focusedMenuItem}`);
          if (currentState.focusedMenuItem === 'option_4') {
              window.showScreen('ac_control');
          }

          if (currentState.focusedMenuItem === 'option_1') {
              const currentStatus = stateManager.getState().espStatus;
              const newStatus = (currentStatus === 'ON') ? 'OFF' : 'ON';
              console.log(`[AÇÃO] Alterando ESP de '${currentStatus}' para '${newStatus}'`);
              setState('espStatus', newStatus);
          } else if (currentState.focusedMenuItem === 'option_2') {
              const modes = ['HEV', 'PHEV', 'EV'];
              const currentMode = stateManager.getState().evMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              console.log(`[AÇÃO] Alterando Modo de '${currentMode}' para '${newMode}'`);
              setState('evMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_5') {
              const modes = ['Normal', 'Eco', 'Sport'];
              const currentMode = stateManager.getState().drivingMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              console.log(`[AÇÃO] Alterando Modo de '${currentMode}' para '${newMode}'`);
              setState('drivingMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_6') {
              const modes = ['Normal', 'Conforto', 'Esportiva'];
              const currentMode = stateManager.getState().steerMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              console.log(`[AÇÃO] Alterando Modo de Direcao de '${currentMode}' para '${newMode}'`);
              setState('steerMode', newMode);
          } else if (currentState.focusedMenuItem === 'option_7') {
              const modes = ['Normal', 'Média', 'Alta'];
              const currentMode = stateManager.getState().regenMode;
              const currentIndex = modes.indexOf(currentMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              const newMode = modes[nextIndex];
              console.log(`[AÇÃO] Alterando Modo de Regeneracao '${currentMode}' para '${newMode}'`);
              setState('regenMode', newMode);
          }
      }
  }

  else if (currentScreen === 'ac_control') {
      const focusedArea = currentState.focusArea;

      if (e.key === 'Enter') {
          const controls = focusableAreas.ac_control;
          const currentIndex = controls.indexOf(focusedArea);
          const nextIndex = (currentIndex + 1) % controls.length;
          console.log(`[AÇÃO] Alternando foco de '${focusedArea}' para '${controls[nextIndex]}'`);
          window.focus(controls[nextIndex]);
      }

      switch (focusedArea) {
          case 'fan':
              const currentFan = parseInt(currentState.fan, 10) || 0;
              if (e.key === 'ArrowUp' && currentFan < 7) {
                  window.control('fan', String(currentFan + 1));
              } else if (e.key === 'ArrowDown' && currentFan > 0) {
                  window.control('fan', String(currentFan - 1));
              }
              break;

          case 'temp':
              const currentTemp = parseFloat(currentState.temp) || 21.0;
              if (e.key === 'ArrowUp' && currentTemp < 30.0) {
                  window.control('temp', (currentTemp + 0.5).toFixed(1));
              } else if (e.key === 'ArrowDown' && currentTemp > 16.0) {
                  window.control('temp', (currentTemp - 0.5).toFixed(1));
              }
              break;

          case 'power':
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                   const newPowerState = currentState.power === '0' ? '1' : '0';
                   window.control('power', newPowerState);
              }
              break;
      }
  }
});