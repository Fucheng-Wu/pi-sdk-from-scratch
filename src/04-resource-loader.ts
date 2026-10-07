import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();
const agentDir = getAgentDir();

// 方案一：完全替换默认系统提示词；同时禁用默认追加文件，避免混入额外指令。
const replacementLoader = new DefaultResourceLoader({
  cwd,
  agentDir,
  systemPromptOverride: () => "You are a concise coding assistant. Reply in Chinese.",
  appendSystemPromptOverride: () => [],
});
await replacementLoader.reload();

const { session: replacementSession } = await createAgentSession({
  resourceLoader: replacementLoader,
  sessionManager: SessionManager.inMemory(),
});
replacementSession.dispose();

// 方案二：保留 Pi 默认行为规则，只在末尾追加项目约束；大多数宿主应优先选它。
const appendedLoader = new DefaultResourceLoader({
  cwd,
  agentDir,
  appendSystemPromptOverride: (base) => [
    ...base,
    "## Project rule\n- Explain important decisions in concise Chinese.",
  ],
});
await appendedLoader.reload();
console.log("Discovered skills:", appendedLoader.getSkills().skills.map((skill) => skill.name));

const { session: appendedSession } = await createAgentSession({
  resourceLoader: appendedLoader,
  sessionManager: SessionManager.inMemory(),
});
appendedSession.dispose();
