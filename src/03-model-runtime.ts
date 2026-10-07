import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();

// 已注册的模型不一定拥有有效认证；getAvailable() 只返回当前可调用的模型。
const available = await modelRuntime.getAvailable();
console.log(available.map((model) => `${model.provider}/${model.id}`));

if (available.length > 0) {
  const { session } = await createAgentSession({
    modelRuntime,
    model: available[0],
    thinkingLevel: "medium",
    sessionManager: SessionManager.inMemory(),
  });

  try {
    await session.prompt("用一句话确认已准备好。");
    console.log(session.getLastAssistantText());
  } finally {
    session.dispose();
  }
}
