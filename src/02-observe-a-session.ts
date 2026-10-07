import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});

try {
  const unsubscribe = session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  await session.prompt("列出当前目录里的 TypeScript 文件。");
  unsubscribe();

  console.log("\n\nSystem prompt:", session.systemPrompt);
  console.log("Active tools:", session.getActiveToolNames());
  console.log("Model:", session.model?.id);
  console.log("Thinking level:", session.thinkingLevel);
  console.log("Full message history:\n", JSON.stringify(session.state.messages, null, 2));
} finally {
  session.dispose();
}
