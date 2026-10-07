import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();
const resourceLoader = new DefaultResourceLoader({ cwd, agentDir: getAgentDir() });
await resourceLoader.reload();

const { session, extensionsResult, modelFallbackMessage } = await createAgentSession({
  cwd,
  // 传入 tools 后它成为白名单；excludeTools 可在此基础上继续排除。
  tools: ["read", "grep", "find", "ls"],
  excludeTools: ["find"],
  thinkingLevel: "medium",
  resourceLoader,
  settingsManager: SettingsManager.inMemory(),
  sessionManager: SessionManager.inMemory(),
  // model / modelRuntime / customTools / noTools 也可在这里按产品需求提供。
});

try {
  console.log("Loaded extensions:", extensionsResult.extensions.length);
  console.log("Model fallback:", modelFallbackMessage ?? "none");
  console.log("Active tools:", session.getActiveToolNames());

  // prompt() 等待本轮结束；运行中要改变方向时使用 steer()，结束后追加使用 followUp()。
  // await session.steer("停止当前路线，只检查 src 目录。");
  // await session.followUp("然后用三句话总结。");
} finally {
  session.dispose();
}
