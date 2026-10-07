import { createAgentSession, SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";

// 测试使用 inMemory：它验证配置，不污染用户级或项目级 settings.json。
const settingsManager = SettingsManager.inMemory({
  compaction: { enabled: false },
  retry: { enabled: true, maxRetries: 2, baseDelayMs: 1_000 },
});

const { session } = await createAgentSession({
  settingsManager,
  sessionManager: SessionManager.inMemory(),
});
session.dispose();

// 真正要恢复历史时，才选择磁盘持久化：
const persistent = SessionManager.create(process.cwd());
console.log("Persistent session manager created:", Boolean(persistent));
