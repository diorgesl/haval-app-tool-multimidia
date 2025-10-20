package br.com.redesurftank.havalshisuku.models.screens;

import br.com.redesurftank.havalshisuku.models.MainUiManager;
import android.content.SharedPreferences;

public class AcControl implements Screen {

    private Screen previousScreen;
    private int steeringWheelAcControlTypeIndex = 0;
    private SteeringWheelAcControlType steeringWheelAcControlType = SteeringWheelAcControlType.TEMPERATURE;

    // TODO: Check this afterwards, as seems wrong
    private SharedPreferences sharedPreferences;
    private String getUpdatedData(String key) { return null;}
    private void updateData(String key, String value) {}
    private void dispatchServiceManagerEvent(ServiceManagerEventType event, Object data) {}

    @Override
    public String getJsName() {
        return "ac_control";
    }

    @Override
    public void processKey(Key key) {
        switch (key) {
            case ENTER: // Enter
                steeringWheelAcControlTypeIndex++;
                steeringWheelAcControlTypeIndex = steeringWheelAcControlTypeIndex % SteeringWheelAcControlType.values().length;
                steeringWheelAcControlType = SteeringWheelAcControlType.values()[steeringWheelAcControlTypeIndex];
                dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
                sharedPreferences.edit().putString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), steeringWheelAcControlType.name()).apply();
                break;
            case UP: // Up & Down
            case DOWN: {
                switch (steeringWheelAcControlType) {
                    case TEMPERATURE: {
                        var currentTemperature = getUpdatedData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue());
                        if (currentTemperature != null) {
                            float temperature = Float.parseFloat(currentTemperature);
                            if (key == Key.UP) {
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
                            if (key == Key.UP) {
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
            case BACK: { // Return button
                var currentCycleMode = getUpdatedData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue());
                if (currentCycleMode != null) {
                    boolean cycleMode = currentCycleMode.equals("1");
                    cycleMode = !cycleMode;
                    updateData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue(), cycleMode ? "1" : "0");
                }
            }
            break;
            case BACK_LONG: { // Return long press
                    /* var currentAcAutoMode = getUpdatedData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue());
                    if (currentAcAutoMode != null) {
                        boolean acAutoMode = currentAcAutoMode.equals("1");
                        acAutoMode = !acAutoMode;
                        updateData(CarConstants.CAR_HVAC_AUTO_ENABLE.getValue(), acAutoMode ? "1" : "0");
                    } */
                //currentScreenId = MainUiManager.SCREEN_ID_MAIN_MENU;
                //dispatchServiceManagerEvent(ServiceManagerEventType.SHOW_SCREEN, currentScreenId);
            }
            break;
        }

    }

    @Override
    public void initialize(Screen previousScreen) {
        this.previousScreen = previousScreen;
    }

    @Override
    public Screen getPreviousScreen() {
        return previousScreen;
    }

    // Enum for service manager event types
    private enum ServiceManagerEventType {
        STEERING_WHEEL_AC_CONTROL,
        MENU_ITEM_NAVIGATION,
        SHOW_SCREEN
    }

    // Enum for Car constants
    private enum CarConstants {
        CAR_HVAC_DRIVER_TEMPERATURE("car_hvac_driver_temperature"),
        CAR_HVAC_FAN_SPEED("car_hvac_fan_speed"),
        CAR_HVAC_POWER_MODE("car_hvac_power_mode"),
        CAR_HVAC_CYCLE_MODE("car_hvac_cycle_mode");

        private final String value;
        CarConstants(String value) {
            this.value = value;
        }
        public String getValue() {
            return value;
        }
    }

    // Enum for steering wheel AC control types
    private enum SteeringWheelAcControlType {
        TEMPERATURE,
        FAN_SPEED,
        POWER
    }
    // Enum for SharedPreferences keys
    private enum SharedPreferencesKeys {
        LAST_CLUSTER_AC_CONFIG("last_cluster_ac_config");
        private final String key;
        SharedPreferencesKeys(String key) {
            this.key = key;
        }
        public String getKey() {
            return key;
        }
    }

}
