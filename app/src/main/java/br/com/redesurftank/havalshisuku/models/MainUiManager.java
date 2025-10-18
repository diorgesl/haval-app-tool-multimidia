package br.com.redesurftank.havalshisuku.models;

import android.view.KeyEvent;

import java.util.Arrays;
import java.util.List;


public class MainUiManager {

    public static final int SCREEN_ID_MAIN_MENU = 0;
    public static final int SCREEN_ID_AC_CONTROL = 1;

    public static final List<MenuItem> menuItems = Arrays.asList(
            new MenuItem(
                    MenuItem.MENU_ID_ESP,
                    new MenuAction.CycleValues(Arrays.asList("ON", "OFF"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_PROFILES,
                    new MenuAction.CycleValues(Arrays.asList("Normal", "Eco", "Sport"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_AC_CONTROL,
                    new MenuAction.NavigateTo(new Screen.AcControl())
            ),
            new MenuItem(
                    MenuItem.MENU_ID_DRIVING_MODE,
                    new MenuAction.CycleValues(Arrays.asList("Normal", "Leve", "Pesado"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_STEER_MODE,
                    new MenuAction.CycleValues(Arrays.asList("Marcelo", "Convidado"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_REGENERATION_MODE,
                    new MenuAction.CycleValues(Arrays.asList("Azul", "Vermelho", "Verde", "Roxo"))
            )
    );

    // Instância única (Singleton)
    private static volatile MainUiManager INSTANCE;

    // Estado atual da tela (MainMenu ou um sub-menu)
    private Screen currentScreen;

    // Construtor privado para prevenir instanciação externa
    private MainUiManager() {
        // Inicializa o estado com a tela do menu principal
        this.currentScreen = createInitialMainMenuState();
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
    private MainUiManager.Screen.MainMenu createInitialMainMenuState() {
        return new MainUiManager.Screen.MainMenu(0, menuItems);
    }

    public void handleGeneralKeyEvents(KeyEvent keyEvent) {
        // Manages key events during AC control screen
        if (currentScreen.getID() == SCREEN_ID_AC_CONTROL) {

            switch (keyEvent.getKeyCode()) {
                case 1028: // Enter
                    steeringWheelAcControlTypeIndex++;
                    steeringWheelAcControlTypeIndex = steeringWheelAcControlTypeIndex % SteeringWheelAcControlType.values().length;
                    steeringWheelAcControlType = SteeringWheelAcControlType.values()[steeringWheelAcControlTypeIndex];
                    dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
                    sharedPreferences.edit().putString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), steeringWheelAcControlType.name()).apply();
                    break;
                case 1024: // Up & Down
                case 1025: {
                    switch (steeringWheelAcControlType) {
                        case TEMPERATURE: {
                            var currentTemperature = getUpdatedData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue());
                            if (currentTemperature != null) {
                                float temperature = Float.parseFloat(currentTemperature);
                                if (keyEvent.getKeyCode() == 1024) {
                                    temperature += 0.5f;
                                    if (temperature > 30.0f)
                                        temperature = 30.0f;
                                } else {
                                    temperature -= 0.5f;
                                    if (temperature < 16.0f)
                                        temperature = 16.0f;
                                }
                                updateData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue(), String.valueOf(temperature));
                            }
                        }
                        break;
                        case FAN_SPEED: {
                            var currentFanSpeed = getUpdatedData(CarConstants.CAR_HVAC_FAN_SPEED.getValue());
                            if (currentFanSpeed != null) {
                                int speed = Integer.parseInt(currentFanSpeed);
                                if (keyEvent.getKeyCode() == 1024) {
                                    speed++;
                                    if (speed > 7)
                                        speed = 7;
                                } else {
                                    speed--;
                                    if (speed < 1)
                                        speed = 1;
                                }
                                updateData(CarConstants.CAR_HVAC_FAN_SPEED.getValue(), String.valueOf(speed));
                            }
                        }
                        break;
                        case POWER: {
                            var currentPowerMode = getUpdatedData(CarConstants.CAR_HVAC_POWER_MODE.getValue());
                            if (currentPowerMode != null) {
                                boolean powerMode = currentPowerMode.equals("1");
                                powerMode = !powerMode;
                                updateData(CarConstants.CAR_HVAC_POWER_MODE.getValue(), powerMode ? "1" : "0");
                            }
                        }
                    }
                }
                break;
                case 1030: { // Return button
                    var currentCycleMode = getUpdatedData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue());
                    if (currentCycleMode != null) {
                        boolean cycleMode = currentCycleMode.equals("1");
                        cycleMode = !cycleMode;
                        updateData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue(), cycleMode ? "1" : "0");
                    }
                }
                break;
                case 1039: { // Return long press
                    /* var currentAcAutoMode = getUpdatedData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue());
                    if (currentAcAutoMode != null) {
                        boolean acAutoMode = currentAcAutoMode.equals("1");
                        acAutoMode = !acAutoMode;
                        updateData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue(), acAutoMode ? "1" : "0");
                    } */
                    currentScreenId = MainUiManager.SCREEN_ID_MAIN_MENU;
                    dispatchServiceManagerEvent(ServiceManagerEventType.SHOW_SCREEN, currentScreenId);
                }
                break;
            }

            // Manages key events during main menu screen
        } else if (currentScreenId == MainUiManager.SCREEN_ID_MAIN_MENU) {

            switch (keyEvent.getKeyCode()) {
                case 1024: // Up
                    currentMenuItemIndex--;
                    if (currentMenuItemIndex < 0) {
                        currentMenuItemIndex = menuItems.length - 1;
                    }
                    dispatchServiceManagerEvent(ServiceManagerEventType.MENU_ITEM_NAVIGATION, currentMenuItemIndex);
                    break;

                case 1025: // Down
                    currentMenuItemIndex++;
                    currentMenuItemIndex = currentMenuItemIndex % menuItems.length;
                    dispatchServiceManagerEvent(ServiceManagerEventType.MENU_ITEM_NAVIGATION, currentMenuItemIndex);
                    break;

                case 1028: // Enter
                    if (currentMenuItemIndex == 1) {
                        currentScreenId = MainUiManager.SCREEN_ID_AC_CONTROL;
                        dispatchServiceManagerEvent(ServiceManagerEventType.SHOW_SCREEN, currentScreenId);
                    }
                    break;
            }
        }
    }

    public interface Screen {
        static final int id = 0;
        static final String jsname = "";
        public int getID();
        public String getJsName();

        class AcControl implements Screen {
            public int getID() { return SCREEN_ID_AC_CONTROL; }
            public String getJsName() { return "ac_control"; }
        }

        class MainMenu implements Screen {
            public int getID() { return SCREEN_ID_MAIN_MENU; }
            public String getJsName() { return "main_menu"; }

            private int focusedItemIndex;
            private List<MenuItem> menuItems;

            public MainMenu(int focusedItemIndex, List<MenuItem> menuItems) {
                this.focusedItemIndex = focusedItemIndex;
                this.menuItems = menuItems;
            }

            public int getFocusedItemIndex() { return focusedItemIndex; }
            public List<MenuItem> getMenuItems() { return menuItems; }

            public void setFocusedItemIndex(int index) { this.focusedItemIndex = index; }
            public void setMenuItems(List<MenuItem> items) { this.menuItems = items; }
        }
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

}
