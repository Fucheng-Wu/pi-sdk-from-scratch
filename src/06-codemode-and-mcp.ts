import {
  createAgentSession,
  createCodemodeExtension,
  createMcpExtension,
  createToolSearchExtension,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();
const resourceLoader = new DefaultResourceLoader({
  cwd,
  agentDir: getAgentDir(),
  extensionFactories: [
    createCodemodeExtension({ mode: "on" }),
    createToolSearchExtension(),
    createMcpExtension(),
  ],
});
await resourceLoader.reload();

const settingsManager = SettingsManager.create(cwd);
// 使用 + 追加工具。若传入 tools 白名单，MCP 暴露的动态工具可能被排除。
settingsManager.applyOverrides({ defaultTools: ["+codemode", "+tool_search"] });

const { session } = await createAgentSession({
  resourceLoader,
  settingsManager,
  sessionManager: SessionManager.inMemory(),
});

try {
  await session.bindExtensions({});
  console.log(session.getActiveToolNames());
} finally {
  session.dispose();
}
