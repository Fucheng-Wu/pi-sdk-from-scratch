import { fileURLToPath } from "node:url";
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

const extensionPath = fileURLToPath(new URL("./extensions/logging-extension.ts", import.meta.url));
const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  // 外部文件和内联工厂都会被加载；只是来源不同。
  additionalExtensionPaths: [extensionPath],
  extensionFactories: [
    (pi) => {
      pi.on("agent_start", () => console.log("[inline] Agent is starting"));
    },
  ],
});
await loader.reload();

const { session } = await createAgentSession({ resourceLoader: loader, sessionManager: SessionManager.inMemory() });
try {
  await session.bindExtensions({});
} finally {
  session.dispose();
}
