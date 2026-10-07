import {
  createAgentSession,
  createSyntheticSourceInfo,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
  type PromptTemplate,
} from "@earendil-works/pi-coding-agent";

const deploy: PromptTemplate = {
  name: "deploy",
  description: "Prepare this application for deployment.",
  filePath: "/virtual/prompts/deploy.md",
  sourceInfo: createSyntheticSourceInfo("/virtual/prompts/deploy.md", { source: "sdk" }),
  content: "# Deploy instructions\n\n1. Run tests\n2. Build the application\n3. Summarize risks",
};

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  promptsOverride: (current) => ({
    prompts: [...current.prompts, deploy],
    diagnostics: current.diagnostics,
  }),
});
await loader.reload();

console.log(loader.getPrompts().prompts.map((prompt) => `/${prompt.name}`));
const { session } = await createAgentSession({ resourceLoader: loader, sessionManager: SessionManager.inMemory() });
session.dispose();
