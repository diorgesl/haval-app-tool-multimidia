package br.com.redesurftank.havalshisuku.models.screens;

import static br.com.redesurftank.havalshisuku.models.screens.Screen.Key.BACK;
import static br.com.redesurftank.havalshisuku.models.screens.Screen.Key.BACK_LONG;

import java.util.Arrays;
import java.util.Objects;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.CarConstants;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys;
import br.com.redesurftank.havalshisuku.models.SteeringWheelAcControlType;

public class DoomScreen implements Screen {

    private ServiceManager serviceManager;
    private Screen previousScreen = this;

    @Override
    public String getJsName() {
        return "doom";
    }

    @Override
    public void processKey(Key key) {
        switch (key) {
            case BACK:
                MainUiManager.getInstance().updateScreen(previousScreen);
        }
    }

    @Override
    public void initialize() {
        this.serviceManager = ServiceManager.getInstance();

        // Forces AC screen to be displayed
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.UPDATE_SCREEN,this);

    }


    @Override
    public void setReturnScreen(Screen previousScreen) {
        this.previousScreen = previousScreen;
    }


}
