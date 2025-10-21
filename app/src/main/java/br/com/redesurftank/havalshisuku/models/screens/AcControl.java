package br.com.redesurftank.havalshisuku.models.screens;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.CarConstants;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys;
import br.com.redesurftank.havalshisuku.models.SteeringWheelAcControlType;

import android.content.SharedPreferences;

import java.util.Arrays;
import java.util.Objects;

public class AcControl implements Screen {

    private ServiceManager serviceManager;
    private Screen previousScreen;
    private int steeringWheelAcControlTypeIndex = 0;
    private SteeringWheelAcControlType steeringWheelAcControlType = SteeringWheelAcControlType.TEMPERATURE;

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
                serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
                serviceManager.getSharedPreferences().edit().putString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), steeringWheelAcControlType.name()).apply();
                break;
            case UP: // Up & Down
            case DOWN: {
                switch (steeringWheelAcControlType) {
                    case TEMPERATURE: {
                        var currentTemperature = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue());
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
                            serviceManager.updateData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.getValue(), String.valueOf(temperature));
                        }
                    }
                    break;
                    case FAN_SPEED: {
                        var currentFanSpeed = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_FAN_SPEED.getValue());
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
                            serviceManager.updateData(CarConstants.CAR_HVAC_FAN_SPEED.getValue(), String.valueOf(speed));
                        }
                    }
                    break;
                    case POWER: {
                        var currentPowerMode = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_POWER_MODE.getValue());
                        if (currentPowerMode != null) {
                            boolean powerMode = currentPowerMode.equals("1");
                            powerMode = !powerMode;
                            serviceManager.updateData(CarConstants.CAR_HVAC_POWER_MODE.getValue(), powerMode ? "1" : "0");
                        }
                    }
                }
            }
            break;
            case BACK: { // Return button
                MainUiManager.getInstance().updateScreen(previousScreen);
            }
            break;
            case BACK_LONG: { // Return long press
                var currentCycleMode = serviceManager.getUpdatedData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue());
                if (currentCycleMode != null) {
                    boolean cycleMode = currentCycleMode.equals("1");
                    cycleMode = !cycleMode;
                    serviceManager.updateData(CarConstants.CAR_HVAC_CYCLE_MODE.getValue(), cycleMode ? "1" : "0");
                }
                break;
            }
        }
    }

    @Override
    public void initialize(Screen previousScreen, ServiceManager serviceManager) {
        this.previousScreen = previousScreen;
        this.serviceManager = serviceManager;
        var lastAcConfig = this.serviceManager.getSharedPreferences().getString(SharedPreferencesKeys.LAST_CLUSTER_AC_CONFIG.getKey(), SteeringWheelAcControlType.FAN_SPEED.name());
        steeringWheelAcControlType = SteeringWheelAcControlType.valueOf(Objects.requireNonNullElse(lastAcConfig, SteeringWheelAcControlType.FAN_SPEED.name()));
        steeringWheelAcControlTypeIndex = Arrays.asList(SteeringWheelAcControlType.values()).indexOf(steeringWheelAcControlType);

        // Forces AC screen to be displayed
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.UPDATE_SCREEN,this);

        // Updates focus to latest focused item
        //serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL, steeringWheelAcControlType);
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
