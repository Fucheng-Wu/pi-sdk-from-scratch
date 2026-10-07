import {
  createAgentSession,
  createSyntheticSourceInfo,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
  type Skill,
} from "@earendil-works/pi-coding-agent";

const customSkill: Skill = {
  name: "review-checklist",
  description: "A compact checklist for reviewing a TypeScript change.",
  filePath: "/virtual/skills/review-checklist/SKILL.md",
  baseDir: "/virtual/skills/review-checklist",
  sourceInfo: createSyntheticSourceInfo("/virtual/skills/review-checklist/SKILL.md", { source: "sdk" }),
  disableModelInvocation: false,
};

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  skillsOverride: (current) => {
    const selected = current.skills.filter((skill) => skill.name.includes("search"));
    return { skills: [...selected, customSkill], diagnostics: current.diagnostics };
  },
});
await loader.reload();

console.log(loader.getSkills().skills.map((skill) => skill.name));
const { session } = await createAgentSession({ resourceLoader: loader, sessionManager: SessionManager.inMemory() });
session.dispose();
