import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

// 一次性任务通常不需要保存历史；把会话放在内存即可。
const { session } = await createAgentSession({
  cwd: process.cwd(),
  sessionManager: SessionManager.inMemory(),
});

try {
  await session.prompt("请用一句话说明当前目录适合做什么。");
  console.log(session.getLastAssistantText());
} finally {
  // 不管成功、失败还是用户中断，都要释放会话和扩展上下文。
  session.dispose();
}
