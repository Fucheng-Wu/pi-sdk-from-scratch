/**
 * Full Control（完全掌控）
 *
 * 参考官方示例 packages/coding-agent/examples/sdk/12-full-control.ts：
 * Replace everything - no discovery, explicit configuration.
 * 不用任何自动发现，全部显式配置。
 */

import { getModel } from "@earendil-works/pi-ai/compat";
import {
  createAgentSession,
  createExtensionRuntime,
  ModelRuntime,
  type ResourceLoader,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

// 认证与模型清单也由宿主自己指定，不读取本机 pi 的全局配置。
const modelRuntime = await ModelRuntime.create({
  authPath: "/tmp/pi-sdk-from-scratch-control/auth.json",
  modelsPath: "/tmp/pi-sdk-from-scratch-control/models.json",
});
if (process.env.MY_ANTHROPIC_KEY) {
  await modelRuntime.setRuntimeApiKey("anthropic", process.env.MY_ANTHROPIC_KEY);
}

// 从内置目录精确取模型；getModel 只查目录，不校验认证。
const model = getModel("anthropic", "claude-sonnet-4-5");
if (!model) throw new Error("Model not found");

// 内存设置：不读也不写磁盘 settings.json。
const settingsManager = SettingsManager.inMemory({
  compaction: { enabled: false },
  retry: { enabled: true, maxRetries: 2 },
});

const cwd = process.cwd();

// 手写 ResourceLoader：没有任何发现，返回空列表就意味着“没有这类资源”。
const resourceLoader: ResourceLoader = {
  getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
  getSkills: () => ({ skills: [], diagnostics: [] }),
  getPrompts: () => ({ prompts: [], diagnostics: [] }),
  getThemes: () => ({ themes: [], diagnostics: [] }),
  getAgentsFiles: () => ({ agentsFiles: [] }),
  getSystemPrompt: () => `You are a minimal assistant.
Available: read, bash. Be concise.`,
  getSystemPromptSource: () => undefined,
  getAppendSystemPrompt: () => [],
  getAppendSystemPromptSources: () => [],
  extendResources: () => {},
  reload: async () => {},
};

// 所有装配参数在同一次调用里显式给出。
const { session } = await createAgentSession({
  cwd,
  agentDir: "/tmp/pi-sdk-from-scratch-control/agent",
  model,
  thinkingLevel: "off",
  modelRuntime,
  resourceLoader,
  // 白名单只保留 read 与 bash，工具能力最小化。
  tools: ["read", "bash"],
  sessionManager: SessionManager.inMemory(cwd),
  settingsManager,
});

try {
  session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  await session.prompt("List files in the current directory.");
  console.log();
} finally {
  session.dispose();
}
