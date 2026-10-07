import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

function teachingExtension(pi: ExtensionAPI) {
  pi.on("agent_start", () => console.log("Agent started"));
  pi.on("tool_call", (event) => {
    console.log(`Calling: ${event.toolName}`);
    return undefined;
  });
  pi.on("agent_end", (event) => console.log(`Agent ended with ${event.messages.length} messages`));

  pi.registerTool({
    name: "project_glossary",
    label: "Project Glossary",
    description: "Look up a short definition used by this project.",
    parameters: Type.Object({ term: Type.String() }),
    execute: async (_id, { term }) => ({
      content: [{ type: "text", text: `${term}: a teaching-only example definition.` }],
      details: {},
    }),
  });

  pi.registerCommand("glossary", {
    description: "Show the project glossary command in the host UI.",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Glossary command received: ${args || "(no term)"}`);
    },
  });
}

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  extensionFactories: [teachingExtension],
});
await loader.reload();

const { session } = await createAgentSession({
  resourceLoader: loader,
  sessionManager: SessionManager.inMemory(),
});
session.dispose();
