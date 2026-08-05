package dev.mobilecodex.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mobilecodex.data.repository.MobileCodexRepository
import kotlinx.coroutines.launch

@Composable
fun TerminalScreen(repository: MobileCodexRepository) {
    val scope = rememberCoroutineScope()
    var command by remember { mutableStateOf("") }
    var outputLines by remember { mutableStateOf(listOf("等待命令...")) }
    val listState = rememberLazyListState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // 输出区域
        Card(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0A14)),
            shape = RoundedCornerShape(8.dp)
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier.padding(12.dp)
            ) {
                items(outputLines) { line ->
                    Text(
                        text = line,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = Color(0xFFE0E0E0),
                        lineHeight = 18.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 输入区域
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = command,
                onValueChange = { command = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("输入命令...", color = Color.Gray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFE94560),
                    unfocusedBorderColor = Color(0xFF2A2A4A),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    cursorColor = Color(0xFFE94560)
                ),
                singleLine = true,
                shape = RoundedCornerShape(8.dp)
            )
            IconButton(
                onClick = {
                    if (command.isNotBlank()) {
                        val cmd = command
                        command = ""
                        outputLines = outputLines + "\$ $cmd"
                        scope.launch {
                            try {
                                val result = repository.executeCommand(cmd)
                                outputLines = outputLines + "PID: ${result.processId}"
                            } catch (e: Exception) {
                                outputLines = outputLines + "错误: ${e.message}"
                            }
                        }
                    }
                },
                colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFFE94560))
            ) {
                Icon(Icons.Default.Send, contentDescription = "执行", tint = Color.White)
            }
        }
    }
}
