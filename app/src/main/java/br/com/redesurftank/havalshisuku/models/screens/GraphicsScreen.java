package br.com.redesurftank.havalshisuku.models.screens;

import android.util.Log;

import br.com.redesurftank.havalshisuku.managers.ServiceManager;
import br.com.redesurftank.havalshisuku.models.CarConstants;
import br.com.redesurftank.havalshisuku.models.MainUiManager;
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType;


public class GraphicsScreen implements Screen {

    private static final String TAG = "GraphicsScreen";

    private static final String[] graphsValueMap = {"evConsumption", "gasConsumption", "batteryPercentage"};
    private int currentGraphIndex = 0;

    private ServiceManager serviceManager;
    private Screen previousScreen = this;

    @Override
    public String getJsName() {
        return "graph";
    }

    @Override
    public void processKey(Key key) {
        switch (key) {
            case UP:
                if (currentGraphIndex < graphsValueMap.length - 1) currentGraphIndex++;
                break;
            case ENTER:
            case DOWN:
                if (currentGraphIndex > 0) currentGraphIndex--;
                break;
            case BACK:
                MainUiManager.getInstance().updateScreen(previousScreen);
                break;
            case BACK_LONG:
                MainUiManager.getInstance().updateScreen(previousScreen);
                break;
        }

        String valueToSend = graphsValueMap[currentGraphIndex];
        serviceManager.updateData(CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL.getValue(), valueToSend);
        Log.i(TAG, "Graph changed to screen: " + valueToSend);

    }

    @Override
    public void initialize() {
        this.serviceManager = ServiceManager.getInstance();
        //String fromCar = ServiceManager.getInstance().getData(CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL.getValue());
        //this.currentGraphIndex = findIndexFromValue(Integer.parseInt(fromCar));
        serviceManager.dispatchServiceManagerEvent(ServiceManagerEventType.UPDATE_SCREEN,this);
    }

    @Override
    public void setReturnScreen(Screen previousScreen) {
        this.previousScreen = previousScreen;
    }


}
