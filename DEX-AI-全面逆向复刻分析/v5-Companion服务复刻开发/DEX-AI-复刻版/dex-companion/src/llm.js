// ============================================================
// LLM API 服务 - 支持 OpenAI 兼容接口
// 支持: OpenAI / Claude / 本地模型 / 自定义端点
// ============================================================

const https = require("https");
const http = require("http");

class LlmService {
    constructor(config) {
        this.config = {
            provider: process.env.LLM_PROVIDER || "openai",
            apiKey: process.env.LLM_API_KEY || "",
            baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
            model: process.env.LLM_MODEL || "gpt-3.5-turbo",
            temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "4096"),
            systemPrompt: process.env.LLM_SYSTEM_PROMPT || "你是一个AI编程助手，帮助用户解决编程问题。",
            ...config,
        };
        this.conversations = new Map(); // threadId -> messages[]
    }

    // 设置 API 配置
    setConfig(config) {
        Object.assign(this.config, config);
    }

    // 获取对话历史
    getConversation(threadId) {
        if (!this.conversations.has(threadId)) {
            this.conversations.set(threadId, [
                { role: "system", content: this.config.systemPrompt }
            ]);
        }
        return this.conversations.get(threadId);
    }

    // 添加消息到对话
    addMessage(threadId, role, content) {
        const messages = this.getConversation(threadId);
        messages.push({ role, content });
        // 限制上下文长度（保留最近 50 条）
        if (messages.length > 50) {
            const system = messages[0];
            this.conversations.set(threadId, [system, ...messages.slice(-49)]);
        }
    }

    // 非流式调用 LLM
    async chat(threadId, userMessage) {
        this.addMessage(threadId, "user", userMessage);
        const messages = this.getConversation(threadId);

        try {
            const response = await this.callApi(messages);
            const reply = response.choices?.[0]?.message?.content || "";
            this.addMessage(threadId, "assistant", reply);
            return { reply, usage: response.usage };
        } catch (err) {
            // 如果 OpenAI 调用失败，返回模拟回复
            console.error("[LLM] API 调用失败:", err.message);
            const mockReply = this.generateMockReply(userMessage);
            this.addMessage(threadId, "assistant", mockReply);
            return { reply: mockReply, usage: null, error: err.message };
        }
    }

    // 流式调用 LLM (用于实时对话)
    async chatStream(threadId, userMessage, onChunk) {
        this.addMessage(threadId, "user", userMessage);
        const messages = this.getConversation(threadId);

        try {
            const fullReply = await this.callApiStream(messages, onChunk);
            this.addMessage(threadId, "assistant", fullReply);
            return fullReply;
        } catch (err) {
            console.error("[LLM] 流式调用失败:", err.message);
            const mockReply = this.generateMockReply(userMessage);
            onChunk(mockReply);
            this.addMessage(threadId, "assistant", mockReply);
            return mockReply;
        }
    }

    // HTTP 调用 OpenAI 兼容 API (非流式)
    callApi(messages) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                model: this.config.model,
                messages: messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: false,
            });

            const url = new URL(this.config.baseUrl + "/chat/completions");
            const isHttps = url.protocol === "https:";
            const transport = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + this.config.apiKey,
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: 60000,
            };

            const req = transport.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => data += chunk);
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error("解析响应失败: " + data.substring(0, 200)));
                    }
                });
            });

            req.on("error", reject);
            req.on("timeout", () => { req.destroy(); reject(new Error("请求超时")); });
            req.write(body);
            req.end();
        });
    }

    // HTTP 调用 OpenAI 兼容 API (流式)
    callApiStream(messages, onChunk) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                model: this.config.model,
                messages: messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: true,
            });

            const url = new URL(this.config.baseUrl + "/chat/completions");
            const isHttps = url.protocol === "https:";
            const transport = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + this.config.apiKey,
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: 120000,
            };

            const req = transport.request(options, (res) => {
                let buffer = "";
                let fullContent = "";

                res.on("data", (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === "data: [DONE]") continue;
                        if (trimmed.startsWith("data: ")) {
                            try {
                                const json = JSON.parse(trimmed.slice(6));
                                const content = json.choices?.[0]?.delta?.content || "";
                                if (content) {
                                    fullContent += content;
                                    onChunk(content);
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                });

                res.on("end", () => resolve(fullContent));
            });

            req.on("error", reject);
            req.on("timeout", () => { req.destroy(); reject(new Error("流式请求超时")); });
            req.write(body);
            req.end();
        });
    }

    // 模拟回复（当 API 不可用时）
    generateMockReply(userMessage) {
        const messages = [
            "收到您的消息。这是一个模拟回复，因为 LLM API 尚未配置。",
            "您可以在设置中配置 OpenAI API Key 来启用真正的 AI 对话。",
            "当前处于离线演示模式。",
        ];
        const reply = messages.join("\n\n") + "\n\n---\n您说: " + userMessage;
        return reply;
    }

    // 清除对话历史
    clearConversation(threadId) {
        this.conversations.delete(threadId);
    }

    // 获取所有对话
    getAllConversations() {
        const result = {};
        for (const [id, messages] of this.conversations) {
            result[id] = messages;
        }
        return result;
    }
}

module.exports = { LlmService };
