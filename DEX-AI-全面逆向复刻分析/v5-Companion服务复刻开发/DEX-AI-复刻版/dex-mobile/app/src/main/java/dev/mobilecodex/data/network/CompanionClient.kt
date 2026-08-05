package dev.mobilecodex.data.network

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class CompanionClient(private val baseUrl: String = "https://192.168.1.100:7443") {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .hostnameVerifier { _, _ -> true } // 接受自签名证书
        .sslSocketFactory(createTrustAllSocketFactory(), createTrustAllTrustManager())
        .build()

    private val gson = Gson()
    private var requestId = 1

    data class JsonRpcRequest(
        val jsonrpc: String = "2.0",
        val id: Int,
        val method: String,
        val params: Any? = null
    )

    data class JsonRpcResponse(
        val jsonrpc: String? = null,
        val id: Int? = null,
        val result: Any? = null,
        val error: JsonRpcError? = null
    )

    data class JsonRpcError(
        val code: Int = 0,
        val message: String = ""
    )

    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    suspend fun call(method: String, params: Any? = null): JsonObject? = withContext(Dispatchers.IO) {
        val id = requestId++
        val request = JsonRpcRequest(id = id, method = method, params = params)
        val jsonBody = gson.toJson(request)
        val body = jsonBody.toRequestBody(JSON_MEDIA_TYPE)

        val httpRequest = Request.Builder()
            .url("$baseUrl/jsonrpc")
            .post(body)
            .build()

        val response = client.newCall(httpRequest).execute()
        val responseBody = response.body?.string() ?: throw Exception("Empty response")

        val jsonResponse = JsonParser.parseString(responseBody).asJsonObject
        if (jsonResponse.has("error")) {
            val error = jsonResponse.getAsJsonObject("error")
            throw Exception(error.get("message")?.asString ?: "RPC Error")
        }
        jsonResponse.getAsJsonObject("result")
    }

    suspend fun initialize(): JsonObject = call("initialize")!!
    suspend fun getPairingCode(): JsonObject = call("remoteControl/pairing/start")!!
    suspend fun readDirectory(path: String): JsonObject = call("fs/readDirectory", mapOf("path" to path))!!
    suspend fun readFile(path: String): JsonObject = call("fs/readFile", mapOf("path" to path))!!
    suspend fun writeFile(path: String, content: String): JsonObject = call("fs/writeFile", mapOf("path" to path, "content" to content))!!
    suspend fun execCommand(command: String): JsonObject = call("command/exec", mapOf("command" to command))!!

    private fun createTrustAllSocketFactory(): javax.net.ssl.SSLSocketFactory {
        val trustManager = createTrustAllTrustManager()
        val sslContext = javax.net.ssl.SSLContext.getInstance("TLS")
        sslContext.init(null, arrayOf(trustManager), java.security.SecureRandom())
        return sslContext.socketFactory
    }

    private fun createTrustAllTrustManager(): javax.net.ssl.X509TrustManager {
        return object : javax.net.ssl.X509TrustManager {
            override fun checkClientTrusted(chain: Array<java.security.cert.X509Certificate>, authType: String) {}
            override fun checkServerTrusted(chain: Array<java.security.cert.X509Certificate>, authType: String) {}
            override fun getAcceptedIssuers(): Array<java.security.cert.X509Certificate> = arrayOf()
        }
    }
}
