package dev.mobilecodex.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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

@Composable
fun HomeScreen(
    companionInfo: CompanionInfo?,
    connected: Boolean,
    connecting: Boolean,
    onPair: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Top
    ) {
        // 状态卡片
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            border = CardDefaults.outlinedCardBorder().copy(
                width = 1.dp
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("连接状态", fontWeight = FontWeight.Bold, color = Color(0xFFE94560), fontSize = 14.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (connected) Color(0xFF4ADE80) else Color(0xFFEF4444))
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (connecting) "连接中..." else if (connected) "已连接" else "未连接",
                        color = if (connected) Color(0xFF4ADE80) else Color(0xFFEF4444)
                    )
                }
                if (connected && companionInfo != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("版本: ${companionInfo.version}", fontSize = 12.sp, color = Color.Gray)
                    Text("能力: ${companionInfo.capabilities.joinToString(", ")}", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 快速操作网格
        Text("快速操作", fontWeight = FontWeight.Bold, color = Color(0xFFE94560), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(8.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            QuickActionCard("设备配对", Icons.Default.Devices, onClick = onPair)
            QuickActionCard("文件浏览", Icons.Default.Folder, onClick = {})
            QuickActionCard("终端", Icons.Default.Terminal, onClick = {})
            QuickActionCard("刷新", Icons.Default.Refresh, onClick = {})
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 配对码生成按钮
        Button(
            onClick = onPair,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE94560)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(Icons.Default.QrCode, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("生成配对码", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun QuickActionCard(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .weight(1f)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E3A)),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = Color(0xFFE94560), modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(title, fontSize = 11.sp, color = Color(0xFFE0E0E0), textAlign = TextAlign.Center)
        }
    }
}
