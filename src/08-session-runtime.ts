import {
  type CreateAgentSessionRuntimeFactory,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

const createRuntime: CreateAgentSessionRuntimeFactory = async ({ cwd, sessionManager, sessionStartEvent }) => {
  const services = await createAgentSessionServices({ cwd });
  return {
    ...(await createAgentSessionFromServices({ services, sessionManager, sessionStartEvent })),
    services,
    diagnostics: services.diagnostics,
  };
};

const runtime = await createAgentSessionRuntime(createRuntime, {
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  sessionManager: SessionManager.create(process.cwd()),
});

let unsubscribe: (() => void) | undefined;
async function bindCurrentSession() {
  unsubscribe?.();
  const session = runtime.session;
  await session.bindExtensions({});
  unsubscribe = session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });
  return session;
}

try {
  let session = await bindCurrentSession();
  await session.prompt("用一句话介绍当前工作目录。");
  const originalSessionFile = session.sessionFile;

  await runtime.newSession();
  session = await bindCurrentSession(); // runtime.session 已变化，必须重新绑定。
  await session.prompt("这是一个新会话，请确认。");

  if (originalSessionFile) {
    await runtime.switchSession(originalSessionFile);
    await bindCurrentSession();
  }

  // UI 拿到消息 entry id 后，也可调用 runtime.fork(entryId) 分叉历史。
  // 导入其他 JSONL：await runtime.importFromJsonl("/path/to/session.jsonl");
} finally {
  unsubscribe?.();
  await runtime.dispose();
}
