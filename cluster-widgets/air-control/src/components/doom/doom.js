
let dosboxInstance = null;

export function prepareGameScreen() {

      var main = document.createElement('main');
      main.className = 'doom main-container';

      const container = document.createElement('div');
      container.id = 'dosbox';
      main.appendChild(container);

      return main;

}

export function startGame() {

    if (dosboxInstance) {
        console.log("[DOOM.JS] Resuming game...");
        dosboxInstance.setPaused(false);
        return;
    }

    console.log("Iniciando dosbox...");


    dosboxInstance =  Dos(document.getElementById("dosbox"), {
            url: "./src/components/doom/doom.jsdos",
            autoStart: true,
            renderAspect: "1/1",
            setThinSidebar: true
    });

}

export function stopGame() {
    if (dosboxInstance) {
        console.log("[DOOM.JS] Quiting game.");
        dosboxInstance.stop();
        dosboxInstance = null;
    }
}