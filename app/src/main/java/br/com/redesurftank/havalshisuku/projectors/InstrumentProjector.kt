package br.com.redesurftank.havalshisuku.projectors

import android.animation.ObjectAnimator
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.view.Display
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.RelativeLayout
import android.widget.TextView
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.isVisible
import br.com.redesurftank.App
import br.com.redesurftank.havalshisuku.listeners.IDataChanged
import br.com.redesurftank.havalshisuku.managers.ServiceManager
import br.com.redesurftank.havalshisuku.models.CarConstants
import br.com.redesurftank.havalshisuku.models.SharedPreferencesKeys
import java.util.concurrent.TimeUnit
import kotlin.properties.Delegates

class InstrumentProjector(outerContext: Context, display: Display) : BaseProjector(outerContext, display), IDataChanged {
    private val preferences: SharedPreferences = App.getDeviceProtectedContext().getSharedPreferences("haval_prefs", Context.MODE_PRIVATE)
    private val serviceManager: ServiceManager = ServiceManager.getInstance()

    private var currentKm: Int by Delegates.observable(serviceManager.totalOdometer) { _, _, _ ->
        ensureUi { updateView() }
    }

    private var infoTextView: TextView? = null
    private var blinkAnimator: ObjectAnimator? = null
    private lateinit var rootLayout: RelativeLayout

    // Rotating info state
    private var currentInfoIndex = 0
    private var activeInfoItems = mutableListOf<InfoItem>()

    // Cached car data
    private var evRangeKm: Int = 0
    private var fuelRangeKm: Int = 0
    private var avgFuelConsume: Float = 0f
    private var outsideTemp: Float = 0f
    private var insideTemp: Float = 0f
    private var tripOdometer: Float = 0f

    data class InfoItem(val text: String, val color: Int, val shouldBlink: Boolean = false)

    private val infoParams = RelativeLayout.LayoutParams(
        RelativeLayout.LayoutParams.WRAP_CONTENT,
        RelativeLayout.LayoutParams.WRAP_CONTENT
    ).apply {
        addRule(RelativeLayout.ALIGN_PARENT_BOTTOM)
        addRule(RelativeLayout.CENTER_HORIZONTAL)
        bottomMargin = 15
    }

    // Rotate info every 5 seconds
    private val rotateRunnable = object : Runnable {
        override fun run() {
            ensureUi { rotateInfo() }
            handler.postDelayed(this, 5000)
        }
    }

    // Update data every minute (for time-based calculations)
    private val timeUpdateRunnable = object : Runnable {
        override fun run() {
            ensureUi { rebuildInfoItems(); updateView() }
            handler.postDelayed(this, 60000)
        }
    }

    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        val watchedKeys = listOf(
            SharedPreferencesKeys.ENABLE_INSTRUMENT_REVISION_WARNING.key,
            SharedPreferencesKeys.INSTRUMENT_REVISION_INTERVAL.key,
            SharedPreferencesKeys.INSTRUMENT_REVISION_MODE.key,
            SharedPreferencesKeys.ENABLE_INSTRUMENT_AVG_CONSUME.key,
            SharedPreferencesKeys.ENABLE_INSTRUMENT_TEMPERATURE.key,
            SharedPreferencesKeys.ENABLE_INSTRUMENT_TRIP_ODOMETER.key
        )
        if (key in watchedKeys) {
            ensureUi { rebuildInfoItems(); updateView() }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window?.setBackgroundDrawable(Color.TRANSPARENT.toDrawable())
        window?.addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)

        rootLayout = RelativeLayout(context)
        rootLayout.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        )

        setContentView(rootLayout)

        serviceManager.addDataChangedListener(this)
        preferences.registerOnSharedPreferenceChangeListener(prefsListener)

        rebuildInfoItems()
        handler.post(timeUpdateRunnable)
        handler.postDelayed(rotateRunnable, 5000)

        ensureUi { updateView() }
        rootLayout.isVisible = ServiceManager.getInstance().isMainScreenOn
    }

    private fun rebuildInfoItems() {
        activeInfoItems.clear()

        // 1. Maintenance warning (auto or manual mode)
        if (preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_REVISION_WARNING.key, false)) {
            val mode = preferences.getString(SharedPreferencesKeys.INSTRUMENT_REVISION_MODE.key, "auto") ?: "auto"
            var remainingKm: Int
            var serviceLabel: String

            if (mode == "auto") {
                val interval = preferences.getInt(SharedPreferencesKeys.INSTRUMENT_REVISION_INTERVAL.key, 12000)
                val serviceNumber = if (interval > 0) currentKm / interval else 0
                val nextServiceKm = (serviceNumber + 1) * interval
                remainingKm = nextServiceKm - currentKm
                serviceLabel = "🔧 Revisão ${serviceNumber + 1}: $remainingKm km restantes"
            } else {
                val nextKm = preferences.getInt(SharedPreferencesKeys.INSTRUMENT_REVISION_KM.key, 12000)
                remainingKm = nextKm - currentKm
                serviceLabel = "🔧 Manutenção em: $remainingKm km"
            }

            val shouldBlink = remainingKm < 1000
            var text = serviceLabel

            // Also check date-based
            val nextDateMillis = preferences.getLong(SharedPreferencesKeys.INSTRUMENT_REVISION_NEXT_DATE.key, 0L)
            if (nextDateMillis > 0) {
                val remainingMillis = nextDateMillis - System.currentTimeMillis()
                if (remainingMillis > 0) {
                    val remainingDays = TimeUnit.MILLISECONDS.toDays(remainingMillis) + 1
                    text += " ou $remainingDays dias"
                } else {
                    text += " (atrasada!)"
                }
            }

            activeInfoItems.add(InfoItem(text, if (shouldBlink) Color.RED else Color.WHITE, shouldBlink))
        }

        // 4. Average consumption
        if (preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_AVG_CONSUME.key, false)) {
            activeInfoItems.add(InfoItem("📊 Consumo médio: ${String.format("%.1f", avgFuelConsume)} L/100km", Color.parseColor("#00BEFF")))
        }

        // 5. Temperature
        if (preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_TEMPERATURE.key, false)) {
            activeInfoItems.add(InfoItem("🌡 Ext: ${outsideTemp.toInt()}°C  |  Int: ${insideTemp.toInt()}°C", Color.parseColor("#AFD3FF")))
        }

        // 6. Trip odometer
        if (preferences.getBoolean(SharedPreferencesKeys.ENABLE_INSTRUMENT_TRIP_ODOMETER.key, false)) {
            activeInfoItems.add(InfoItem("🛣 Viagem: ${String.format("%.1f", tripOdometer)} km  |  Total: $currentKm km", Color.WHITE))
        }

        // Reset index if needed
        if (currentInfoIndex >= activeInfoItems.size) {
            currentInfoIndex = 0
        }
    }

    private fun rotateInfo() {
        if (activeInfoItems.size <= 1) return
        currentInfoIndex = (currentInfoIndex + 1) % activeInfoItems.size
        updateView()
    }

    private fun updateView() {
        if (activeInfoItems.isEmpty()) {
            infoTextView?.let {
                blinkAnimator?.cancel()
                rootLayout.removeView(it)
                infoTextView = null
                blinkAnimator = null
            }
            return
        }

        val item = activeInfoItems.getOrNull(currentInfoIndex) ?: return

        if (infoTextView == null) {
            infoTextView = TextView(context).apply {
                textSize = 20f
                gravity = Gravity.CENTER
            }
            rootLayout.addView(infoTextView, infoParams)
        }

        infoTextView!!.text = item.text
        infoTextView!!.setTextColor(item.color)

        if (item.shouldBlink) {
            if (blinkAnimator == null) {
                blinkAnimator = ObjectAnimator.ofFloat(infoTextView, View.ALPHA, 1f, 0f).apply {
                    duration = 1500
                    repeatCount = ObjectAnimator.INFINITE
                    repeatMode = ObjectAnimator.REVERSE
                    start()
                }
            }
        } else {
            blinkAnimator?.cancel()
            blinkAnimator = null
            infoTextView!!.alpha = 1f
        }
    }

    override fun onDataChanged(key: String, value: String) {
        when (key) {
            CarConstants.CAR_BASIC_TOTAL_ODOMETER.value -> {
                currentKm = value.toIntOrNull() ?: currentKm
            }
            CarConstants.CAR_EV_INFO_ELECTRIC_MODE_REMAIN_ODOMETER.value -> {
                evRangeKm = value.toIntOrNull() ?: 0
                ensureUi { rebuildInfoItems(); updateView() }
            }
            CarConstants.CAR_EV_INFO_FUEL_MODE_REMAIN_ODOMETER.value -> {
                fuelRangeKm = value.toIntOrNull() ?: 0
                ensureUi { rebuildInfoItems(); updateView() }
            }
            CarConstants.CAR_BASIC_CUR_JOURNEY_AVG_FUEL_CONSUME.value -> {
                avgFuelConsume = value.toFloatOrNull() ?: 0f
                ensureUi { rebuildInfoItems(); updateView() }
            }
            CarConstants.CAR_BASIC_OUTSIDE_TEMP.value -> {
                outsideTemp = value.toFloatOrNull() ?: 0f
                ensureUi { rebuildInfoItems(); updateView() }
            }
            CarConstants.CAR_BASIC_INSIDE_TEMP.value -> {
                insideTemp = value.toFloatOrNull() ?: 0f
                ensureUi { rebuildInfoItems(); updateView() }
            }
            CarConstants.CAR_BASIC_CUR_JOURNEY_ODOMETER.value -> {
                tripOdometer = value.toFloatOrNull() ?: 0f
                ensureUi { rebuildInfoItems(); updateView() }
            }
        }
    }

    override fun cancel() {
        handler.removeCallbacks(timeUpdateRunnable)
        handler.removeCallbacks(rotateRunnable)
        preferences.unregisterOnSharedPreferenceChangeListener(prefsListener)
        serviceManager.removeDataChangedListener(this)
        super.cancel()
    }

    override fun carMainScreenOff() {
        ensureUi {
            rootLayout.isVisible = false
        }
    }

    override fun carMainScreenOn() {
        ensureUi {
            rootLayout.isVisible = true
        }
    }
}
