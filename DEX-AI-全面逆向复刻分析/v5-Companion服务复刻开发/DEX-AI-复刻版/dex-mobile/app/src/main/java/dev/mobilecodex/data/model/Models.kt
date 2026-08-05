package dev.mobilecodex.data.model

data class CompanionInfo(
    val name: String = "DEX AI Replica",
    val version: String = "1.0.0",
    val capabilities: List<String> = emptyList(),
    val deviceId: String = ""
)

data class PairingCode(
    val code: String,
    val expiresIn: Int = 300
)

data class FileEntry(
    val name: String,
    val path: String,
    val type: String, // "file" or "directory"
    val size: Long = 0
)

data class FileContent(
    val path: String,
    val content: String
)

data class CommandResult(
    val processId: String,
    val output: String = "",
    val exitCode: Int? = null
)

data class DeviceInfo(
    val id: String,
    val name: String,
    val type: String,
    val status: String,
    val lastSeen: String = ""
)

data class ChatMessage(
    val role: String, // "user" or "assistant"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)
