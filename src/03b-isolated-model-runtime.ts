import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

// 将宿主应用的认证和模型清单放到自己的目录，避免与用户全局 pi 配置混用。
const runtime = await ModelRuntime.create({
  authPath: "/tmp/pi-sdk-from-scratch/auth.json",
  modelsPath: "/tmp/pi-sdk-from-scratch/models.json",
});

// 临时 Key 只保留在运行时；绝不要把真实 Key 写在源代码或提交到仓库。
if (process.env.MY_ANTHROPIC_KEY) {
  await runtime.setRuntimeApiKey("anthropic", process.env.MY_ANTHROPIC_KEY);
}

const { session } = await createAgentSession({
  modelRuntime: runtime,
  sessionManager: SessionManager.inMemory(),
});
session.dispose();
