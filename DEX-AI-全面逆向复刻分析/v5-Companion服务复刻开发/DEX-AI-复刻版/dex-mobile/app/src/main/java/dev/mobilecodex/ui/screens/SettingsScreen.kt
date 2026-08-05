package dev.mobilecodex.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mobilecodex.data.model.CompanionInfo

@Composable
fun SettingsScreen(
    statusMessage: String,
    companionInfo: CompanionInfo?
) {
    var serverUrl by remember { mutableStateOf("https://192.168.1.100:7443") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // 连接设置
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("连接设置", fontWeight = FontWeight.Bold, color = Color(0xFFE94560), fontSize = 14.sp)
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = { serverUrl = it },
                    label = { Text("服务器地址") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFE94560),
                        unfocusedBorderColor = Color(0xFF2A2A4A),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedLabelColor = Color(0xFFE94560),
                        cursorColor = Color(0xFFE94560)
                    ),
                    shape = RoundedCornerShape(8.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // 状态信息
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("状态信息", fontWeight = FontWeight.Bold, color = Color(0xFFE94560), fontSize = 14.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(statusMessage.ifEmpty { "就绪" }, fontSize = 12.sp, color = Color(0xFFE0E0E0))
                if (companionInfo != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("名称: ${companionInfo.name}", fontSize = 12.sp, color = Color.Gray)
                    Text("版本: ${companionInfo.version}", fontSize = 12.sp, color = Color.Gray)
                    Text("设备ID: ${companionInfo.deviceId}", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }
    }
}
