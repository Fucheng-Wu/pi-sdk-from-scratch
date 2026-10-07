import { createAgentSession, SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();
const settingsFromDisk = SettingsManager.create(cwd);
console.log("Merged settings:", settingsFromDisk.getGlobalSettings());

// applyOverrides() 只覆盖内存中的有效设置，不需要立即写盘。
settingsFromDisk.applyOverrides({
  compaction: { enabled: false },
  retry: { enabled: true, maxRetries: 5, baseDelayMs: 1_000 },
});

const { session } = await createAgentSession({
  settingsManager: settingsFromDisk,
  sessionManager: SessionManager.inMemory(),
});
session.dispose();

// 只有宿主明确希望保存用户设置时才启用写盘边界。
if (process.env.WRITE_SETTINGS === "1") {
  settingsFromDisk.setDefaultThinkingLevel("low");
  await settingsFromDisk.flush();
}

for (const { scope, error } of settingsFromDisk.drainErrors()) {
  console.warn(`Settings I/O error (${scope}): ${error.message}`);
}

// 测试场景完全不需要文件 I/O。
const testSettings = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } });
const { session: testSession } = await createAgentSession({
  settingsManager: testSettings,
  sessionManager: SessionManager.inMemory(),
});
testSession.dispose();
