package br.com.redesurftank.havalshisuku

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import br.com.redesurftank.havalshisuku.ui.theme.HavalShisukuTheme
import kotlinx.coroutines.delay

class SplashActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Force landscape orientation
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        
        setContent {
            HavalShisukuTheme {
                SplashScreen {
                    // Navigate to MainActivity
                    startActivity(Intent(this@SplashActivity, MainActivity::class.java))
                    finish()
                }
            }
        }
    }
}

@Composable
fun SplashScreen(onComplete: () -> Unit) {
    var progress by remember { mutableFloatStateOf(0f) }
    
    // Scale animation for breathing effect on logo
    val infiniteTransition = rememberInfiniteTransition(label = "breathing")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    // Entry animation for alpha
    val alphaAnim = animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(1500),
        label = "alpha"
    )

    LaunchedEffect(Unit) {
        // Simulate loading
        for (i in 1..100) {
            progress = i / 100f
            delay(30) // ~3 seconds total
        }
        onComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A), // Deep Slate
                        Color(0xFF020617)  // Near Black
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Background Ambient Glows
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                color = Color(0xFF4A9EFF).copy(alpha = 0.04f),
                radius = size.minDimension * 0.9f,
                center = Offset(size.width * 0.15f, size.height * 0.2f)
            )
            drawCircle(
                color = Color(0xFF4A9EFF).copy(alpha = 0.04f),
                radius = size.minDimension * 0.7f,
                center = Offset(size.width * 0.85f, size.height * 0.8f)
            )
        }

        // Main Glass Container
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .graphicsLayer(alpha = alphaAnim.value)
                .width(520.dp)
                .padding(16.dp)
                .background(
                    color = Color.White.copy(alpha = 0.02f),
                    shape = RoundedCornerShape(32.dp)
                )
                .border(
                    width = 1.dp,
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.12f),
                            Color.Transparent,
                            Color(0xFF4A9EFF).copy(alpha = 0.15f)
                        )
                    ),
                    shape = RoundedCornerShape(32.dp)
                )
                .padding(vertical = 48.dp, horizontal = 40.dp)
        ) {
            // Logo with breathing effect and glow
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .graphicsLayer(scaleX = scale, scaleY = scale),
                contentAlignment = Alignment.Center
            ) {
                // Subtle radial glow behind logo
                Box(
                    modifier = Modifier
                        .size(130.dp)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color(0xFF4A9EFF).copy(alpha = 0.12f),
                                    Color.Transparent
                                )
                            )
                        )
                )
                Image(
                    painter = painterResource(id = R.mipmap.ic_launcher_havalx),
                    contentDescription = "Haval X Logo",
                    modifier = Modifier.size(120.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Branding Section
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    stringResource(R.string.app_splash_title),
                    color = Color.White,
                    fontSize = 52.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 10.sp,
                    style = MaterialTheme.typography.displaySmall
                )
                
                Text(
                    stringResource(R.string.app_splash_subtitle),
                    color = Color(0xFF4A9EFF).copy(alpha = 0.9f),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Light,
                    letterSpacing = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(56.dp))

            // Progress Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.width(300.dp)
            ) {
                // High-tech Progress Bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(2.dp)
                        .background(Color.White.copy(alpha = 0.06f), CircleShape)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress)
                            .fillMaxHeight()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color(0xFF4A9EFF).copy(alpha = 0.6f),
                                        Color(0xFF4A9EFF)
                                    )
                                ),
                                CircleShape
                            )
                            .shadow(
                                elevation = 6.dp,
                                shape = CircleShape,
                                spotColor = Color(0xFF4A9EFF)
                            )
                    )
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                Text(
                    stringResource(R.string.app_splash_init).uppercase(),
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 3.sp
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Active loading indicator (small dots or light glow)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(3) { i ->
                        val dotAlpha by infiniteTransition.animateFloat(
                            initialValue = 0.2f,
                            targetValue = 1f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(600, delayMillis = i * 200),
                                repeatMode = RepeatMode.Reverse
                            ),
                            label = "dotAlpha"
                        )
                        Box(
                            modifier = Modifier
                                .size(4.dp)
                                .graphicsLayer(alpha = dotAlpha)
                                .background(Color(0xFF4A9EFF), CircleShape)
                        )
                    }
                }
            }
        }
    }
}

fun DrawScope.drawAnimatedCircle(progress: Float) {
    val strokeWidth = 3.dp.toPx()
    val radius = size.minDimension / 2 - strokeWidth / 2
    val center = Offset(size.width / 2, size.height / 2)
    
    // Background circle
    drawCircle(
        color = Color(0xFF4A9EFF).copy(alpha = 0.2f),
        radius = radius,
        center = center,
        style = Stroke(width = strokeWidth)
    )
    
    // Animated arc
    val sweepAngle = 360f * progress
    rotate(degrees = -90f, pivot = center) {
        drawArc(
            color = Color(0xFF4A9EFF),
            startAngle = 0f,
            sweepAngle = sweepAngle,
            useCenter = false,
            style = Stroke(width = strokeWidth)
        )
    }
}

