package dev.mobilecodex.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mobilecodex.data.model.CompanionInfo
import dev.mobilecodex.data.repository.MobileCodexRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val repository = remember { MobileCodexRepository() }
    val scope = rememberCoroutineScope()
    var companionInfo by remember { mutableStateOf<CompanionInfo?>(null) }
    var pairingCode by remember { mutableStateOf("") }
    var showPairingDialog by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) }
    var statusMessage by remember { mutableStateOf("") }

    // 连接状态
    var connected by remember { mutableStateOf(false) }
    var connecting by remember { mutableStateOf(true) }

    // 连接Companion
    LaunchedEffect(Unit) {
        try {
            val info = repository.getCompanionInfo()
            companionInfo = info
            connected = true
            statusMessage = "已连接: ${info.name} v${info.version}"
        } catch (e: Exception) {
            statusMessage = "连接失败: ${e.message}"
            connecting = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("DEX Mobile", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1A1A2E),
                    titleContentColor = Color(0xFFE94560)
                ),
                actions = {
                    // 连接状态指示灯
                    Box(
                        modifier = Modifier
                            .padding(end = 12.dp)
                            .size(10.dp)
                            .clip(RoundedCornerShape(5.dp))
                            .background(if (connected) Color(0xFF4ADE80) else Color(0xFFEF4444))
                    )
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF1A1A2E)) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("首页") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFE94560),
                        selectedTextColor = Color(0xFFE94560),
                        indicatorColor = Color(0xFF2A2A4A)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Terminal, contentDescription = null) },
                    label = { Text("终端") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFE94560),
                        selectedTextColor = Color(0xFFE94560),
                        indicatorColor = Color(0xFF2A2A4A)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Folder, contentDescription = null) },
                    label = { Text("文件") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFE94560),
                        selectedTextColor = Color(0xFFE94560),
                        indicatorColor = Color(0xFF2A2A4A)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                    label = { Text("设置") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFE94560),
                        selectedTextColor = Color(0xFFE94560),
                        indicatorColor = Color(0xFF2A2A4A)
                    )
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                0 -> HomeScreen(
                    companionInfo = companionInfo,
                    connected = connected,
                    connecting = connecting,
                    onPair = {
                        scope.launch {
                            try {
                                val code = repository.generatePairingCode()
                                pairingCode = code.code
                                showPairingDialog = true
                            } catch (e: Exception) {
                                statusMessage = "配对失败: ${e.message}"
                            }
                        }
                    }
                )
                1 -> TerminalScreen(repository = repository)
                2 -> FileBrowserScreen(repository = repository)
                3 -> SettingsScreen(
                    statusMessage = statusMessage,
                    companionInfo = companionInfo
                )
            }
        }
    }

    // 配对码弹窗
    if (showPairingDialog) {
        AlertDialog(
            onDismissRequest = { showPairingDialog = false },
            title = { Text("设备配对", fontWeight = FontWeight.Bold) },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("在桌面端输入配对码：", fontSize = 14.sp, color = Color.Gray)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = pairingCode,
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE94560),
                        textAlign = TextAlign.Center,
                        letterSpacing = 10.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("有效期 300 秒", fontSize = 12.sp, color = Color.Gray)
                }
            },
            confirmButton = {
                TextButton(onClick = { showPairingDialog = false }) {
                    Text("关闭")
                }
            },
            containerColor = Color(0xFF1A1A2E)
        )
    }
}
