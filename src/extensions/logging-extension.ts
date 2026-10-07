import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function loggingExtension(pi: ExtensionAPI) {
  pi.on("agent_start", () => console.log("[file] Agent is starting"));
  pi.on("tool_call", (event) => {
    console.log(`[file] Tool: ${event.toolName}`);
    return undefined;
  });
  pi.on("agent_end", (event) => console.log(`[file] Agent ended with ${event.messages.length} messages`));
}
