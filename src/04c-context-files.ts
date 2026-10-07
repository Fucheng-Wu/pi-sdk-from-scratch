import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  agentsFilesOverride: (current) => ({
    agentsFiles: [
      ...current.agentsFiles,
      {
        path: "/virtual/AGENTS.md",
        content: "# Project rules\n\n- Use TypeScript strict mode\n- Prefer const over let",
      },
    ],
  }),
});
await loader.reload();

const { agentsFiles } = loader.getAgentsFiles();
console.log(agentsFiles.map((file) => file.path));
const { session } = await createAgentSession({ resourceLoader: loader, sessionManager: SessionManager.inMemory() });
session.dispose();
