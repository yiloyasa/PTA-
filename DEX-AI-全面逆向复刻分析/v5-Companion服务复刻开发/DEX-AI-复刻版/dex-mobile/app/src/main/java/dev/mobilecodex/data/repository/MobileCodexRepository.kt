package dev.mobilecodex.data.repository

import com.google.gson.Gson
import com.google.gson.JsonObject
import dev.mobilecodex.data.model.*
import dev.mobilecodex.data.network.CompanionClient

class MobileCodexRepository(private val client: CompanionClient = CompanionClient()) {

    private val gson = Gson()

    suspend fun getCompanionInfo(): CompanionInfo {
        val result = client.initialize()
        return CompanionInfo(
            name = result.get("name")?.asString ?: "",
            version = result.get("version")?.asString ?: "",
            capabilities = result.getAsJsonArray("capabilities")?.map { it.asString } ?: emptyList()
        )
    }

    suspend fun generatePairingCode(): PairingCode {
        val result = client.getPairingCode()
        return PairingCode(
            code = result.get("pairingCode")?.asString ?: "",
            expiresIn = result.get("expiresIn")?.asInt ?: 300
        )
    }

    suspend fun listDirectory(path: String): List<FileEntry> {
        val result = client.readDirectory(path)
        val entries = result.getAsJsonArray("entries")
        return entries?.map { entry ->
            val obj = entry.asJsonObject
            FileEntry(
                name = obj.get("name")?.asString ?: "",
                path = obj.get("path")?.asString ?: "",
                type = obj.get("type")?.asString ?: "file",
                size = obj.get("size")?.asLong ?: 0
            )
        } ?: emptyList()
    }

    suspend fun readFileContent(path: String): FileContent {
        val result = client.readFile(path)
        return FileContent(
            path = path,
            content = result.get("content")?.asString ?: ""
        )
    }

    suspend fun writeFileContent(path: String, content: String) {
        client.writeFile(path, content)
    }

    suspend fun executeCommand(command: String): CommandResult {
        val result = client.execCommand(command)
        return CommandResult(
            processId = result.get("processId")?.asString ?: "",
            output = result.get("output")?.asString ?: ""
        )
    }
}
