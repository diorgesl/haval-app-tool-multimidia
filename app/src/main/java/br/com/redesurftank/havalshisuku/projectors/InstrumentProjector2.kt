package br.com.redesurftank.havalshisuku.projectors

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.Outline
import android.os.Bundle
import android.view.Display
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.isVisible
import br.com.redesurftank.App
import br.com.redesurftank.havalshisuku.R
import br.com.redesurftank.havalshisuku.managers.ServiceManager
import br.com.redesurftank.havalshisuku.models.CarConstants
import br.com.redesurftank.havalshisuku.models.ServiceManagerEventType
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys
import br.com.redesurftank.havalshisuku.models.SteeringWheelAcControlType
import br.com.redesurftank.havalshisuku.models.MainUiManager
import br.com.redesurftank.havalshisuku.models.screens.Screen

class InstrumentProjector2(outerContext: Context, display: Display) : BaseProjector(outerContext, display) {
    private val preferences: SharedPreferences = App.getDeviceProtectedContext().getSharedPreferences("haval_prefs", Context.MODE_PRIVATE)
    private var webView: WebView? = null
    private val webViewsLoaded = mutableMapOf<WebView, Boolean>()
    private val pendingJsQueues = mutableMapOf<WebView, MutableList<String>>()
    private lateinit var root: FrameLayout;

    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key in listOf(
                SharedPreferencesKeys.ENABLE_INSTRUMENT_CUSTOM_MEDIA_INTEGRATION.key,
                SharedPreferencesKeys.ENABLE_INSTRUMENT_PROJECTOR.key
            )
        ) {
            ensureUi {
                root.isVisible = shouldShowProjector() && ServiceManager.getInstance().isMainScreenOn
            }
        }
    }

    private var currentScreen = MainUiManager.SCREEN_ID_MAIN_MENU // Start from the Main Menu screen
    private var focusedMainMenuItem = MainMenuItem.OPTION_1 // Starts with first option highlighted

    private fun shouldShowProjector(): Boolean {
        return preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_PROJECTOR.key, false) && preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_CUSTOM_MEDIA_INTEGRATION.key, false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        preferences.registerOnSharedPreferenceChangeListener(prefsListener)
        WebView.setWebContentsDebuggingEnabled(true)
        window?.setBackgroundDrawable(Color.TRANSPARENT.toDrawable())
        window?.addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)
        window?.addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)

        root = FrameLayout(context)
        setContentView(root)

        val radius = 226
        val centerX = 1630
        val centerY = 430

        val circularView = FrameLayout(context)
        val params = FrameLayout.LayoutParams(radius * 2, radius * 2)
        params.leftMargin = centerX - radius
        params.topMargin = centerY - radius
        circularView.layoutParams = params
        circularView.setBackgroundColor(Color.TRANSPARENT)
        circularView.clipToOutline = true
        circularView.outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setOval(0, 0, view.width, view.height)
            }
        }
        root.addView(circularView)
        circularView.isVisible = false
        setupAcControlView(circularView)

        ServiceManager.getInstance().addDataChangedListener { key, value ->
            ensureUi {
                when (key) {
                    CarConstants.CAR_HVAC_FAN_SPEED.value -> {
                        evaluateJsIfReady(webView, "control('fan', $value)")
                    }

                    CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.value -> {
                        evaluateJsIfReady(webView, "control('temp', $value)")
                    }

                    CarConstants.CAR_HVAC_POWER_MODE.value -> {
                        evaluateJsIfReady(webView, "control('power', $value)")
                    }

                    CarConstants.CAR_HVAC_CYCLE_MODE.value -> {
                        evaluateJsIfReady(webView, "control('recycle', $value)")
                    }

                    CarConstants.CAR_HVAC_AUTO_ENABLE.value -> {
                        evaluateJsIfReady(webView, "control('auto', $value)")
                    }

                    CarConstants.CAR_HVAC_ANION_ENABLE.value -> {
                        evaluateJsIfReady(webView, "control('aion', $value)")
                    }

                    CarConstants.CAR_DRIVE_SETTING_ESP_ENABLE.value -> {
                        evaluateJsIfReady(webView, "control('espStatus', $value")
                    }

                    CarConstants.CAR_EV_SETTING_POWER_MODEL_CONFIG.value -> {
                        evaluateJsIfReady(webView, "control('evMode', $value)")
                    }

                    CarConstants.CAR_DRIVE_SETTING_DRIVE_MODE.value -> {
                        evaluateJsIfReady(webView, "control('drivingMode', $value)")
                    }

                    CarConstants.CAR_DRIVE_SETTING_STEERING_WHEEL_ASSIST_MODE.value -> {
                        evaluateJsIfReady(webView, "control('steerMode', $value)")
                    }

                    CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL.value -> {
                        evaluateJsIfReady(webView, "control('regenMode', $value)")
                    }


                    else -> {}
                }
            }
        }

        ServiceManager.getInstance().addServiceManagerEventListener { event, args ->
            ensureUi {
                when (event) {
                    ServiceManagerEventType.CLUSTER_CARD_CHANGED -> {
                        val card = args[0] as Int
                        circularView.isVisible = card != 0
                        webView?.isVisible = false;
                        when (card) {
                            1 -> {
                                showWebView()
                            }

                            else -> {

                            }
                        }
                    }

                    ServiceManagerEventType.STEERING_WHEEL_AC_CONTROL -> {
                        when (args[0] as SteeringWheelAcControlType) {
                            SteeringWheelAcControlType.FAN_SPEED -> {
                                evaluateJsIfReady(webView, "focus('fan')")
                            }


                            SteeringWheelAcControlType.TEMPERATURE -> {
                                evaluateJsIfReady(webView, "focus('temp')")
                            }

                            SteeringWheelAcControlType.POWER -> {
                                evaluateJsIfReady(webView, "focus('power')")
                            }
                        }
                    }

                    ServiceManagerEventType.MENU_ITEM_NAVIGATION -> {
                        val item = args[0] as String
                        evaluateJsIfReady(webView, "focus('$item')")
                    }

                    ServiceManagerEventType.UPDATE_SCREEN -> {
                        val screen = args[0] as Screen
                        evaluateJsIfReady(webView, "focus('${screen.jsName}')")
                    }

                }
            }


        }

        root.isVisible = shouldShowProjector() && ServiceManager.getInstance().isMainScreenOn
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupAcControlView(circularView: FrameLayout) {
        if (webView == null) {
            webView = WebView(context).apply {
                layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowContentAccess = true
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        view?.let {
                            webViewsLoaded[it] = true
                            updateValuesWebView()
                            val queue = pendingJsQueues[it] ?: return
                            queue.forEach { js -> it.evaluateJavascript(js, null) }
                            pendingJsQueues.remove(it)
                        }
                    }
                }
                loadDataWithBaseURL(null, readRawHtml(context), "text/html", "UTF-8", null)
            }
            circularView.addView(webView)
            webView?.isVisible = false;
        }
    }

    private fun showWebView() {
        webView?.isVisible = true
        webView?.let {
            if (webViewsLoaded[it] == true) {
                updateValuesWebView()
            }
        }
    }

    private fun updateValuesWebView() {
        val currentTemp = ServiceManager.getInstance().getData(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE.value)
        val currentFanSpeed = ServiceManager.getInstance().getData(CarConstants.CAR_HVAC_FAN_SPEED.value)
        val currentAcState = ServiceManager.getInstance().getData(CarConstants.CAR_HVAC_POWER_MODE.value)
        val currentRecycleMode = ServiceManager.getInstance().getData(CarConstants.CAR_HVAC_CYCLE_MODE.value)
        val currentAutoMode = ServiceManager.getInstance().getData(CarConstants.CAR_HVAC_AUTO_ENABLE.value)

        evaluateJsIfReady(webView, "control('temp', $currentTemp)")
        evaluateJsIfReady(webView, "control('fan', $currentFanSpeed)")
        evaluateJsIfReady(webView, "control('power', $currentAcState)")
        evaluateJsIfReady(webView, "control('recycle', $currentRecycleMode)")
        evaluateJsIfReady(webView, "control('auto', $currentAutoMode)")
        evaluateJsIfReady(webView, "focus('fan')")
    }

    private fun evaluateJsIfReady(webView: WebView?, js: String) {
        if (webView == null) return
        val loaded = webViewsLoaded.getOrDefault(webView, false)
        if (loaded) {
            webView.evaluateJavascript(js, null)
        } else {
            pendingJsQueues.getOrPut(webView) { mutableListOf() }.add(js)
        }
    }

    fun readRawHtml(context: Context): String {
        return context.resources.openRawResource(R.raw.app).bufferedReader().use { it.readText() }
    }

    override fun carMainScreenOff() {
        ensureUi {
            root.isVisible = false;
        }
    }

    override fun carMainScreenOn() {
        ensureUi {
            root.isVisible = true;
        }
    }

    private fun focusMainMenuItem(item: MainMenuItem) {
        focusedMainMenuItem = item
        // O JS espera o nome em minúsculo: "option_1", "option_2", etc.
        evaluateJsIfReady(webView, "focusMainMenuItem('${item.name.lowercase()}')")
    }

    private fun handleMainMenuKey(control: SteeringWheelAcControlType) {
        val items = MainMenuItem.values()
        val currentIndex = items.indexOf(focusedMainMenuItem)

        when (control) {
            SteeringWheelAcControlType.FAN_SPEED -> { // Mapeado para DOWN
                val nextIndex = (currentIndex + 1) % items.size
                focusMainMenuItem(items[nextIndex])
            }
            SteeringWheelAcControlType.TEMPERATURE -> { // Mapeado para UP
                val nextIndex = if (currentIndex - 1 < 0) items.size - 1 else currentIndex - 1
                focusMainMenuItem(items[nextIndex])
            }
            SteeringWheelAcControlType.POWER -> { // Mapeado para OK
                when (focusedMainMenuItem) {
                    MainMenuItem.OPTION_2 -> {
                        // Mudar para a tela do ar condicionado
                        //currentScreen = MainUiManager.SCREEN_ID_AC_CONTROL
                        evaluateJsIfReady(webView, "showScreen('ac_control')")
                        // Foca um item padrão do AC e atualiza os valores
                        showWebView()
                    }
                    else -> {
                        // Ação para outras opções do menu
                    }
                }
            }
        }
    }

    private fun handleAcControlKey(control: SteeringWheelAcControlType) {
        // Esta é a lógica que você já tinha, mas agora em sua própria função.
        when (control) {
            SteeringWheelAcControlType.FAN_SPEED -> {
                evaluateJsIfReady(webView, "focus('fan')")
            }
            SteeringWheelAcControlType.TEMPERATURE -> {
                evaluateJsIfReady(webView, "focus('temp')")
            }
            SteeringWheelAcControlType.POWER -> {
                evaluateJsIfReady(webView, "focus('power')")
                // Aqui você pode adicionar lógica para, por exemplo,
                // voltar ao menu principal se a tecla POWER for pressionada novamente.
            }
        }
        // Você precisará adicionar a lógica de "entrar em modo de edição" e
        // "mudar valor com up/down" que discutimos anteriormente.
        // O seu enum atual não parece distinguir entre "focar" e "mudar valor".
    }

}

// Define os itens do nosso novo menu principal
enum class MainMenuItem(val displayName: String) {
    OPTION_1("Opção 1"),
    OPTION_2("Opção 2 (Ar Condicionado)"),
    OPTION_3("Opção 3"),
    OPTION_4("Opção 4"),
    OPTION_5("Opção 5");
}