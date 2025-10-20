package br.com.redesurftank.havalshisuku.models.screens;

import java.util.Arrays;
import java.util.List;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.MainUiManager.MenuItem;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;

import static br.com.redesurftank.havalshisuku.models.MainUiManager.SCREEN_ID_MAIN_MENU;

public class MainMenu implements Screen {
    private int focusedItemIndex;
    private Screen previousScreen;
    private int currentMenuItemIndex = 0;

    private static final List<MenuItem> menuItems = Arrays.asList(
            new MenuItem(
                    MenuItem.MENU_ID_ESP,
                    new MainUiManager.MenuAction.CycleValues(Arrays.asList("ON", "OFF"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_PROFILES,
                    new MainUiManager.MenuAction.CycleValues(Arrays.asList("Normal", "Eco", "Sport"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_AC_CONTROL,
                    new MainUiManager.MenuAction.NavigateTo(new AcControl())
            ),
            new MenuItem(
                    MenuItem.MENU_ID_DRIVING_MODE,
                    new MainUiManager.MenuAction.CycleValues(Arrays.asList("Normal", "Eco", "Sport"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_STEER_MODE,
                    new MainUiManager.MenuAction.CycleValues(Arrays.asList("Normal", "Leve", "Pesado"))
            ),
            new MenuItem(
                    MenuItem.MENU_ID_REGENERATION_MODE,
                    new MainUiManager.MenuAction.CycleValues(Arrays.asList("Baixa", "Normal", "Alta"))
            )
    );

    @Override
    public String getJsName() {
        return "main_menu";
    }


    @Override
    public void initialize(Screen previousScreen) {

    }

    @Override
    public Screen getPreviousScreen() {
        return this;
    }

    public int getFocusedItemIndex() {
        return focusedItemIndex;
    }

    public List<MenuItem> getMenuItems() {
        return menuItems;
    }

    public void setFocusedItemIndex(int index) {
        this.focusedItemIndex = index;
    }

    public MenuItem getFocusedItem() {
        return menuItems.get(focusedItemIndex);
    }

    public void processKey(Key key) {
        switch (key) {
            case UP: // Up
                currentMenuItemIndex--;
                if (currentMenuItemIndex < 0) {
                    currentMenuItemIndex = menuItems.size() - 1;
                }
                ServiceManager.getInstance().dispatchServiceManagerEvent(ServiceManagerEventType.MENU_ITEM_NAVIGATION, currentMenuItemIndex);
                break;

            case DOWN: // Down
                currentMenuItemIndex++;
                currentMenuItemIndex = currentMenuItemIndex % menuItems.size();
                ServiceManager.getInstance().dispatchServiceManagerEvent(ServiceManagerEventType.MENU_ITEM_NAVIGATION, currentMenuItemIndex);
                break;

            case ENTER: // Enter
                if (currentMenuItemIndex == 2) { // Index of AC_CONTROL
                    //MainUiManager.getInstance().switchScreen(this.getMenuItems().get(2).);
                    //ServiceManager.getInstance().dispatchServiceManagerEvent(ServiceManagerEventType.SHOW_SCREEN, currentScreenId);
                }
                break;
        }

    }
}
