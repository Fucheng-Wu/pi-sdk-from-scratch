import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();

// 知道 provider/id 时，直接查找内置模型。
const opus = modelRuntime.getModel("anthropic", "claude-opus-4-5");
if (opus) {
  console.log(`Found model: ${opus.provider}/${opus.id}`);
}

// models.json 注册的自定义模型走同一个查找入口。
const customModel = modelRuntime.getModel("my-provider", "my-model");
if (customModel) {
  console.log(`Found custom model: ${customModel.provider}/${customModel.id}`);
}

// 已注册的模型不一定拥有有效认证；getAvailable() 只返回当前可调用的模型。
const available = await modelRuntime.getAvailable();
console.log("Available models:", available.map((model) => `${model.provider}/${model.id}`));

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
