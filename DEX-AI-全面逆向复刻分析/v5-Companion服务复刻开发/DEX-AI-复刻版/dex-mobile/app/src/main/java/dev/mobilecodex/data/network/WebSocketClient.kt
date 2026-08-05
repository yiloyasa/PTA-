package dev.mobilecodex.data.network

import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.Socket
import javax.net.ssl.SSLSocketFactory

class WebSocketClient(private val host: String, private val port: Int = 7443) {

    private var socket: Socket? = null
    private var writer: OutputStreamWriter? = null
    private var reader: BufferedReader? = null
    private val messageChannel = Channel<String>(Channel.BUFFERED)
    val messages: Flow<String> = messageChannel.receiveAsFlow()
    private var running = false

    // WebSocket握手
    suspend fun connect(path: String = "/ws"): Boolean {
        return try {
            val sslFactory = SSLSocketFactory.getDefault() as SSLSocketFactory
            socket = sslFactory.createSocket(host, port)
            writer = OutputStreamWriter(socket!!.getOutputStream())
            reader = BufferedReader(InputStreamReader(socket!!.getInputStream()))

            // WebSocket升级请求
            val key = java.util.Base64.getEncoder().encodeToString(
                java.security.MessageDigest.getInstance("SHA-1").digest(
                    (java.util.UUID.randomUUID().toString() + "258EAFA5-E914-47DA-95CA-5AB5DC11B735").toByteArray()
                )
            )
            val upgradeRequest = buildString {
                append("GET $path HTTP/1.1\r\n")
                append("Host: $host:$port\r\n")
                append("Upgrade: websocket\r\n")
                append("Connection: Upgrade\r\n")
                append("Sec-WebSocket-Key: $key\r\n")
                append("Sec-WebSocket-Version: 13\r\n")
                append("\r\n")
            }
            writer?.write(upgradeRequest)
            writer?.flush()

            // 读取响应
            val response = reader?.readLine()
            running = response?.contains("101") == true
            running
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun send(message: String) {
        try {
            writer?.write(message)
            writer?.flush()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun disconnect() {
        running = false
        try {
            socket?.close()
            writer?.close()
            reader?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
