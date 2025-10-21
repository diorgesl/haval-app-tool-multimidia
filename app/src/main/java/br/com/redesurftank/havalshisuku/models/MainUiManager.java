package br.com.redesurftank.havalshisuku.models;

import android.content.SharedPreferences;
import android.view.KeyEvent;

import java.util.Arrays;
import java.util.List;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.screens.AcControl;
import br.com.redesurftank.havalshisuku.models.screens.MainMenu;
import br.com.redesurftank.havalshisuku.models.screens.Screen;

public class MainUiManager {

    // These fields are not declared in the original file. I'm declaring them here to make the code compile.
    private SharedPreferences sharedPreferences;

    // Instância única (Singleton)
    private static volatile MainUiManager INSTANCE;

    // Estado atual da tela (MainMenu ou um sub-menu)
    private Screen currentScreen;

    // Construtor privado para prevenir instanciação externa
    private MainUiManager() {
        // Inicializa o estado com a tela do menu principal
        this.currentScreen = new MainMenu();
        this.sharedPreferences = ServiceManager.getInstance().getSharedPreferences();
        this.updateScreen();
    }

    public void updateScreen() {
        this.currentScreen.initialize(this.currentScreen, ServiceManager.getInstance());
        if (sharedPreferences != null) sharedPreferences.edit().putString(SharedPreferencesKeys.LAST_CLUSTER_SCREEN.getKey(), this.currentScreen.getJsName()).apply();
    }

    public void updateScreen(Screen newScreen) {
        this.currentScreen = newScreen;
        updateScreen();
    }

    public static MainUiManager getInstance() {
        if (INSTANCE == null) {
            synchronized (MainUiManager.class) {
                if (INSTANCE == null) {
                    INSTANCE = new MainUiManager();
                }
            }
        }
        return INSTANCE;
    }



    public void handleGeneralKeyEvents(Screen.Key key) {
        this.currentScreen.processKey(key);
    }

}
