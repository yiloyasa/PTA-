package dev.mobilecodex.ui.screens

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.mobilecodex.data.model.FileEntry
import dev.mobilecodex.data.repository.MobileCodexRepository
import kotlinx.coroutines.launch

@Composable
fun FileBrowserScreen(repository: MobileCodexRepository) {
    val scope = rememberCoroutineScope()
    var currentPath by remember { mutableStateOf("C:\\") }
    var files by remember { mutableStateOf<List<FileEntry>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var fileContent by remember { mutableStateOf("") }
    var showFileContent by remember { mutableStateOf(false) }
    var selectedFile by remember { mutableStateOf("") }

    // 加载目录
    fun loadDirectory(path: String) {
        loading = true
        error = ""
        scope.launch {
            try {
                files = repository.listDirectory(path)
                currentPath = path
            } catch (e: Exception) {
                error = e.message ?: "加载失败"
            }
            loading = false
        }
    }

    LaunchedEffect(Unit) { loadDirectory(currentPath) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // 路径导航
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = currentPath,
                onValueChange = {},
                modifier = Modifier.weight(1f),
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp, color = Color.White),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFE94560),
                    unfocusedBorderColor = Color(0xFF2A2A4A)
                ),
                shape = RoundedCornerShape(8.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(onClick = { loadDirectory(currentPath) }) {
                Icon(Icons.Default.Refresh, contentDescription = "刷新", tint = Color(0xFFE94560))
            }
            IconButton(onClick = {
                val parts = currentPath.trimEnd('\\').split("\\")
                if (parts.size > 1) {
                    loadDirectory(parts.dropLast(1).joinToString("\\"))
                }
            }) {
                Icon(Icons.Default.ArrowUpward, contentDescription = "上级", tint = Color(0xFFE94560))
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFFE94560))
            }
        } else if (error.isNotEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(error, color = Color(0xFFEF4444))
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(files) { file ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (file.type == "directory") {
                                    loadDirectory(file.path.ifEmpty { "$currentPath\\${file.name}" })
                                } else {
                                    selectedFile = file.name
                                    scope.launch {
                                        try {
                                            val content = repository.readFileContent(file.path.ifEmpty { "$currentPath\\${file.name}" })
                                            fileContent = content.content
                                            showFileContent = true
                                        } catch (e: Exception) {
                                            error = e.message ?: "读取失败"
                                        }
                                    }
                                }
                            }
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (file.type == "directory") Icons.Default.Folder else Icons.Default.InsertDriveFile,
                            contentDescription = null,
                            tint = if (file.type == "directory") Color(0xFFFBBF24) else Color(0xFF888888),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(file.name, fontSize = 14.sp, color = Color.White, fontWeight = if (file.type == "directory") FontWeight.Medium else FontWeight.Normal)
                    }
                    HorizontalDivider(color = Color(0xFF2A2A4A), thickness = 0.5.dp)
                }
            }
        }
    }

    // 文件内容弹窗
    if (showFileContent) {
        AlertDialog(
            onDismissRequest = { showFileContent = false },
            title = { Text(selectedFile, fontWeight = FontWeight.Bold, color = Color(0xFFE94560)) },
            text = {
                Text(
                    fileContent,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = Color(0xFFE0E0E0)
                )
            },
            confirmButton = {
                TextButton(onClick = { showFileContent = false }) { Text("关闭") }
            },
            containerColor = Color(0xFF1A1A2E)
        )
    }
}
