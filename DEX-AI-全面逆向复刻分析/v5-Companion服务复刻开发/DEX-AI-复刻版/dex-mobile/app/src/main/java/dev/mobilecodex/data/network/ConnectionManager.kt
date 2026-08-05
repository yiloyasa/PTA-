package dev.mobilecodex.data.network

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import dev.mobilecodex.data.model.CompanionInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class ConnectionManager(private val context: Context) {

    private var companionClient: CompanionClient? = null
    var currentServerUrl: String = "https://192.168.1.100:7443"
        private set

    // mDNS发现（局域网搜索Companion）
    suspend fun discoverCompanion(): List<String> = withContext(Dispatchers.IO) {
        val servers = mutableListOf<String>()
        val socket = DatagramSocket()
        socket.broadcast = true
        socket.soTimeout = 3000

        // mDNS查询
        val query = byteArrayOf(
            0x00, 0x00, // Transaction ID
            0x00, 0x00, // Flags
            0x00, 0x01, // Questions
            0x00, 0x00, // Answer RRs
            0x00, 0x00, // Authority RRs
            0x00, 0x00, // Additional RRs
        )
        // 这里简化mDNS查询，实际需要完整DNS协议
        // 更简单的方式：扫描局域网常见IP

        try {
            val packet = DatagramPacket(query, query.size, InetAddress.getByName("224.0.0.251"), 5353)
            socket.send(packet)

            val buffer = ByteArray(1024)
            while (true) {
                try {
                    val receivePacket = DatagramPacket(buffer, buffer.size)
                    socket.receive(receivePacket)
                    val response = String(receivePacket.data, 0, receivePacket.length)
                    if (response.contains("companion") || response.contains("dex")) {
                        servers.add(receivePacket.address.hostAddress ?: "")
                    }
                } catch (e: Exception) {
                    break
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            socket.close()
        }
        servers
    }

    fun connectTo(serverUrl: String): CompanionClient {
        currentServerUrl = serverUrl
        companionClient = CompanionClient(serverUrl)
        return companionClient!!
    }

    fun getClient(): CompanionClient {
        if (companionClient == null) {
            companionClient = CompanionClient(currentServerUrl)
        }
        return companionClient!!
    }
}
