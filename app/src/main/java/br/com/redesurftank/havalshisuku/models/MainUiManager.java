package br.com.redesurftank.havalshisuku.models;

import android.content.SharedPreferences;
import android.view.KeyEvent;

import java.util.Arrays;
import java.util.List;

import br.com.redesurftank.havalshisuku.models.screens.AcControl;
import br.com.redesurftank.havalshisuku.models.screens.MainMenu;
import br.com.redesurftank.havalshisuku.models.screens.Screen;

public class MainUiManager {

    public static final int SCREEN_ID_MAIN_MENU = 0;

    // These fields are not declared in the original file. I'm declaring them here to make the code compile.
    private SharedPreferences sharedPreferences;
    private int currentScreenId = SCREEN_ID_MAIN_MENU;
    private int currentMenuItemIndex = 0;

    public void switchScreen(Screen actualScreen, Screen newScreen) {

    }

    public void goToPreviousScreen() {

    }


    // Instância única (Singleton)
    private static volatile MainUiManager INSTANCE;

    // Estado atual da tela (MainMenu ou um sub-menu)
    private Screen currentScreen;

    // Construtor privado para prevenir instanciação externa
    private MainUiManager() {
        // Inicializa o estado com a tela do menu principal
        this.currentScreen = new MainMenu();
        this.currentScreen.initialize(this.currentScreen);
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

    public Screen getCurrentScreen() { return currentScreen; }


    // These methods are not declared in the original file. I'm declaring them here to make the code compile.
    private void dispatchServiceManagerEvent(ServiceManagerEventType event, Object data) {}


    // Enum for service manager event types
    private enum ServiceManagerEventType {
        STEERING_WHEEL_AC_CONTROL,
        MENU_ITEM_NAVIGATION,
        SHOW_SCREEN
    }


    // Interface base para as ações do menu
    public interface MenuAction {
        // Ação para navegar para outra tela
        class NavigateTo implements MenuAction {
            private final Screen screen;
            public NavigateTo(Screen screen) { this.screen = screen; }
            public Screen getScreen() { return screen; }
        }

        // Ação para ciclar entre valores
        class CycleValues implements MenuAction {
            private final List<String> options;
            private int currentOptionIndex;

            public CycleValues(List<String> options) {
                this.options = options;
                this.currentOptionIndex = 0;
            }

            public List<String> getOptions() { return options; }
            public int getCurrentOptionIndex() { return currentOptionIndex; }
            public void setCurrentOptionIndex(int index) { this.currentOptionIndex = index; }
        }
    }

    // Classe para um item de menu
    public static class MenuItem {
        public static final String MENU_ID_ESP = "option_1";
        public static final String MENU_ID_PROFILES = "option_2";
        public static final String MENU_ID_AC_CONTROL = "option_3";
        public static final String MENU_ID_DRIVING_MODE = "option_4";
        public static final String MENU_ID_STEER_MODE = "option_5";
        public static final String MENU_ID_REGENERATION_MODE = "option_6";
        private final String id;
        private final MenuAction action;

        public MenuItem(String id, MenuAction action) {
            this.id = id;
            this.action = action;
        }

        public String getId() { return id; }
        public MenuAction getAction() { return action; }
    }

    public void handleGeneralKeyEvents(KeyEvent keyEvent) {
        Screen.Key key;
        switch (keyEvent.getKeyCode()) {
            case 1024: key = Screen.Key.UP; break;
            case 1025: key = Screen.Key.DOWN; break;
            case 1028: key = Screen.Key.ENTER; break;
            case 1030: key = Screen.Key.BACK; break;
            case 1039: key = Screen.Key.BACK_LONG; break;
            default: return;
        }
        this.currentScreen.processKey(key);
    }

}
