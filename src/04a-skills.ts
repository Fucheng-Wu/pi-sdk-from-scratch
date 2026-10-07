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
    // current 是加载器已扫描到的技能集合：只保留 browser / search 相关，再追加自定义技能。
    const selected = current.skills.filter(
      (skill) => skill.name.includes("browser") || skill.name.includes("search"),
    );
    return { skills: [...selected, customSkill], diagnostics: current.diagnostics };
  },
});
await loader.reload();

const { skills: allSkills, diagnostics } = loader.getSkills();
console.log("Discovered skills:", allSkills.map((skill) => skill.name));
if (diagnostics.length > 0) {
  console.warn("Warnings:", diagnostics);
}
const { session } = await createAgentSession({ resourceLoader: loader, sessionManager: SessionManager.inMemory() });
session.dispose();
