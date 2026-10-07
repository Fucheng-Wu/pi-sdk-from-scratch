import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();

const { session: inMemory } = await createAgentSession({ sessionManager: SessionManager.inMemory() });
console.log("In-memory file:", inMemory.sessionFile ?? "(none)");
inMemory.dispose();

const { session: fresh } = await createAgentSession({ sessionManager: SessionManager.create(cwd) });
console.log("New persistent session:", fresh.sessionFile);
fresh.dispose();

const { session: continued, modelFallbackMessage } = await createAgentSession({
  sessionManager: SessionManager.continueRecent(cwd),
});
console.log("Continued session:", continued.sessionFile);
if (modelFallbackMessage) console.log("Model fallback:", modelFallbackMessage);
continued.dispose();

// list() 返回会话元数据（含 id、firstMessage、path），可先展示再按精确路径打开。
const sessions = await SessionManager.list(cwd);
console.log(`Known sessions: ${sessions.length}`);
for (const info of sessions.slice(0, 3)) {
  console.log(`  ${info.id.slice(0, 8)}... - "${info.firstMessage.slice(0, 30)}..."`);
}
if (sessions[0]) {
  const { session: opened } = await createAgentSession({ sessionManager: SessionManager.open(sessions[0].path) });
  console.log("Opened:", opened.sessionId);
  opened.dispose();
}

const customDirectory = "/tmp/pi-sdk-from-scratch-sessions";
SessionManager.create(cwd, customDirectory);
await SessionManager.list(cwd, customDirectory);
SessionManager.continueRecent(cwd, customDirectory);
