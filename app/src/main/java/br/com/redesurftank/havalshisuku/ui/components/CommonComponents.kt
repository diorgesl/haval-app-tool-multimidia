package br.com.redesurftank.havalshisuku.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.staggeredgrid.LazyVerticalStaggeredGrid
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridCells
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridItemSpan
import androidx.compose.foundation.lazy.staggeredgrid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Data class compartilhado para settings
data class SettingItem(
    val title: String,
    val description: String,
    val checked: Boolean,
    val onCheckedChange: (Boolean) -> Unit,
    val enabled: Boolean = true,
    val sliderValue: Int? = null,
    val sliderRange: IntRange? = null,
    val sliderStep: Int? = null,
    val onSliderChange: ((Int) -> Unit)? = null,
    val sliderLabel: String? = null,
    val hideSwitch: Boolean = false,
    val customContent: (@Composable () -> Unit)? = null
)

// Cores do tema — modernizado
object AppColors {
    val Background = Color(0xFF0A0C10)
    val CardBackground = Color(0xFF12161E)
    val CardBackgroundActive = Color(0xFF141C2A)
    val BorderColor = Color(0xFF1E2740)
    val BorderActiveColor = Color(0xFF2563EB)
    val GlowBlue = Color(0xFF3B82F6)
    val Primary = Color(0xFF4A9EFF)
    val PrimaryDim = Color(0xFF2563EB)
    val TextPrimary = Color.White
    val TextSecondary = Color(0xFF8896B0)
    val TextDisabled = Color(0xFF505868)
    val SurfaceVariant = Color(0xFF1C2232)
    val ButtonSecondary = Color(0xFF2A3142)
    val MenuSelectedIcon = Color(0xFF4A9EFF)
    val MenuUnselectedIcon = Color(0xFF626E84)
    val MenuUnselectedText = Color(0xFF8896B0)
    val SwitchActive = Color(0xFF3B82F6)
    val SwitchInactive = Color(0xFF2A3142)
    val DividerColor = Color(0xFF1A1E28)
}

// Dimensões padrão
object AppDimensions {
    val CardPadding = 18.dp
    val CardSpacing = 6.dp
    val BorderWidth = 1.dp
    val CardCornerRadius = 14.dp
    val BorderCornerRadius = 14.dp
    val ButtonCornerRadius = 10.dp
    val IconSize = 24.dp
    val MenuWidth = 270.dp
    val MenuItemHeight = 80.dp
    val ContentPadding = 16.dp
}

// Componente de Card reutilizável — modernizado com glow e gradientes
@Composable
fun SettingCard(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    sliderValue: Int? = null,
    sliderRange: IntRange? = null,
    sliderStep: Int? = null,
    onSliderChange: ((Int) -> Unit)? = null,
    sliderLabel: String? = null,
    hideSwitch: Boolean = false,
    customContent: (@Composable () -> Unit)? = null
) {
    val animatedBg by animateColorAsState(
        targetValue = if (checked && enabled) AppColors.CardBackgroundActive else AppColors.CardBackground,
        animationSpec = tween(300, easing = FastOutSlowInEasing),
        label = "cardBg"
    )

    val animatedBorder by animateColorAsState(
        targetValue = if (checked && enabled) AppColors.BorderActiveColor.copy(alpha = 0.5f) else AppColors.BorderColor,
        animationSpec = tween(300, easing = FastOutSlowInEasing),
        label = "cardBorder"
    )

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = AppDimensions.CardSpacing, horizontal = AppDimensions.CardSpacing)
            .animateContentSize(
                animationSpec = tween(300, easing = FastOutSlowInEasing)
            )
            .then(
                if (checked && sliderValue != null) Modifier else Modifier.heightIn(min = 100.dp)
            )
            .then(
                if (checked && enabled) {
                    Modifier.shadow(
                        elevation = 8.dp,
                        shape = RoundedCornerShape(AppDimensions.CardCornerRadius),
                        ambientColor = AppColors.GlowBlue.copy(alpha = 0.15f),
                        spotColor = AppColors.GlowBlue.copy(alpha = 0.2f)
                    )
                } else Modifier
            )
            .border(
                width = AppDimensions.BorderWidth,
                color = animatedBorder,
                shape = RoundedCornerShape(AppDimensions.BorderCornerRadius)
            )
            .clickable(enabled = enabled && sliderValue == null) { onCheckedChange(!checked) },
        colors = CardDefaults.cardColors(
            containerColor = animatedBg
        ),
        shape = RoundedCornerShape(AppDimensions.CardCornerRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        // Subtle top gradient line when active
        if (checked && enabled) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp)
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color.Transparent,
                                AppColors.GlowBlue.copy(alpha = 0.6f),
                                AppColors.Primary.copy(alpha = 0.4f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(AppDimensions.CardPadding)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (enabled) {
                        if (checked) AppColors.TextPrimary else AppColors.TextSecondary
                    } else AppColors.TextDisabled,
                    modifier = Modifier.weight(1f).padding(end = 12.dp),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    letterSpacing = 0.3.sp
                )
                if (!hideSwitch) {
                    Switch(
                        checked = checked,
                        onCheckedChange = if (sliderValue == null) null else onCheckedChange,
                        enabled = enabled,
                        modifier = Modifier.scale(0.8f),
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = AppColors.SwitchActive,
                            uncheckedThumbColor = Color(0xFF626E84),
                            uncheckedTrackColor = AppColors.SwitchInactive,
                            uncheckedBorderColor = Color.Transparent,
                            checkedBorderColor = Color.Transparent
                        )
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = description,
                fontSize = 12.sp,
                color = if (enabled) AppColors.TextSecondary.copy(alpha = 0.7f) else Color(0xFF404858),
                lineHeight = 16.sp,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                letterSpacing = 0.2.sp
            )

            // Mostrar slider se a opção estiver ativada e tiver valores de slider
            if (checked && sliderValue != null && sliderRange != null && onSliderChange != null) {
                Spacer(modifier = Modifier.height(14.dp))
                // Divider line
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(AppColors.BorderColor.copy(alpha = 0.5f))
                )
                Spacer(modifier = Modifier.height(12.dp))
                Column {
                    if (sliderLabel != null) {
                        Text(
                            text = sliderLabel,
                            fontSize = 13.sp,
                            color = AppColors.Primary,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                    }
                    val stepSize = sliderStep ?: if (title.contains("volume", ignoreCase = true)) 1 else 5
                    val steps = ((sliderRange.last - sliderRange.first) / stepSize) - 1

                    val roundedValue = ((sliderValue / stepSize) * stepSize).toFloat()

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(36.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Slider(
                            value = roundedValue,
                            onValueChange = { newValue ->
                                val finalValue = ((newValue / stepSize).toInt() * stepSize)
                                onSliderChange(finalValue)
                            },
                            valueRange = sliderRange.first.toFloat()..sliderRange.last.toFloat(),
                            steps = steps,
                            modifier = Modifier.fillMaxWidth(),
                            colors = SliderDefaults.colors(
                                thumbColor = Color.White,
                                activeTrackColor = AppColors.GlowBlue,
                                inactiveTrackColor = Color(0xFF1E2740),
                                activeTickColor = Color.Transparent,
                                inactiveTickColor = Color.Transparent,
                                disabledThumbColor = AppColors.Primary,
                                disabledActiveTrackColor = AppColors.Primary,
                                disabledInactiveTrackColor = Color(0xFF1E2740)
                            )
                        )
                    }
                }
            }

            // Mostrar conteúdo customizado se estiver ativado
            if (checked && customContent != null) {
                Spacer(modifier = Modifier.height(14.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(AppColors.BorderColor.copy(alpha = 0.5f))
                )
                Spacer(modifier = Modifier.height(12.dp))
                customContent()
            }
        }
    }
}

// Layout de duas colunas reutilizável
@Composable
fun TwoColumnSettingsLayout(
    settingsList: List<SettingItem>,
    modifier: Modifier = Modifier,
    bottomContent: @Composable (() -> Unit)? = null
) {
    LazyVerticalStaggeredGrid(
        columns = StaggeredGridCells.Adaptive(minSize = 340.dp),
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = AppDimensions.CardSpacing),
        verticalItemSpacing = 0.dp,
        horizontalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        items(settingsList) { setting ->
            SettingCard(
                title = setting.title,
                description = setting.description,
                checked = setting.checked,
                onCheckedChange = setting.onCheckedChange,
                enabled = setting.enabled,
                sliderValue = setting.sliderValue,
                sliderRange = setting.sliderRange,
                sliderStep = setting.sliderStep,
                onSliderChange = setting.onSliderChange,
                sliderLabel = setting.sliderLabel,
                customContent = setting.customContent
            )
        }

        if (bottomContent != null) {
            item(span = StaggeredGridItemSpan.FullLine) {
                // Adicionamos um spacer extra para afastar do grid se necessário
                Column {
                    Spacer(modifier = Modifier.height(8.dp))
                    bottomContent()
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

// Card estilizado padrão — com glassmorphism
@Composable
fun StyledCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = AppDimensions.CardSpacing, horizontal = AppDimensions.CardSpacing)
            .border(
                width = AppDimensions.BorderWidth,
                brush = Brush.linearGradient(
                    colors = listOf(
                        AppColors.BorderActiveColor.copy(alpha = 0.4f),
                        AppColors.BorderColor,
                        AppColors.BorderActiveColor.copy(alpha = 0.2f)
                    )
                ),
                shape = RoundedCornerShape(AppDimensions.BorderCornerRadius)
            ),
        colors = CardDefaults.cardColors(
            containerColor = AppColors.CardBackgroundActive
        ),
        shape = RoundedCornerShape(AppDimensions.CardCornerRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        // Top accent line
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            AppColors.GlowBlue.copy(alpha = 0.3f),
                            Color.Transparent
                        )
                    )
                )
        )
        content()
    }
}

// Botão primário estilizado
@Composable
fun PrimaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = AppColors.PrimaryDim
        ),
        shape = RoundedCornerShape(AppDimensions.ButtonCornerRadius)
    ) {
        Text(text, color = AppColors.TextPrimary, fontWeight = FontWeight.Medium)
    }
}

// Botão secundário estilizado
@Composable
fun SecondaryButton(
    onClick: () -> Unit,
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = AppColors.ButtonSecondary
        ),
        shape = RoundedCornerShape(AppDimensions.ButtonCornerRadius)
    ) {
        Text(text, color = AppColors.TextSecondary)
    }
}

// TextField estilizado
@Composable
fun StyledTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    singleLine: Boolean = true
) {
    TextField(
        value = value,
        onValueChange = onValueChange,
        label = label,
        modifier = modifier,
        enabled = enabled,
        singleLine = singleLine,
        colors = TextFieldDefaults.colors(
            focusedContainerColor = AppColors.SurfaceVariant,
            unfocusedContainerColor = AppColors.SurfaceVariant,
            focusedTextColor = AppColors.TextPrimary,
            unfocusedTextColor = AppColors.TextSecondary,
            focusedIndicatorColor = AppColors.GlowBlue,
            unfocusedIndicatorColor = AppColors.ButtonSecondary,
            focusedLabelColor = AppColors.Primary,
            unfocusedLabelColor = AppColors.TextSecondary
        )
    )
}
