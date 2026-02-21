package br.com.redesurftank.havalshisuku.ui.tabs

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.redesurftank.havalshisuku.listeners.IDataChanged
import br.com.redesurftank.havalshisuku.managers.ServiceManager
import br.com.redesurftank.havalshisuku.models.CarConstants
import br.com.redesurftank.havalshisuku.ui.components.AppColors
import br.com.redesurftank.havalshisuku.ui.components.AppDimensions

// ─── Color Palette ──────────────────────────────────────────────────
private object DashColors {
    val CardBg = Color(0xFF12161E)
    val SectionHeaderColor = Color(0xFF8896B0)
    val ValueColor = Color.White
    val LabelColor = Color(0xFF6B7A90)
    val AccentBlue = Color(0xFF4A9EFF)
    val AccentGreen = Color(0xFF34D399)
    val AccentOrange = Color(0xFFFBBF24)
    val AccentRed = Color(0xFFEF4444)
    val AccentCyan = Color(0xFF22D3EE)
    val AccentPurple = Color(0xFFA78BFA)
    val StatusOn = Color(0xFF34D399)
    val StatusOff = Color(0xFF4B5563)
    val RingTrack = Color(0xFF1E2740)
    val CardBorder = Color(0xFF1E2740)
    val GlowBlue = Color(0xFF3B82F6)
}

// ─── Helper: Get value from data map ────────────────────────────────
private fun Map<String, String>.v(c: CarConstants): String = this[c.value] ?: "--"
private fun Map<String, String>.num(c: CarConstants): Float? = this[c.value]?.toFloatOrNull()
private fun Map<String, String>.int(c: CarConstants): Int? = this[c.value]?.toIntOrNull()

// ─── Main Dashboard Composable ──────────────────────────────────────
@Composable
fun DashboardTab() {
    val dataMap = remember {
        mutableStateMapOf<String, String>().apply {
            putAll(ServiceManager.getInstance().allCurrentCachedData)
        }
    }

    DisposableEffect(Unit) {
        val listener = IDataChanged { key, value -> dataMap[key] = value }
        ServiceManager.getInstance().addDataChangedListener(listener)
        onDispose {
            ServiceManager.getInstance().removeDataChangedListener(listener)
        }
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(4),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // ═══════════════════════════════════════════════════════════════
        // SECTION: Battery & Energy
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Bateria & Energia", Icons.Default.BatteryChargingFull)
        }
        // SOC Ring — spans 2 columns
        item(span = { GridItemSpan(2) }) {
            val soc = dataMap.num(CarConstants.CAR_EV_INFO_CUR_BATTERY_POWER_PERCENTAGE) ?: 0f
            val socColor = when {
                soc > 60 -> DashColors.AccentGreen
                soc > 25 -> DashColors.AccentOrange
                else -> DashColors.AccentRed
            }
            DashCard {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ProgressRing(
                        progress = soc / 100f,
                        color = socColor,
                        label = "${soc.toInt()}%",
                        sublabel = "SOC",
                        size = 100
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        InfoRow("Voltagem HV", "${dataMap.v(CarConstants.CAR_EV_INFO_POWER_BATTERY_VOLTAGE)} V", DashColors.AccentCyan)
                        InfoRow("Corrente", "${dataMap.v(CarConstants.CAR_EV_INFO_CUR_CHARGE_CURRENT)} A", DashColors.AccentBlue)
                        InfoRow("Potência Motor", "${dataMap.v(CarConstants.CAR_EV_INFO_MOTOR_POWER)} kW", DashColors.AccentPurple)
                    }
                }
            }
        }
        // Battery voltage (12V) + Energy output
        item {
            val voltage = dataMap.num(CarConstants.CAR_BASIC_BATTERY_VOLTAGE)
            val vColor = when {
                voltage == null -> DashColors.LabelColor
                voltage > 12.4f -> DashColors.AccentGreen
                voltage > 11.8f -> DashColors.AccentOrange
                else -> DashColors.AccentRed
            }
            ValueCard(
                label = "Bateria 12V",
                value = if (voltage != null) String.format("%.1f V", voltage) else "--",
                icon = Icons.Default.Battery5Bar,
                valueColor = vColor
            )
        }
        item {
            val output = dataMap.num(CarConstants.CAR_EV_INFO_ENERGY_OUTPUT_PERCENTAGE) ?: 0f
            ValueCard(
                label = "Output Energia",
                value = "${output.toInt()}%",
                icon = Icons.Default.Speed,
                valueColor = DashColors.AccentBlue
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: Temperatures
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Temperaturas", Icons.Default.Thermostat)
        }
        item {
            val temp = dataMap.num(CarConstants.CAR_BASIC_INSIDE_TEMP)
            TemperatureCard("Interna", temp, Icons.Default.Home)
        }
        item {
            val temp = dataMap.num(CarConstants.CAR_BASIC_OUTSIDE_TEMP)
            TemperatureCard("Externa", temp, Icons.Default.WbSunny)
        }
        item {
            val temp = dataMap.num(CarConstants.CAR_BASIC_COOLANT_TEMP)
            val color = when {
                temp == null -> DashColors.LabelColor
                temp > 105 -> DashColors.AccentRed
                temp > 90 -> DashColors.AccentOrange
                else -> DashColors.AccentGreen
            }
            ValueCard(
                label = "Arrefecimento",
                value = if (temp != null) "${temp.toInt()}°C" else "--",
                icon = Icons.Default.Water,
                valueColor = color
            )
        }
        item {
            val temp = dataMap.num(CarConstants.CAR_BASIC_TRANSMISSION_OIL_TEMP)
            ValueCard(
                label = "Óleo Câmbio",
                value = if (temp != null) "${temp.toInt()}°C" else "--",
                icon = Icons.Default.OilBarrel,
                valueColor = DashColors.AccentOrange
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: Driving
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Condução", Icons.Default.DirectionsCar)
        }
        item {
            val speed = dataMap.v(CarConstants.CAR_BASIC_VEHICLE_SPEED)
            ValueCard(
                label = "Velocidade",
                value = "$speed km/h",
                icon = Icons.Default.Speed,
                valueColor = DashColors.ValueColor,
                large = true
            )
        }
        item {
            val mode = dataMap.int(CarConstants.CAR_DRIVE_SETTING_DRIVE_MODE)
            val modeLabel = when (mode) {
                0 -> "Normal"
                1 -> "Eco"
                2 -> "Sport"
                3 -> "Snow"
                4 -> "Off-Road"
                else -> "--"
            }
            ValueCard(
                label = "Modo",
                value = modeLabel,
                icon = Icons.Default.Tune,
                valueColor = when (mode) {
                    1 -> DashColors.AccentGreen
                    2 -> DashColors.AccentRed
                    else -> DashColors.AccentBlue
                }
            )
        }
        item {
            val esp = dataMap.v(CarConstants.CAR_DRIVE_SETTING_ESP_ENABLE)
            StatusCard("ESP", esp == "1", Icons.Default.Security)
        }
        item {
            val regen = dataMap.int(CarConstants.CAR_EV_SETTING_ENERGY_RECOVERY_LEVEL)
            val regenLabel = when (regen) {
                0 -> "Normal"
                1 -> "Alto"
                2 -> "Baixo"
                else -> "--"
            }
            ValueCard(
                label = "Regeneração",
                value = regenLabel,
                icon = Icons.Default.Autorenew,
                valueColor = DashColors.AccentGreen
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: HVAC / Climate
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Climatização", Icons.Default.AcUnit)
        }
        item {
            val acOn = dataMap.v(CarConstants.CAR_HVAC_POWER_MODE) == "1"
            StatusCard("A/C", acOn, Icons.Default.AcUnit)
        }
        item {
            ValueCard(
                label = "Temp. Motorista",
                value = "${dataMap.v(CarConstants.CAR_HVAC_DRIVER_TEMPERATURE)}°C",
                icon = Icons.Default.Person,
                valueColor = DashColors.AccentCyan
            )
        }
        item {
            ValueCard(
                label = "Temp. Passageiro",
                value = "${dataMap.v(CarConstants.CAR_HVAC_PASS_TEMPERATURE)}°C",
                icon = Icons.Default.PersonOutline,
                valueColor = DashColors.AccentCyan
            )
        }
        item {
            val fan = dataMap.v(CarConstants.CAR_HVAC_FAN_SPEED)
            ValueCard(
                label = "Ventilador",
                value = fan,
                icon = Icons.Default.Air,
                valueColor = DashColors.AccentBlue
            )
        }
        // HVAC row 2
        item {
            val sync = dataMap.v(CarConstants.CAR_HVAC_SYNC_ENABLE) == "1"
            StatusCard("Sync", sync, Icons.Default.SyncAlt)
        }
        item {
            val auto = dataMap.v(CarConstants.CAR_HVAC_AUTO_ENABLE) == "1"
            StatusCard("Auto", auto, Icons.Default.AutoMode)
        }
        item {
            val blowerMode = dataMap.int(CarConstants.CAR_HVAC_BLOWER_MODE)
            val modeStr = when (blowerMode) {
                0 -> "Rosto"
                1 -> "Rosto+Pés"
                2 -> "Pés"
                3 -> "Pés+Vidro"
                4 -> "Vidro"
                else -> "--"
            }
            ValueCard(
                label = "Direção",
                value = modeStr,
                icon = Icons.Default.CompareArrows,
                valueColor = DashColors.AccentBlue
            )
        }
        item {
            val defrost = dataMap.v(CarConstants.CAR_HVAC_FRONT_DEFROST_ENABLE) == "1"
            StatusCard("Desemb.", defrost, Icons.Default.Deblur)
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: Doors & Windows
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Portas & Janelas", Icons.Default.DoorFront)
        }
        item(span = { GridItemSpan(2) }) {
            DashCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Portas", fontSize = 13.sp, color = DashColors.SectionHeaderColor, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    val doorStatus = dataMap.v(CarConstants.CAR_BASIC_DOOR_STATUS)
                    val lockStatus = dataMap.v(CarConstants.CAR_BASIC_DOOR_LOCK_STATUS)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        DoorIndicator("DE", doorStatus, 0)
                        DoorIndicator("DD", doorStatus, 1)
                        DoorIndicator("TE", doorStatus, 2)
                        DoorIndicator("TD", doorStatus, 3)
                    }
                    Spacer(Modifier.height(6.dp))
                    val isLocked = lockStatus == "1"
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                            contentDescription = null,
                            tint = if (isLocked) DashColors.AccentGreen else DashColors.AccentOrange,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (isLocked) "Trancado" else "Destrancado",
                            fontSize = 12.sp,
                            color = if (isLocked) DashColors.AccentGreen else DashColors.AccentOrange
                        )
                    }
                }
            }
        }
        item(span = { GridItemSpan(2) }) {
            DashCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Janelas & Teto", fontSize = 13.sp, color = DashColors.SectionHeaderColor, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    val windowStatus = dataMap.v(CarConstants.CAR_BASIC_WINDOW_STATUS)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        WindowIndicator("DE", windowStatus, 0)
                        WindowIndicator("DD", windowStatus, 1)
                        WindowIndicator("TE", windowStatus, 2)
                        WindowIndicator("TD", windowStatus, 3)
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        val sunroof = dataMap.v(CarConstants.CAR_BASIC_SUNROOF_STATUS)
                        val sunshade = dataMap.v(CarConstants.CAR_BASIC_SUNSHADE_STATUS)
                        MiniStatus("Teto", sunroof != "0" && sunroof != "--")
                        MiniStatus("Cortina", sunshade != "0" && sunshade != "--")
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: Lights
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Iluminação", Icons.Default.Lightbulb)
        }
        item {
            StatusCard("Farol", dataMap.v(CarConstants.CAR_BASIC_HEAD_LIGHT_STATUS) == "1", Icons.Default.Highlight)
        }
        item {
            StatusCard("Alto", dataMap.v(CarConstants.CAR_BASIC_HIGH_BEAM_LIGHT_STATUS) == "1", Icons.Default.FlashlightOn)
        }
        item {
            StatusCard("Neblina D.", dataMap.v(CarConstants.CAR_BASIC_FRONT_FOG_LIGHT_STATUS) == "1", Icons.Default.Cloud)
        }
        item {
            StatusCard("Neblina T.", dataMap.v(CarConstants.CAR_BASIC_REAR_FOG_LIGHT_STATUS) == "1", Icons.Default.Cloud)
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: TPMS
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Pneus (TPMS)", Icons.Default.TireRepair)
        }
        item(span = { GridItemSpan(4) }) {
            val tpmsRaw = dataMap.v(CarConstants.CAR_BASIC_TPMS_STATUS)
            DashCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        "Pressão dos Pneus",
                        fontSize = 13.sp,
                        color = DashColors.SectionHeaderColor,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "TPMS: $tpmsRaw",
                        fontSize = 12.sp,
                        color = DashColors.LabelColor
                    )
                    Spacer(Modifier.height(4.dp))
                    val warning = dataMap.v(CarConstants.CAR_BASIC_TPMS_WARNING)
                    val pressWarning = dataMap.v(CarConstants.CAR_BASIC_TIREPRESS_WARNING)
                    val tempWarning = dataMap.v(CarConstants.CAR_BASIC_TIRETEMP_WARNING)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        TpmsChip("TPMS", warning)
                        TpmsChip("Pressão", pressWarning)
                        TpmsChip("Temp.", tempWarning)
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: Trip Info
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Viagem", Icons.Default.Route)
        }
        item {
            ValueCard(
                label = "Odômetro",
                value = "${dataMap.v(CarConstants.CAR_BASIC_TOTAL_ODOMETER)} km",
                icon = Icons.Default.Straighten,
                valueColor = DashColors.ValueColor
            )
        }
        item {
            ValueCard(
                label = "Consumo Médio",
                value = "${dataMap.v(CarConstants.CAR_BASIC_AVG_FUEL_CONSUMPTION)}",
                icon = Icons.Default.LocalGasStation,
                valueColor = DashColors.AccentGreen
            )
        }
        item {
            ValueCard(
                label = "Consumo Inst.",
                value = "${dataMap.v(CarConstants.CAR_BASIC_INSTANT_FUEL_CONSUMPTION)}",
                icon = Icons.Default.LocalGasStation,
                valueColor = DashColors.AccentOrange
            )
        }
        item {
            ValueCard(
                label = "Autonomia",
                value = "${dataMap.v(CarConstants.CAR_BASIC_REMAIN_ODOMETER)} km",
                icon = Icons.Default.GpsFixed,
                valueColor = DashColors.AccentCyan
            )
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION: System Info
        // ═══════════════════════════════════════════════════════════════
        item(span = { GridItemSpan(4) }) {
            SectionHeader("Sistema", Icons.Default.SettingsApplications)
        }
        item(span = { GridItemSpan(2) }) {
            DashCard {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    InfoRow("VIN", dataMap.v(CarConstants.CAR_BASIC_VIN_CODE), DashColors.LabelColor)
                    InfoRow("Modelo", dataMap.v(CarConstants.CAR_BASIC_VEHICLE_MODEL1), DashColors.LabelColor)
                    InfoRow("Versão", dataMap.v(CarConstants.CAR_BASIC_VEHICLE_VERSION), DashColors.LabelColor)
                }
            }
        }
        item {
            ValueCard(
                label = "Marcha",
                value = dataMap.v(CarConstants.CAR_BASIC_GEAR_STATUS),
                icon = Icons.Default.Settings,
                valueColor = DashColors.AccentPurple
            )
        }
        item {
            val ready = dataMap.v(CarConstants.CAR_BASIC_DRIVING_READY_STATE) == "1"
            StatusCard("Ready", ready, Icons.Default.PowerSettingsNew)
        }

        // Bottom spacer
        item(span = { GridItemSpan(4) }) {
            Spacer(Modifier.height(24.dp))
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

@Composable
private fun SectionHeader(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(top = 12.dp, bottom = 4.dp, start = 4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = DashColors.AccentBlue,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(8.dp))
        Text(
            title,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = DashColors.SectionHeaderColor,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
private fun DashCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = DashColors.CardBorder,
                shape = RoundedCornerShape(AppDimensions.CardCornerRadius)
            ),
        colors = CardDefaults.cardColors(containerColor = DashColors.CardBg),
        shape = RoundedCornerShape(AppDimensions.CardCornerRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        // Top glow line
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            DashColors.GlowBlue.copy(alpha = 0.25f),
                            Color.Transparent
                        )
                    )
                )
        )
        content()
    }
}

@Composable
private fun ValueCard(
    label: String,
    value: String,
    icon: ImageVector,
    valueColor: Color,
    large: Boolean = false
) {
    DashCard {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = valueColor.copy(alpha = 0.7f),
                modifier = Modifier.size(if (large) 28.dp else 22.dp)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = value,
                fontSize = if (large) 22.sp else 18.sp,
                fontWeight = FontWeight.Bold,
                color = valueColor,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                color = DashColors.LabelColor,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun StatusCard(label: String, isOn: Boolean, icon: ImageVector) {
    val bgColor by animateColorAsState(
        targetValue = if (isOn) Color(0xFF0D2818) else DashColors.CardBg,
        animationSpec = tween(300),
        label = "statusBg"
    )
    val borderColor by animateColorAsState(
        targetValue = if (isOn) DashColors.StatusOn.copy(alpha = 0.4f) else DashColors.CardBorder,
        animationSpec = tween(300),
        label = "statusBorder"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(AppDimensions.CardCornerRadius)
            ),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        shape = RoundedCornerShape(AppDimensions.CardCornerRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isOn) DashColors.StatusOn else DashColors.StatusOff,
                modifier = Modifier.size(24.dp)
            )
            Spacer(Modifier.height(6.dp))
            Text(
                label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = if (isOn) DashColors.StatusOn else DashColors.LabelColor,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isOn) DashColors.StatusOn else DashColors.StatusOff)
            )
        }
    }
}

@Composable
private fun TemperatureCard(label: String, temp: Float?, icon: ImageVector) {
    val color = when {
        temp == null -> DashColors.LabelColor
        temp > 35 -> DashColors.AccentRed
        temp > 28 -> DashColors.AccentOrange
        temp > 15 -> DashColors.AccentGreen
        else -> DashColors.AccentCyan
    }
    ValueCard(
        label = label,
        value = if (temp != null) "${temp.toInt()}°C" else "--",
        icon = icon,
        valueColor = color
    )
}

@Composable
private fun ProgressRing(
    progress: Float,
    color: Color,
    label: String,
    sublabel: String,
    size: Int = 80
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(600, easing = FastOutSlowInEasing),
        label = "ringProgress"
    )
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(size.dp)
    ) {
        Canvas(modifier = Modifier.size(size.dp)) {
            val strokeWidth = 10f
            val arcSize = Size(this.size.width - strokeWidth, this.size.height - strokeWidth)
            val topLeft = Offset(strokeWidth / 2, strokeWidth / 2)
            // Track
            drawArc(
                color = DashColors.RingTrack,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
            // Progress
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = animatedProgress * 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = color)
            Text(sublabel, fontSize = 10.sp, color = DashColors.LabelColor)
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 12.sp, color = DashColors.LabelColor, modifier = Modifier.weight(1f))
        Text(
            value,
            fontSize = 12.sp,
            color = color,
            fontWeight = FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
    }
}

@Composable
private fun DoorIndicator(label: String, doorStatus: String, index: Int) {
    // doorStatus is usually a comma-separated or encoded value
    // We show the raw position; if the system provides individual values this will be adapted
    val isOpen = try {
        doorStatus.split(",").getOrNull(index)?.trim() != "0"
    } catch (e: Exception) {
        false
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(if (isOpen) DashColors.AccentOrange.copy(alpha = 0.2f) else DashColors.AccentGreen.copy(alpha = 0.15f))
                .border(
                    1.dp,
                    if (isOpen) DashColors.AccentOrange else DashColors.AccentGreen.copy(alpha = 0.5f),
                    RoundedCornerShape(6.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isOpen) Icons.Default.DoorFront else Icons.Default.DoorFront,
                contentDescription = null,
                tint = if (isOpen) DashColors.AccentOrange else DashColors.AccentGreen,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = DashColors.LabelColor)
    }
}

@Composable
private fun WindowIndicator(label: String, windowStatus: String, index: Int) {
    val isOpen = try {
        windowStatus.split(",").getOrNull(index)?.trim() != "0"
    } catch (e: Exception) {
        false
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(if (isOpen) DashColors.AccentCyan.copy(alpha = 0.15f) else Color(0xFF1A2230))
                .border(
                    1.dp,
                    if (isOpen) DashColors.AccentCyan.copy(alpha = 0.5f) else DashColors.CardBorder,
                    RoundedCornerShape(6.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Window,
                contentDescription = null,
                tint = if (isOpen) DashColors.AccentCyan else DashColors.StatusOff,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = DashColors.LabelColor)
    }
}

@Composable
private fun MiniStatus(label: String, isActive: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(if (isActive) DashColors.AccentCyan else DashColors.StatusOff)
        )
        Spacer(Modifier.width(4.dp))
        Text(
            label,
            fontSize = 11.sp,
            color = if (isActive) DashColors.AccentCyan else DashColors.LabelColor
        )
    }
}

@Composable
private fun TpmsChip(label: String, value: String) {
    val isWarning = value != "0" && value != "--"
    val chipColor = if (isWarning) DashColors.AccentRed else DashColors.AccentGreen
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(chipColor.copy(alpha = 0.12f))
            .border(1.dp, chipColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            "$label: ${if (isWarning) "⚠" else "OK"}",
            fontSize = 11.sp,
            color = chipColor,
            fontWeight = FontWeight.Medium
        )
    }
}
