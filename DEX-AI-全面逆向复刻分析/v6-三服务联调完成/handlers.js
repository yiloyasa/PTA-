// ============================================================
// 自动生成的完整 RPC 方法处理器
// 基于 ClientRequest.json Schema 自动生成
// 共 126 个方法
// ============================================================

const fs = require("fs");
const path = require("path");

class RpcHandlers {
  constructor(companionServer) {
    this.server = companionServer;
    this.threads = new Map();
    this.processes = new Map();
    this.config = {};
  }

  getMethods() {
    return {
      "initialize": this.handleInitialize.bind(this),
      "thread/start": this.handleThreadStart.bind(this),
      "thread/resume": this.handleThreadResume.bind(this),
      "thread/fork": this.handleThreadFork.bind(this),
      "thread/archive": this.handleThreadArchive.bind(this),
      "thread/delete": this.handleThreadDelete.bind(this),
      "thread/unsubscribe": this.handleThreadUnsubscribe.bind(this),
      "thread/increment_elicitation": this.handleThreadIncrement_elicitation.bind(this),
      "thread/decrement_elicitation": this.handleThreadDecrement_elicitation.bind(this),
      "thread/name/set": this.handleThreadNameSet.bind(this),
      "thread/goal/set": this.handleThreadGoalSet.bind(this),
      "thread/goal/get": this.handleThreadGoalGet.bind(this),
      "thread/goal/clear": this.handleThreadGoalClear.bind(this),
      "thread/metadata/update": this.handleThreadMetadataUpdate.bind(this),
      "thread/settings/update": this.handleThreadSettingsUpdate.bind(this),
      "thread/memoryMode/set": this.handleThreadMemoryModeSet.bind(this),
      "memory/reset": this.handleMemoryReset.bind(this),
      "thread/unarchive": this.handleThreadUnarchive.bind(this),
      "thread/compact/start": this.handleThreadCompactStart.bind(this),
      "thread/shellCommand": this.handleThreadShellCommand.bind(this),
      "thread/approveGuardianDeniedAction": this.handleThreadApproveGuardianDeniedAction.bind(this),
      "thread/backgroundTerminals/clean": this.handleThreadBackgroundTerminalsClean.bind(this),
      "thread/backgroundTerminals/list": this.handleThreadBackgroundTerminalsList.bind(this),
      "thread/backgroundTerminals/terminate": this.handleThreadBackgroundTerminalsTerminate.bind(this),
      "thread/rollback": this.handleThreadRollback.bind(this),
      "thread/list": this.handleThreadList.bind(this),
      "thread/search": this.handleThreadSearch.bind(this),
      "thread/searchOccurrences": this.handleThreadSearchOccurrences.bind(this),
      "thread/loaded/list": this.handleThreadLoadedList.bind(this),
      "thread/read": this.handleThreadRead.bind(this),
      "thread/turns/list": this.handleThreadTurnsList.bind(this),
      "thread/items/list": this.handleThreadItemsList.bind(this),
      "thread/inject_items": this.handleThreadInject_items.bind(this),
      "skills/list": this.handleSkillsList.bind(this),
      "skills/extraRoots/set": this.handleSkillsExtraRootsSet.bind(this),
      "hooks/list": this.handleHooksList.bind(this),
      "marketplace/add": this.handleMarketplaceAdd.bind(this),
      "marketplace/remove": this.handleMarketplaceRemove.bind(this),
      "marketplace/upgrade": this.handleMarketplaceUpgrade.bind(this),
      "plugin/list": this.handlePluginList.bind(this),
      "plugin/installed": this.handlePluginInstalled.bind(this),
      "plugin/read": this.handlePluginRead.bind(this),
      "plugin/skill/read": this.handlePluginSkillRead.bind(this),
      "plugin/share/save": this.handlePluginShareSave.bind(this),
      "plugin/share/updateTargets": this.handlePluginShareUpdateTargets.bind(this),
      "plugin/share/list": this.handlePluginShareList.bind(this),
      "plugin/share/checkout": this.handlePluginShareCheckout.bind(this),
      "plugin/share/delete": this.handlePluginShareDelete.bind(this),
      "app/read": this.handleAppRead.bind(this),
      "app/list": this.handleAppList.bind(this),
      "app/installed": this.handleAppInstalled.bind(this),
      "fs/readFile": this.handleFsReadFile.bind(this),
      "fs/writeFile": this.handleFsWriteFile.bind(this),
      "fs/createDirectory": this.handleFsCreateDirectory.bind(this),
      "fs/getMetadata": this.handleFsGetMetadata.bind(this),
      "fs/readDirectory": this.handleFsReadDirectory.bind(this),
      "fs/remove": this.handleFsRemove.bind(this),
      "fs/copy": this.handleFsCopy.bind(this),
      "fs/watch": this.handleFsWatch.bind(this),
      "fs/unwatch": this.handleFsUnwatch.bind(this),
      "skills/config/write": this.handleSkillsConfigWrite.bind(this),
      "plugin/install": this.handlePluginInstall.bind(this),
      "plugin/uninstall": this.handlePluginUninstall.bind(this),
      "turn/start": this.handleTurnStart.bind(this),
      "turn/steer": this.handleTurnSteer.bind(this),
      "turn/interrupt": this.handleTurnInterrupt.bind(this),
      "thread/realtime/start": this.handleThreadRealtimeStart.bind(this),
      "thread/realtime/appendAudio": this.handleThreadRealtimeAppendAudio.bind(this),
      "thread/realtime/appendText": this.handleThreadRealtimeAppendText.bind(this),
      "thread/realtime/appendSpeech": this.handleThreadRealtimeAppendSpeech.bind(this),
      "thread/realtime/stop": this.handleThreadRealtimeStop.bind(this),
      "thread/realtime/listVoices": this.handleThreadRealtimeListVoices.bind(this),
      "review/start": this.handleReviewStart.bind(this),
      "model/list": this.handleModelList.bind(this),
      "modelProvider/capabilities/read": this.handleModelProviderCapabilitiesRead.bind(this),
      "experimentalFeature/list": this.handleExperimentalFeatureList.bind(this),
      "permissionProfile/list": this.handlePermissionProfileList.bind(this),
      "experimentalFeature/enablement/set": this.handleExperimentalFeatureEnablementSet.bind(this),
      "remoteControl/enable": this.handleRemoteControlEnable.bind(this),
      "remoteControl/disable": this.handleRemoteControlDisable.bind(this),
      "remoteControl/status/read": this.handleRemoteControlStatusRead.bind(this),
      "remoteControl/pairing/start": this.handleRemoteControlPairingStart.bind(this),
      "remoteControl/pairing/status": this.handleRemoteControlPairingStatus.bind(this),
      "remoteControl/client/list": this.handleRemoteControlClientList.bind(this),
      "remoteControl/client/revoke": this.handleRemoteControlClientRevoke.bind(this),
      "collaborationMode/list": this.handleCollaborationModeList.bind(this),
      "mock/experimentalMethod": this.handleMockExperimentalMethod.bind(this),
      "environment/add": this.handleEnvironmentAdd.bind(this),
      "environment/info": this.handleEnvironmentInfo.bind(this),
      "environment/status": this.handleEnvironmentStatus.bind(this),
      "mcpServer/oauth/login": this.handleMcpServerOauthLogin.bind(this),
      "config/mcpServer/reload": this.handleConfigMcpServerReload.bind(this),
      "mcpServerStatus/list": this.handleMcpServerStatusList.bind(this),
      "mcpServer/resource/read": this.handleMcpServerResourceRead.bind(this),
      "mcpServer/tool/call": this.handleMcpServerToolCall.bind(this),
      "windowsSandbox/setupStart": this.handleWindowsSandboxSetupStart.bind(this),
      "windowsSandbox/readiness": this.handleWindowsSandboxReadiness.bind(this),
      "account/login/start": this.handleAccountLoginStart.bind(this),
      "account/login/cancel": this.handleAccountLoginCancel.bind(this),
      "account/logout": this.handleAccountLogout.bind(this),
      "account/rateLimits/read": this.handleAccountRateLimitsRead.bind(this),
      "account/rateLimitResetCredit/consume": this.handleAccountRateLimitResetCreditConsume.bind(this),
      "account/usage/read": this.handleAccountUsageRead.bind(this),
      "account/workspaceMessages/read": this.handleAccountWorkspaceMessagesRead.bind(this),
      "account/sendAddCreditsNudgeEmail": this.handleAccountSendAddCreditsNudgeEmail.bind(this),
      "feedback/upload": this.handleFeedbackUpload.bind(this),
      "command/exec": this.handleCommandExec.bind(this),
      "command/exec/write": this.handleCommandExecWrite.bind(this),
      "command/exec/terminate": this.handleCommandExecTerminate.bind(this),
      "command/exec/resize": this.handleCommandExecResize.bind(this),
      "process/spawn": this.handleProcessSpawn.bind(this),
      "process/writeStdin": this.handleProcessWriteStdin.bind(this),
      "process/kill": this.handleProcessKill.bind(this),
      "process/resizePty": this.handleProcessResizePty.bind(this),
      "config/read": this.handleConfigRead.bind(this),
      "externalAgentConfig/detect": this.handleExternalAgentConfigDetect.bind(this),
      "externalAgentConfig/import": this.handleExternalAgentConfigImport.bind(this),
      "externalAgentConfig/import/readHistories": this.handleExternalAgentConfigImportReadHistories.bind(this),
      "config/value/write": this.handleConfigValueWrite.bind(this),
      "config/batchWrite": this.handleConfigBatchWrite.bind(this),
      "configRequirements/read": this.handleConfigRequirementsRead.bind(this),
      "account/read": this.handleAccountRead.bind(this),
      "fuzzyFileSearch": this.handleFuzzyFileSearch.bind(this),
      "fuzzyFileSearch/sessionStart": this.handleFuzzyFileSearchSessionStart.bind(this),
      "fuzzyFileSearch/sessionUpdate": this.handleFuzzyFileSearchSessionUpdate.bind(this),
      "fuzzyFileSearch/sessionStop": this.handleFuzzyFileSearchSessionStop.bind(this),
    };
  }

  // InitializeRequest
  async handleInitialize(params) {
    return {
      name: "DEX AI Replica",
      version: "1.0.0",
      capabilities: ["thread", "fs", "command", "remoteControl", "plugin", "realtime"],
    };
  }

  // Thread/startRequest
  async handleThreadStart(params) {
    const id = require("uuid").v4();
    const t = { id, status: "running", created: new Date().toISOString(), ...params };
    this.threads.set(id, t);
    return { thread: t };
  }

  // Thread/resumeRequest
  async handleThreadResume(params) {
    const t = this.threads.get(params.threadId);
    if (!t) throw new Error("Thread not found");
    t.status = "running";
    return { thread: t };
  }

  // Thread/forkRequest
  async handleThreadFork(params) {
    const newId = require("uuid").v4();
    const old = this.threads.get(params.threadId);
    const t = { id: newId, status: "running", forkedFrom: params.threadId, created: new Date().toISOString() };
    this.threads.set(newId, t);
    return { thread: t };
  }

  // Thread/archiveRequest
  async handleThreadArchive(params) {
    const t = this.threads.get(params.threadId);
    if (t) t.status = "archived";
    return { success: true };
  }

  // Thread/deleteRequest
  async handleThreadDelete(params) {
    this.threads.delete(params.threadId);
    return { success: true };
  }

  // Thread/unsubscribeRequest
  async handleThreadUnsubscribe(params) {
    return { success: true };
  }

  // Thread/incrementElicitationRequest
  async handleThreadIncrement_elicitation(params) {
    return { success: true };
  }

  // Thread/decrementElicitationRequest
  async handleThreadDecrement_elicitation(params) {
    return { success: true };
  }

  // Thread/name/setRequest
  async handleThreadNameSet(params) {
    return { success: true };
  }

  // Thread/goal/setRequest
  async handleThreadGoalSet(params) {
    return { success: true };
  }

  // Thread/goal/getRequest
  async handleThreadGoalGet(params) {
    return { success: true };
  }

  // Thread/goal/clearRequest
  async handleThreadGoalClear(params) {
    return { success: true };
  }

  // Thread/metadata/updateRequest
  async handleThreadMetadataUpdate(params) {
    return { success: true };
  }

  // Thread/settings/updateRequest
  async handleThreadSettingsUpdate(params) {
    return { success: true };
  }

  // Thread/memoryMode/setRequest
  async handleThreadMemoryModeSet(params) {
    return { success: true };
  }

  // Memory/resetRequest
  async handleMemoryReset(params) {
    return { success: true };
  }

  // Thread/unarchiveRequest
  async handleThreadUnarchive(params) {
    return { success: true };
  }

  // Thread/compact/startRequest
  async handleThreadCompactStart(params) {
    return { success: true };
  }

  // Thread/shellCommandRequest
  async handleThreadShellCommand(params) {
    return { success: true };
  }

  // Thread/approveGuardianDeniedActionRequest
  async handleThreadApproveGuardianDeniedAction(params) {
    return { success: true };
  }

  // Thread/backgroundTerminals/cleanRequest
  async handleThreadBackgroundTerminalsClean(params) {
    return { success: true };
  }

  // Thread/backgroundTerminals/listRequest
  async handleThreadBackgroundTerminalsList(params) {
    return { success: true };
  }

  // Thread/backgroundTerminals/terminateRequest
  async handleThreadBackgroundTerminalsTerminate(params) {
    return { success: true };
  }

  // Thread/rollbackRequest
  async handleThreadRollback(params) {
    return { success: true };
  }

  // Thread/listRequest
  async handleThreadList(params) {
    return { threads: Array.from(this.threads.values()) };
  }

  // Thread/searchRequest
  async handleThreadSearch(params) {
    return { threads: [] };
  }

  // Thread/searchOccurrencesRequest
  async handleThreadSearchOccurrences(params) {
    return { success: true };
  }

  // Thread/loaded/listRequest
  async handleThreadLoadedList(params) {
    return { success: true };
  }

  // Thread/readRequest
  async handleThreadRead(params) {
    const t = this.threads.get(params.threadId);
    if (!t) throw new Error("Thread not found: " + params.threadId);
    return { thread: t };
  }

  // Thread/turns/listRequest
  async handleThreadTurnsList(params) {
    return { turns: [] };
  }

  // Thread/items/listRequest
  async handleThreadItemsList(params) {
    return { items: [] };
  }

  // Thread/injectItemsRequest
  async handleThreadInject_items(params) {
    return { success: true };
  }

  // Skills/listRequest
  async handleSkillsList(params) {
    return { skills: [] };
  }

  // Skills/extraRoots/setRequest
  async handleSkillsExtraRootsSet(params) {
    return { success: true };
  }

  // Hooks/listRequest
  async handleHooksList(params) {
    return { hooks: [] };
  }

  // Marketplace/addRequest
  async handleMarketplaceAdd(params) {
    return { success: true };
  }

  // Marketplace/removeRequest
  async handleMarketplaceRemove(params) {
    return { success: true };
  }

  // Marketplace/upgradeRequest
  async handleMarketplaceUpgrade(params) {
    return { success: true };
  }

  // Plugin/listRequest
  async handlePluginList(params) {
    return { plugins: [] };
  }

  // Plugin/installedRequest
  async handlePluginInstalled(params) {
    return { plugins: [] };
  }

  // Plugin/readRequest
  async handlePluginRead(params) {
    return { plugin: null };
  }

  // Plugin/skill/readRequest
  async handlePluginSkillRead(params) {
    return { success: true };
  }

  // Plugin/share/saveRequest
  async handlePluginShareSave(params) {
    return { success: true };
  }

  // Plugin/share/updateTargetsRequest
  async handlePluginShareUpdateTargets(params) {
    return { success: true };
  }

  // Plugin/share/listRequest
  async handlePluginShareList(params) {
    return { success: true };
  }

  // Plugin/share/checkoutRequest
  async handlePluginShareCheckout(params) {
    return { success: true };
  }

  // Plugin/share/deleteRequest
  async handlePluginShareDelete(params) {
    return { success: true };
  }

  // App/readRequest
  async handleAppRead(params) {
    return { apps: [], app: null };
  }

  // App/listRequest
  async handleAppList(params) {
    return { apps: [], app: null };
  }

  // App/installedRequest
  async handleAppInstalled(params) {
    return { apps: [], app: null };
  }

  // Fs/readFileRequest
  async handleFsReadFile(params) {
    return { content: fs.readFileSync(params.path, "utf-8") };
  }

  // Fs/writeFileRequest
  async handleFsWriteFile(params) {
    fs.writeFileSync(params.path, params.content, "utf-8");
    return { success: true };
  }

  // Fs/createDirectoryRequest
  async handleFsCreateDirectory(params) {
    fs.mkdirSync(params.path, { recursive: true });
    return { success: true };
  }

  // Fs/getMetadataRequest
  async handleFsGetMetadata(params) {
    const stat = fs.statSync(params.path);
    return { size: stat.size, modified: stat.mtime.toISOString(), created: stat.birthtime.toISOString(), isDirectory: stat.isDirectory() };
  }

  // Fs/readDirectoryRequest
  async handleFsReadDirectory(params) {
    const items = fs.readdirSync(params.path, { withFileTypes: true });
    return { entries: items.map(i => ({ name: i.name, type: i.isDirectory() ? "directory" : "file" })) };
  }

  // Fs/removeRequest
  async handleFsRemove(params) {
    fs.rmSync(params.path, { recursive: true, force: true });
    return { success: true };
  }

  // Fs/copyRequest
  async handleFsCopy(params) {
    fs.cpSync(params.source, params.destination, { recursive: true });
    return { success: true };
  }

  // Fs/watchRequest
  async handleFsWatch(params) {
    return { success: true };
  }

  // Fs/unwatchRequest
  async handleFsUnwatch(params) {
    return { success: true };
  }

  // Skills/config/writeRequest
  async handleSkillsConfigWrite(params) {
    return { success: true };
  }

  // Plugin/installRequest
  async handlePluginInstall(params) {
    return { success: true };
  }

  // Plugin/uninstallRequest
  async handlePluginUninstall(params) {
    return { success: true };
  }

  // Turn/startRequest
  async handleTurnStart(params) {
    return { success: true };
  }

  // Turn/steerRequest
  async handleTurnSteer(params) {
    return { success: true };
  }

  // Turn/interruptRequest
  async handleTurnInterrupt(params) {
    return { success: true };
  }

  // Thread/realtime/startRequest
  async handleThreadRealtimeStart(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Thread/realtime/appendAudioRequest
  async handleThreadRealtimeAppendAudio(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Thread/realtime/appendTextRequest
  async handleThreadRealtimeAppendText(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Thread/realtime/appendSpeechRequest
  async handleThreadRealtimeAppendSpeech(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Thread/realtime/stopRequest
  async handleThreadRealtimeStop(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Thread/realtime/listVoicesRequest
  async handleThreadRealtimeListVoices(params) {
    return { success: true, sessionId: require("uuid").v4() };
  }

  // Review/startRequest
  async handleReviewStart(params) {
    return { reviewId: require("uuid").v4() };
  }

  // Model/listRequest
  async handleModelList(params) {
    return { models: [{ id: "gpt-4", name: "GPT-4" }, { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }, { id: "claude-3", name: "Claude 3" }] };
  }

  // ModelProvider/capabilities/readRequest
  async handleModelProviderCapabilitiesRead(params) {
    return { capabilities: [] };
  }

  // ExperimentalFeature/listRequest
  async handleExperimentalFeatureList(params) {
    return { features: [] };
  }

  // PermissionProfile/listRequest
  async handlePermissionProfileList(params) {
    return { profiles: [] };
  }

  // ExperimentalFeature/enablement/setRequest
  async handleExperimentalFeatureEnablementSet(params) {
    return { success: true };
  }

  // RemoteControl/enableRequest
  async handleRemoteControlEnable(params) {
    return { status: "enabled", pairingCode: Math.random().toString(36).substring(2, 8).toUpperCase() };
  }

  // RemoteControl/disableRequest
  async handleRemoteControlDisable(params) {
    return { success: true };
  }

  // RemoteControl/status/readRequest
  async handleRemoteControlStatusRead(params) {
    return { enabled: true, pairedDevices: 0 };
  }

  // RemoteControl/pairing/startRequest
  async handleRemoteControlPairingStart(params) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { pairingCode: code, expiresIn: 300 };
  }

  // RemoteControl/pairing/statusRequest
  async handleRemoteControlPairingStatus(params) {
    return { status: "waiting", expiresIn: 250 };
  }

  // RemoteControl/client/listRequest
  async handleRemoteControlClientList(params) {
    return { clients: [] };
  }

  // RemoteControl/client/revokeRequest
  async handleRemoteControlClientRevoke(params) {
    return { success: true };
  }

  // CollaborationMode/listRequest
  async handleCollaborationModeList(params) {
    return { modes: ["default", "plan"] };
  }

  // Mock/experimentalMethodRequest
  async handleMockExperimentalMethod(params) {
    return { success: true };
  }

  // Environment/addRequest
  async handleEnvironmentAdd(params) {
    return { success: true };
  }

  // Environment/infoRequest
  async handleEnvironmentInfo(params) {
    return { os: process.platform, arch: process.arch, node: process.version };
  }

  // Environment/statusRequest
  async handleEnvironmentStatus(params) {
    return { success: true };
  }

  // McpServer/oauth/loginRequest
  async handleMcpServerOauthLogin(params) {
    return { success: true };
  }

  // Config/mcpServer/reloadRequest
  async handleConfigMcpServerReload(params) {
    return { success: true };
  }

  // McpServerStatus/listRequest
  async handleMcpServerStatusList(params) {
    return { servers: [] };
  }

  // McpServer/resource/readRequest
  async handleMcpServerResourceRead(params) {
    return { contents: [] };
  }

  // McpServer/tool/callRequest
  async handleMcpServerToolCall(params) {
    return { result: null };
  }

  // WindowsSandbox/setupStartRequest
  async handleWindowsSandboxSetupStart(params) {
    return { success: true, ready: false };
  }

  // WindowsSandbox/readinessRequest
  async handleWindowsSandboxReadiness(params) {
    return { success: true, ready: false };
  }

  // Account/login/startRequest
  async handleAccountLoginStart(params) {
    return { url: "http://localhost:7443/login", code: "dev-mode" };
  }

  // Account/login/cancelRequest
  async handleAccountLoginCancel(params) {
    return { success: true };
  }

  // Account/logoutRequest
  async handleAccountLogout(params) {
    return { success: true };
  }

  // Account/rateLimits/readRequest
  async handleAccountRateLimitsRead(params) {
    return { limits: {}, usage: {} };
  }

  // Account/rateLimitResetCredit/consumeRequest
  async handleAccountRateLimitResetCreditConsume(params) {
    return { limits: {}, usage: {} };
  }

  // Account/usage/readRequest
  async handleAccountUsageRead(params) {
    return { limits: {}, usage: {} };
  }

  // Account/workspaceMessages/readRequest
  async handleAccountWorkspaceMessagesRead(params) {
    return { messages: [], success: true };
  }

  // Account/sendAddCreditsNudgeEmailRequest
  async handleAccountSendAddCreditsNudgeEmail(params) {
    return { messages: [], success: true };
  }

  // Feedback/uploadRequest
  async handleFeedbackUpload(params) {
    return { success: true };
  }

  // Command/execRequest
  async handleCommandExec(params) {
    const { execSync, spawn } = require("child_process");
    const pid = Date.now();
    this.processes.set(pid, { id: pid, status: "running", command: params.command, started: new Date().toISOString() });
    return { processId: pid, status: "started" };
  }

  // Command/exec/writeRequest
  async handleCommandExecWrite(params) {
    return { success: true };
  }

  // Command/exec/terminateRequest
  async handleCommandExecTerminate(params) {
    return { success: true };
  }

  // Command/exec/resizeRequest
  async handleCommandExecResize(params) {
    return { success: true };
  }

  // Process/spawnRequest
  async handleProcessSpawn(params) {
    const pid = Date.now();
    this.processes.set(pid, { id: pid, status: "running" });
    return { processId: pid };
  }

  // Process/writeStdinRequest
  async handleProcessWriteStdin(params) {
    return { success: true };
  }

  // Process/killRequest
  async handleProcessKill(params) {
    return { success: true };
  }

  // Process/resizePtyRequest
  async handleProcessResizePty(params) {
    return { success: true };
  }

  // Config/readRequest
  async handleConfigRead(params) {
    return { config: this.config };
  }

  // ExternalAgentConfig/detectRequest
  async handleExternalAgentConfigDetect(params) {
    return { success: true, configs: [] };
  }

  // ExternalAgentConfig/importRequest
  async handleExternalAgentConfigImport(params) {
    return { success: true, configs: [] };
  }

  // ExternalAgentConfig/import/readHistoriesRequest
  async handleExternalAgentConfigImportReadHistories(params) {
    return { success: true, configs: [] };
  }

  // Config/value/writeRequest
  async handleConfigValueWrite(params) {
    Object.assign(this.config, params);
    return { success: true };
  }

  // Config/batchWriteRequest
  async handleConfigBatchWrite(params) {
    Object.assign(this.config, params);
    return { success: true };
  }

  // ConfigRequirements/readRequest
  async handleConfigRequirementsRead(params) {
    return { requirements: [] };
  }

  // Account/readRequest
  async handleAccountRead(params) {
    return { account: { id: "local-dev", name: "Local Developer", email: "dev@local", plan: "free" } };
  }

  // FuzzyFileSearchRequest
  async handleFuzzyFileSearch(params) {
    return { results: [] };
  }

  // FuzzyFileSearch/sessionStartRequest
  async handleFuzzyFileSearchSessionStart(params) {
    return { sessionId: require("uuid").v4() };
  }

  // FuzzyFileSearch/sessionUpdateRequest
  async handleFuzzyFileSearchSessionUpdate(params) {
    return { success: true };
  }

  // FuzzyFileSearch/sessionStopRequest
  async handleFuzzyFileSearchSessionStop(params) {
    return { success: true };
  }

}

module.exports = { RpcHandlers };
