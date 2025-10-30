package br.com.redesurftank.havalshisuku.models.screens;

import android.util.Log;

import java.util.Arrays;
import java.util.Objects;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.CarConstants;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys;
import br.com.redesurftank.havalshisuku.models.SteeringWheelAcControlType;


public class RegenScreen implements Screen {

    private static final String TAG = "RegenScreen";


    public static class RegenOptions {
        public static final int NORMAL = 2;
        public static final int MEDIUM = 0;
        public static final int HIGH = 1;
        public static final String REGEN_GRAPH_STATE_NAME = "lastRegenValue";

        public static String getLabel(String value) {
            int val = Integer.parseInt(value);
            switch (val) {
                case 2: return "'Normal'";
                case 0: return "'Media'";
                case 1: return "'Alta'";
            }
            return "";
        }
    }
    private static final int[] regenValueMap = {RegenOptions.NORMAL, RegenOptions.MEDIUM, RegenOptions.HIGH};
    private int currentRegenIndex = 0;

    private ServiceManager serviceManager;
    private Screen previousScreen = this;

    @Override
    public String getJsName() {
        return "regen";
    }

    @Override
    public void processKey(Key key) {
        switch (key) {
            case ENTER: // Enter
                currentRegenIndex = 1;
                break;
            case UP:
                if (currentRegenIndex < regenValueMap.length - 1) currentRegenIndex++;
                break;
            case DOWN:
                if (currentRegenIndex > 0) currentRegenIndex--;
                break;
            case BACK:
                MainUiManager.getInstance().updateScreen(previousScreen);
                break;
            case BACK_LONG:
                MainUiManager.getInstance().updateScreen(previousScreen);
                break;
        }

        String valueToSend = Integer.toString(regenValueMap[currentRegenIndex]);
        serviceManager.updateData(CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL.getValue(), valueToSend);
        Log.i(TAG, "Regen state set to value: " + valueToSend);

    }

    @Override
    public void initialize() {
        this.serviceManager = ServiceManager.getInstance();
        String fromCar = ServiceManager.getInstance().getData(CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL.getValue());
        this.currentRegenIndex = findIndexFromValue(Integer.parseInt(fromCar));
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.UPDATE_SCREEN,this);
    }

    public int findIndexFromValue(int carValue) {
        for (int i = 0; i < regenValueMap.length; i++) {
            if (regenValueMap[i] == carValue) {
                return i;
            }
        }
        return 0;
    }

    @Override
    public void setReturnScreen(Screen previousScreen) {
        this.previousScreen = previousScreen;
    }


}
